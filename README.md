# oxlint-config-divid

This package contains an [oxlint](https://oxc.rs/docs/guide/usage/linter.html) sharable config
for use with typescript, following the programming style we use at [Divid](https://divid.se/).

It is a starting point, not a port of [eslint-config-divid](https://github.com/dividab/eslint-config-divid):
oxlint has its own native rule set and does not support third-party ESLint plugins, so rules from
`eslint-plugin-functional` (no-mutations, no-statements, currying, ...) have no oxlint equivalent
and are not included here. Expect the rule set in `index.js` to grow as we find native oxlint
equivalents worth enabling.

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
