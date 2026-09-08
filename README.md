# oxlint-config-divid

This package contains an [oxlint](https://oxc.rs/docs/guide/usage/linter.html) sharable config
for use with typescript, following the programming style we use at [Divid](https://divid.se/).

It is a starting point, not a port of [eslint-config-divid](https://github.com/dividab/eslint-config-divid):
oxlint has its own native rule set, and most of `eslint-plugin-functional` (no-mutations,
no-statements, currying, ...) has no oxlint equivalent and is not included here.

oxlint does have an alpha [JS plugin API](https://oxc.rs/docs/guide/usage/linter/js-plugins.html)
(ESLint v9-compatible rules), and this package uses it to bundle `functional-plugin.js`: a port of
the `eslint-plugin-functional` rules that translate to a syntax-only check and have no native
oxlint equivalent - `no-classes`, `no-let`, `no-this-expressions` and `prefer-readonly-type` -
enabled by default as `functional/<rule-name>`. `prefer-property-signatures` is covered by the
native `typescript/method-signature-style` instead (enabled directly in `index.js`), and class-field
readonly-ness is left to the native, type-aware `typescript/prefer-readonly` rather than
`prefer-readonly-type`'s JS-plugin port, which only checks interfaces/type-literals and array/tuple
types - flagging every non-readonly class field without knowing whether it's reassigned elsewhere
would produce unsound fixes. If a project only needs these rules from `eslint-plugin-functional`, it
can be dropped once this config is in use. Expect the rule set in `index.js` to grow as we find more
oxlint (native or JS-plugin) equivalents worth enabling.

Beyond the core `typescript`, `import`, `unicorn`, `oxc`, `node` and `react` plugins, this config
also enables:

- `jsx-a11y` - accessibility checks for JSX (e.g. requiring `alt` text, valid ARIA roles).
- `react-perf` - common React performance footguns, like inline object/array/function literals
  passed as props, which defeat memoization.
- `promise` - correctness rules around `Promise` usage (e.g. returning inside `.then()`, not
  swallowing rejections).
- `vitest` - rules specific to Vitest test files (e.g. no disabled/focused tests left behind, no
  standalone `expect()` outside a test).

## Usage

Install the package and its peer dependency:

```bash
pnpm add --save-dev oxlint-config-divid oxlint
```

Add a file called `oxlint.config.js` to your project's root:

```js
import { defineConfig } from "oxlint";
import dividConfig from "oxlint-config-divid";

export default defineConfig({
  extends: [dividConfig],
});
```

Add the following to the `scripts` section of your project's package.json:

```
"lint": "oxlint ."
```

## Overriding rules

Pass your own `rules`/`categories`/`overrides` alongside `extends` — they take precedence over the
extended config:

```js
import { defineConfig } from "oxlint";
import dividConfig from "oxlint-config-divid";

export default defineConfig({
  extends: [dividConfig],
  rules: {
    "no-console": "off",
  },
});
```

## Recommended tsconfig options

Have these compiler options on in your project's `tsconfig.json`:

```json
{
  "compilerOptions": {
    "allowUnreachableCode": false,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true,
    "noUncheckedIndexedAccess": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUncheckedSideEffectImports": true,
    "verbatimModuleSyntax": true
  }
}
```

## Editor setup (VSCode)

`.vscode/settings.json` is per-developer (gitignored), so add these yourself. They enable
oxlint's type-aware rules and point the [oxc extension](https://marketplace.visualstudio.com/items?itemName=oxc.oxc-vscode)
at this repo's config, so in-editor lint results match `pnpm lint`, and format-on-save uses
oxfmt (sorting imports and `package.json` along the way):

```json
{
  "oxc.typeAware": true,
  "oxc.configPath": "./oxlint.config.js",
  "editor.formatOnSave": true
}
```

## How to publish

The npm account has 2FA enabled, so publishing needs a one-time code from your authenticator app,
passed as the last argument:

```
pnpm release:patch <otp>
pnpm release:minor <otp>
pnpm release:major <otp>
```

This runs the tests, bumps the version, commits and tags it, pushes, then publishes to npm with
the given OTP.
