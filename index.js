import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "import", "unicorn", "oxc", "node"],
  categories: {
    correctness: "error",
    suspicious: "error",
  },
  env: {
    builtin: true,
  },
  // Everything below is ported from eslint-config-divid's rule set (core, imports,
  // typescript-eslint) for rules that fall outside the categories above and therefore
  // need to be turned on explicitly. Rules with no oxlint equivalent (checked against
  // `oxlint --rules --format json`) are left out, same as eslint-plugin-functional.
  rules: {
    // oxlint's `categories` block above turns on every rule tagged correctness/suspicious,
    // ignoring eslint-config-divid's per-rule intent for these - so they need to be turned
    // back off explicitly here to match. Two groups:
    // (a) rules eslint-config-divid disables because TypeScript's compiler already checks
    // them (core/errors.js, core/es6.js) - safe to disable since consuming projects run tsc.
    "getter-return": "off", // Checked by Typescript - ts(2378)
    "no-dupe-keys": "off", // Checked by Typescript - ts(1117)
    "no-unreachable": "off", // Checked by Typescript - ts(7027)
    "valid-typeof": "off", // Checked by Typescript - ts(2367)
    "no-const-assign": "off", // Checked by Typescript - ts(2588)
    "no-this-before-super": "off", // Checked by Typescript - ts(2376)
    // (b) rules eslint-config-divid disables in favor of a type-aware
    // @typescript-eslint/* variant (typescript-eslint/all.js) - oxlint has no equivalent
    // typescript-scoped rule for these, so - same as eslint-plugin-functional - they're
    // left out rather than enforced via the type-unaware bare rule.
    "no-dupe-class-members": "off", // No oxlint equivalent of @typescript-eslint/no-dupe-class-members
    "no-shadow": "off", // No oxlint equivalent of @typescript-eslint/no-shadow
    "no-unused-vars": "off", // No oxlint equivalent of @typescript-eslint/no-unused-vars
    "no-useless-constructor": "off", // No oxlint equivalent of @typescript-eslint/no-useless-constructor
    "no-empty-function": "off", // No oxlint equivalent of @typescript-eslint/no-empty-function

    // From eslint-config-divid's core/best-practices.js
    "array-callback-return": "error",
    "class-methods-use-this": "error",
    curly: ["error", "all"],
    "default-case": "error",
    eqeqeq: ["error", "always"],
    "guard-for-in": "error",
    "max-classes-per-file": ["error", 1],
    "no-alert": "warn",
    "no-case-declarations": "error",
    "no-div-regex": "error",
    "no-extra-label": "error",
    "no-fallthrough": "error",
    "no-implicit-coercion": ["error", { boolean: false, number: false, string: true }], // !! is idiomatic JS
    "no-implicit-globals": "error",
    "no-labels": ["error", { allowLoop: false, allowSwitch: false }],
    "no-lone-blocks": "error",
    "no-multi-str": "error",
    "no-new-func": "error",
    "no-new-wrappers": "error",
    "no-proto": "error",
    "no-restricted-properties": [
      "error",
      { object: "arguments", property: "callee", message: "arguments.callee is deprecated" },
      { object: "global", property: "isFinite", message: "Please use Number.isFinite instead" },
      { object: "self", property: "isFinite", message: "Please use Number.isFinite instead" },
      { object: "window", property: "isFinite", message: "Please use Number.isFinite instead" },
      { object: "global", property: "isNaN", message: "Please use Number.isNaN instead" },
      { object: "self", property: "isNaN", message: "Please use Number.isNaN instead" },
      { object: "window", property: "isNaN", message: "Please use Number.isNaN instead" },
      { property: "__defineGetter__", message: "Please use Object.defineProperty instead." },
      { property: "__defineSetter__", message: "Please use Object.defineProperty instead." },
      { object: "Math", property: "pow", message: "Use the exponentiation operator (**) instead." },
    ],
    "no-script-url": "error",
    "no-self-compare": "error",
    "no-sequences": "error",
    "no-throw-literal": "error",
    "no-useless-call": "error",
    "no-useless-return": "error",
    "no-void": "error",
    "prefer-promise-reject-errors": "error",
    radix: "error",
    "vars-on-top": "error",
    yoda: "error",

    // From eslint-config-divid's core/errors.js
    "no-constant-condition": "warn",
    "no-empty": "error",
    "no-inner-declarations": "error",
    "no-prototype-builtins": "error",
    "no-regex-spaces": "error",
    "no-template-curly-in-string": "error",

    // From eslint-config-divid's core/es6.js
    "no-useless-computed-key": "error",
    "no-var": "error",
    "prefer-const": "error",
    "prefer-numeric-literals": "error",
    "prefer-rest-params": "error",
    "prefer-spread": "error",
    "symbol-description": "error",

    // From eslint-config-divid's core/style.js
    "max-lines": ["error", { max: 800 }],
    "no-bitwise": "error",
    "no-lonely-if": "error",
    "no-multi-assign": "error",
    "one-var": ["error", "never"],
    "operator-assignment": ["error", "always"],
    "prefer-object-spread": "error",

    // From eslint-config-divid's core/style.js
    "no-underscore-dangle": "off", // Prefixing with underscore to signal private

    // From eslint-config-divid's core/variables.js
    "no-label-var": "error",
    "no-restricted-globals": [
      "error",
      "isFinite",
      "isNaN",
      // confusing-browser-globals - https://npmjs.com/package/confusing-browser-globals
      "addEventListener",
      "blur",
      "close",
      "closed",
      "confirm",
      "defaultStatus",
      "defaultstatus",
      "event",
      "external",
      "find",
      "focus",
      "frameElement",
      "frames",
      "history",
      "innerHeight",
      "innerWidth",
      "length",
      "location",
      "locationbar",
      "menubar",
      "moveBy",
      "moveTo",
      "name",
      "onblur",
      "onerror",
      "onfocus",
      "onload",
      "onresize",
      "onunload",
      "open",
      "opener",
      "opera",
      "outerHeight",
      "outerWidth",
      "pageXOffset",
      "pageYOffset",
      "parent",
      "print",
      "removeEventListener",
      "resizeBy",
      "resizeTo",
      "screen",
      "screenLeft",
      "screenTop",
      "screenX",
      "screenY",
      "scroll",
      "scrollbars",
      "scrollBy",
      "scrollTo",
      "scrollX",
      "scrollY",
      "self",
      "status",
      "statusbar",
      "stop",
      "toolbar",
      "top",
    ],

    // From eslint-config-divid's core/node.js
    "node/global-require": "error",
    "node/no-new-require": "error",
    "node/no-path-concat": "error",

    // From eslint-config-divid's imports/*.js
    "import/no-mutable-exports": "error",
    "import/no-amd": "error",
    "import/no-webpack-loader-syntax": "error",
    "import/no-cycle": "error", // no oxlint maxDepth option; unbounded by default
    "import/first": "error",
    "import/no-duplicates": "error",
    "import/newline-after-import": "error",

    // From eslint-config-divid's typescript-eslint/all.js. Some of these ported to
    // oxlint's plain "eslint" scope instead of "typescript/" because oxlint's base
    // rule is already type-aware and has no separate typescript-plugin variant.
    "typescript/adjacent-overload-signatures": "error",
    "typescript/array-type": ["error", { default: "generic" }],
    "typescript/ban-ts-comment": "error",
    "typescript/ban-tslint-comment": "error",
    "typescript/no-empty-object-type": "error",
    "typescript/class-literal-property-style": "error",
    "typescript/consistent-type-imports": "error",
    "default-param-last": "error",
    "typescript/dot-notation": "error",
    "typescript/explicit-function-return-type": [
      "error",
      { allowExpressions: true, allowTypedFunctionExpressions: true, allowHigherOrderFunctions: true },
    ],
    "typescript/explicit-module-boundary-types": "error",
    "init-declarations": "error",
    "no-array-constructor": "error",
    "typescript/no-dynamic-delete": "error",
    "typescript/no-explicit-any": "error",
    "typescript/no-invalid-void-type": "error",
    "no-loop-func": "error",
    "typescript/no-misused-promises": "error",
    "typescript/no-namespace": "error",
    "typescript/parameter-properties": "error",
    "no-redeclare": "error",
    "typescript/no-require-imports": "error",
    "typescript/only-throw-error": "error",
    "typescript/no-unnecessary-condition": "error",
    "typescript/no-unnecessary-qualifier": "error",
    "typescript/no-unsafe-assignment": "error",
    "typescript/no-unsafe-call": "error",
    "typescript/no-unsafe-member-access": "error",
    "typescript/no-unsafe-return": "error",
    "typescript/no-var-requires": "error",
    "typescript/prefer-enum-initializers": "error",
    "typescript/prefer-for-of": "error",
    "typescript/prefer-literal-enum-member": "error",
    "typescript/prefer-nullish-coalescing": "error",
    "typescript/prefer-optional-chain": "error",
    "typescript/prefer-readonly": "error",
    "typescript/prefer-readonly-parameter-types": "error",
    "typescript/prefer-reduce-type-parameter": "error",
    "typescript/prefer-regexp-exec": "error",
    "typescript/prefer-string-starts-ends-with": "error",
    "typescript/prefer-ts-expect-error": "error",
    "typescript/return-await": "error",
    "typescript/switch-exhaustiveness-check": "error",
    "typescript/unified-signatures": "error",
  },
});
