import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "import", "unicorn", "oxc"],
  categories: {
    correctness: "error",
    suspicious: "error",
  },
  env: {
    builtin: true,
  },
});
