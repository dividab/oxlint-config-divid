import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readdir, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

const execFileAsync = promisify(execFile);
const rootDir = path.dirname(fileURLToPath(import.meta.url));

let fixtureDir;

beforeAll(async () => {
  fixtureDir = await mkdtemp(path.join(tmpdir(), "oxlint-config-divid-"));
  // oxlint.config.js does `import { defineConfig } from "oxlint"`, which Node resolves
  // relative to the config file's own location, so the fixture needs its own node_modules.
  await mkdir(path.join(fixtureDir, "node_modules"));
  for (const entry of await readdir(path.join(rootDir, "..", "node_modules"))) {
    await symlink(path.join(rootDir, "..", "node_modules", entry), path.join(fixtureDir, "node_modules", entry), "dir");
  }
  // The plugin's `jsPlugins` entry is a bare package specifier ("oxlint-config-divid/..."), the
  // same way a real consumer's node_modules would resolve it - so the fixture needs a
  // self-reference too, since this package isn't (and shouldn't be) a dependency of itself.
  await symlink(path.join(rootDir, ".."), path.join(fixtureDir, "node_modules", "oxlint-config-divid"), "dir");
  await writeFile(
    path.join(fixtureDir, "oxlint.config.js"),
    `import { defineConfig } from "oxlint";\nimport dividConfig from ${JSON.stringify(
      path.join(rootDir, "..", "index.js")
    )};\n\nexport default defineConfig({ extends: [dividConfig] });\n`
  );
});

afterAll(async () => {
  await rm(fixtureDir, { recursive: true, force: true });
});

async function printConfig() {
  // oxlint only auto-discovers `.oxlintrc.json`; a JS/TS config must be passed via -c
  // explicitly, otherwise it silently falls back to oxlint's built-in default config.
  const { stdout } = await execFileAsync("npx", ["oxlint", "-c", "oxlint.config.js", "--print-config", "."], {
    cwd: fixtureDir,
  });
  return JSON.parse(stdout);
}

async function lint(filename, source) {
  await writeFile(path.join(fixtureDir, filename), source);
  try {
    // `-f json` keeps this parseable regardless of the human-readable summary banner oxlint
    // prints on some environments (e.g. it's suppressed when it detects it's running under an
    // AI agent, which made a plain-text empty-output check pass locally but fail in CI).
    const { stdout } = await execFileAsync("npx", ["oxlint", "-c", "oxlint.config.js", "-f", "json", filename], { cwd: fixtureDir });
    return { exitCode: 0, output: stdout };
  } catch (error) {
    return { exitCode: error.code, output: error.stdout };
  }
}

describe("Validate oxlint config", () => {
  it("loads index.js in oxlint without configuration errors", async () => {
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
      [
        `export function add(a: number, b: number): number {`,
        `  return a + b;`,
        `}`,
        ``,
        `const result = add(1, 2);`,
        `console.log(result);`,
        ``,
      ].join("\n")
    );

    expect(JSON.parse(output).diagnostics).toEqual([]);
    expect(exitCode).toBe(0);
  });
});
