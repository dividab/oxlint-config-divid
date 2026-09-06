import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["typescript", "import", "unicorn", "oxc", "node", "react"],
  // Syntax-only ports of eslint-plugin-functional rules with no oxlint equivalent.
  jsPlugins: ["oxlint-config-divid/functional-plugin.js"],
  categories: {
    correctness: "error",
    suspicious: "error",
  },
  env: {
    builtin: true,
  },
  // Rules ported from eslint-config-divid that the categories above don't cover.
  rules: {
    // Re-disabled below because `categories` turns these back on regardless of intent.
    // (a) Checked by TypeScript unconditionally.
    "getter-return": "off", // ts(2378)
    "no-dupe-keys": "off", // ts(1117)
    "valid-typeof": "off", // ts(2367)
    "no-const-assign": "off", // ts(2588)
    "no-this-before-super": "off", // ts(2376)
    "no-dupe-class-members": "off", // ts(2393)/ts(2300)
    // (b) Checked by TypeScript when the matching tsconfig option is enabled (see README).
    "no-unreachable": "off", // needs allowUnreachableCode
    "no-unused-vars": "off", // needs noUnusedLocals/noUnusedParameters
    "no-fallthrough": "off", // needs noFallthroughCasesInSwitch
    // (c) No oxlint equivalent of the type-aware @typescript-eslint/* variant.
    "no-shadow": "off",
    "no-useless-constructor": "off",
    "no-empty-function": "off",

    // core/best-practices.js
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
    "no-implicit-coercion": ["error", { boolean: false, number: false, string: true }], // !! stays allowed
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

    // core/errors.js
    "no-constant-condition": "warn",
    "no-empty": "error",
    "no-inner-declarations": "error",
    "no-prototype-builtins": "error",
    "no-regex-spaces": "error",
    "no-template-curly-in-string": "error",
    "no-console": "error",

    // core/es6.js
    "no-useless-computed-key": "error",
    "no-var": "error",
    "prefer-const": "error",
    "prefer-numeric-literals": "error",
    "prefer-rest-params": "error",
    "prefer-spread": "error",
    "symbol-description": "error",

    // core/style.js
    "max-lines": ["error", { max: 800 }],
    "no-bitwise": "error",
    "no-lonely-if": "error",
    "no-multi-assign": "error",
    "one-var": ["error", "never"],
    "operator-assignment": ["error", "always"],
    "prefer-object-spread": "error",

    // core/style.js
    "no-underscore-dangle": "off", // underscore signals private

    // core/variables.js
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

    // core/node.js
    "node/global-require": "error",
    "node/no-new-require": "error",
    "node/no-path-concat": "error",

    // imports/*.js
    "import/no-mutable-exports": "error",
    "import/no-amd": "error",
    "import/no-webpack-loader-syntax": "error",
    "import/no-cycle": "error", // no maxDepth option; unbounded by default
    "import/first": "error",
    "import/no-duplicates": "error",
    "import/newline-after-import": "error",

    // typescript-eslint/all.js
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
    "typescript/no-dynamic-delete": "off", // team decision
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
    "typescript/prefer-for-of": "off", // team decision
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
    "typescript/method-signature-style": ["error", "property"], // replaces prefer-property-signatures

    // Ports of eslint-plugin-functional rules with no oxlint equivalent, see functional-plugin.js.
    "functional/no-classes": "error",
    "functional/no-let": ["error", { allowInFunctions: true, ignoreIdentifierPattern: "^[mM]utable" }],
    "functional/no-this-expressions": "error",
    "functional/prefer-readonly-type": ["error", { allowLocalMutation: true, ignorePattern: "^[mM]utable" }],

    // react/* - not in the correctness/suspicious categories, so needs an explicit entry.
    "react/no-array-index-key": "error",
  },
});
