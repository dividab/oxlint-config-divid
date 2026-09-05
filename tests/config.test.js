import { execFile } from "node:child_process";
import { mkdtemp, writeFile, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { describe, it, expect } from "vitest";

const execFileAsync = promisify(execFile);
const rootDir = path.dirname(fileURLToPath(import.meta.url));

async function runOxlint() {
  const dir = await mkdtemp(path.join(tmpdir(), "oxlint-config-divid-"));
  try {
    // oxlint.config.js does `import { defineConfig } from "oxlint"`, which Node resolves
    // relative to the config file's own location, so the fixture needs its own node_modules.
    await symlink(path.join(rootDir, "..", "node_modules"), path.join(dir, "node_modules"), "dir");
    await writeFile(
      path.join(dir, "oxlint.config.js"),
      `import { defineConfig } from "oxlint";\nimport dividConfig from ${JSON.stringify(
        path.join(rootDir, "..", "index.js")
      )};\n\nexport default defineConfig({ extends: [dividConfig] });\n`
    );
    await writeFile(path.join(dir, "sample.ts"), "export const x = 1;\n");
    // oxlint only auto-discovers `.oxlintrc.json`; a JS/TS config must be passed via -c
    // explicitly, otherwise it silently falls back to oxlint's built-in default config.
    const { stdout } = await execFileAsync("npx", ["oxlint", "-c", "oxlint.config.js", "--print-config", "."], {
      cwd: dir,
    });
    return JSON.parse(stdout);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe("Validate oxlint config", () => {
  it("loads index.js in oxlint without configuration errors", async () => {
    await expect(runOxlint()).resolves.not.toThrow();
  });

  it("actually applies the divid rule set, not oxlint's defaults", async () => {
    const config = await runOxlint();
    expect(config.rules["prefer-const"]).toBe("deny");
    expect(config.rules["typescript/no-explicit-any"]).toBe("deny");
    expect(config.rules["import/no-cycle"]).toBe("deny");
  });
});
