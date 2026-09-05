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

## How to publish

```
pnpm version patch
pnpm version minor
pnpm version major
```

This runs the tests, bumps the version, commits and tags it, then pushes and publishes to npm.
The npm account has 2FA enabled, so the automatic `pnpm publish` step in `postversion` will fail
with a 404/EOTP error. If that happens, finish the release manually:

```
npm publish --otp=<code from your authenticator app>
git push
```
