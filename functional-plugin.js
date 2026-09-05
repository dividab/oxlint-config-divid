import noClasses from "./rules/no-classes.js";
import noLet from "./rules/no-let.js";
import noThisExpressions from "./rules/no-this-expressions.js";
import preferReadonlyType from "./rules/prefer-readonly-type.js";

// oxlint JS plugin (alpha - https://oxc.rs/docs/guide/usage/linter/js-plugins.html), bundled here
// to port the handful of eslint-plugin-functional rules that have a syntax-only equivalent and no
// native oxlint rule already covers. `prefer-property-signatures` is deliberately not here: oxlint
// has a native equivalent, `typescript/method-signature-style`, enabled directly in index.js.
// Registered via `jsPlugins: ["oxlint-config-divid/functional-plugin.js"]` in index.js, and
// enabled as `functional/<rule-name>` in `rules`.
export default {
  meta: {
    name: "functional",
  },
  rules: {
    "no-classes": noClasses,
    "no-let": noLet,
    "no-this-expressions": noThisExpressions,
    "prefer-readonly-type": preferReadonlyType,
  },
};
