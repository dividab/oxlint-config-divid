# Changelog

## 1.3.0

- Rewritten in TypeScript. No behavior change to the rule set - the package now ships compiled
  `.js` alongside `.d.ts` type declarations, so editors/tooling get types for the config shape and
  the bundled `functional/*` rules.
- Enabled the `jsx-a11y`, `react-perf`, `promise` and `vitest` oxlint plugins.

## 0.1.0

- Initial release. Baseline config enabling oxlint's `typescript`, `import`, `unicorn`, and `oxc`
  plugins with the `correctness` and `suspicious` rule categories set to `error`.
