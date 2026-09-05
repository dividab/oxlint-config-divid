import { execFile } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
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
    await writeFile(
      path.join(dir, "oxlint.config.js"),
      `import { defineConfig } from "oxlint";\nimport dividConfig from ${JSON.stringify(
        path.join(rootDir, "..", "index.js")
      )};\n\nexport default defineConfig({ extends: [dividConfig] });\n`
    );
    await writeFile(path.join(dir, "sample.ts"), "export const x = 1;\n");
    return await execFileAsync("npx", ["oxlint", "."], { cwd: dir });
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe("Validate oxlint config", () => {
  it("loads index.js in oxlint without configuration errors", async () => {
    await expect(runOxlint()).resolves.not.toThrow();
  });
});
