import { execFile, type ExecFileException } from "node:child_process";
import { mkdtemp, mkdir, readdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

const execFileAsync = promisify(execFile);
const rootDir = path.dirname(fileURLToPath(import.meta.url));

let mutableFixtureDir: string = "";

beforeAll(async () => {
  mutableFixtureDir = await mkdtemp(path.join(tmpdir(), "oxlint-config-divid-"));
  // oxlint.config.js does `import { defineConfig } from "oxlint"`, which Node resolves
  // relative to the config file's own location, so the fixture needs its own node_modules.
  await mkdir(path.join(mutableFixtureDir, "node_modules"));
  // The plugin's `jsPlugins` entry is a bare package specifier ("oxlint-config-divid/..."), the
  // same way a real consumer's node_modules would resolve it - this package's own "oxlint-config-
  // divid": "link:." devDependency (used for the self-lint config at the repo root) already makes
  // node_modules/oxlint-config-divid a self-referencing symlink, so copying the whole node_modules
  // below carries that self-reference into the fixture too.
  for (const entry of await readdir(path.join(rootDir, "..", "node_modules"))) {
    await symlink(path.join(rootDir, "..", "node_modules", entry), path.join(mutableFixtureDir, "node_modules", entry), "dir");
  }
  await writeFile(
    path.join(mutableFixtureDir, "oxlint.config.js"),
    `import { defineConfig } from "oxlint";\nimport dividConfig from ${JSON.stringify(
      path.join(rootDir, "..", "lib", "index.js")
    )};\n\nexport default defineConfig({ extends: [dividConfig] });\n`
  );
});

afterAll(async () => {
  await rm(mutableFixtureDir, { recursive: true, force: true });
});

async function printConfig(): Promise<Record<string, unknown> & { readonly rules: Record<string, string> }> {
  // oxlint only auto-discovers `.oxlintrc.json`; a JS/TS config must be passed via -c
  // explicitly, otherwise it silently falls back to oxlint's built-in default config.
  const { stdout } = await execFileAsync("npx", ["oxlint", "-c", "oxlint.config.js", "--print-config", "."], {
    cwd: mutableFixtureDir,
  });
  return JSON.parse(stdout) as Record<string, unknown> & { readonly rules: Record<string, string> };
}

async function lint(filename: string, source: string): Promise<{ readonly exitCode: string | number | null; readonly output: string }> {
  await writeFile(path.join(mutableFixtureDir, filename), source);
  try {
    // `-f json` keeps this parseable regardless of the human-readable summary banner oxlint
    // prints on some environments (e.g. it's suppressed when it detects it's running under an
    // AI agent, which made a plain-text empty-output check pass locally but fail in CI).
    const { stdout } = await execFileAsync("npx", ["oxlint", "-c", "oxlint.config.js", "-f", "json", filename], { cwd: mutableFixtureDir });
    return { exitCode: 0, output: stdout };
  } catch (error) {
    const execError = error as ExecFileException & { stdout: string };
    return { exitCode: execError.code ?? null, output: execError.stdout };
  }
}

describe("Validate oxlint config", () => {
  it("loads lib/index.js in oxlint without configuration errors", async () => {
    await expect(printConfig()).resolves.not.toThrow();
  });

  it("actually applies the divid rule set, not oxlint's defaults", async () => {
    const config = await printConfig();
    expect(config.rules["prefer-const"]).toBe("deny");
    expect(config.rules["typescript/no-explicit-any"]).toBe("deny");
    expect(config.rules["import/no-cycle"]).toBe("deny");
    // `--print-config` doesn't enumerate jsPlugins-provided rules (e.g. `functional/no-let`) at
    // all, even when the plugin loads and runs correctly - see the "flags violations" test below
    // for the real end-to-end check of the bundled functional plugin.
  });

  it("flags violations of the ported rules", async () => {
    const { exitCode, output } = await lint(
      "violations.ts",
      [
        `import { readFileSync } from "node:fs";`,
        `import { readFileSync as rf2 } from "node:fs";`,
        ``,
        `let unused = 1;`,
        `export function f(): any {`,
        `  eval("1");`,
        `  return void 0;`,
        `}`,
        `console.log(unused, readFileSync, rf2, f);`,
        ``,
      ].join("\n")
    );

    expect(exitCode).toBe(1);
    expect(output).toContain("import(no-duplicates)"); // ported from imports/style-guide.js
    expect(output).toContain("eslint(prefer-const)"); // ported from core/es6.js
    expect(output).toContain("typescript(no-explicit-any)"); // ported from typescript-eslint/all.js
    expect(output).toContain("eslint(no-eval)"); // ported from core/best-practices.js
    expect(output).toContain("eslint(no-void)"); // ported from core/best-practices.js
    expect(output).toContain("functional(no-let)"); // ported from eslint-plugin-functional
  });

  it("does not flag idiomatic, rule-compliant TypeScript", async () => {
    const { exitCode, output } = await lint(
      "clean.ts",
      [`export function add(a: number, b: number): number {`, `  return a + b;`, `}`, ``, `export const result = add(1, 2);`, ``].join("\n")
    );

    expect(JSON.parse(output).diagnostics).toEqual([]);
    expect(exitCode).toBe(0);
  });
});
