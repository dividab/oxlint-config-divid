import type { AstNode, Context, Rule } from "./_types.js";

interface ThisExpression extends AstNode {
  readonly type: "ThisExpression";
}

/** Port of eslint-plugin-functional's `no-this-expressions`: disallow use of `this`. */
// Typed as `Rule` (not `satisfies Rule`) so the exported binding's declaration-emitted type stays
// the plain public `Rule` shape, not the specific `ThisExpression` node type used internally below.
const rule: Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `this` access.",
    },
    messages: {
      noThis: "Unexpected this, functions should not rely on the calling context.",
    },
  },
  create(context: Context) {
    return {
      ThisExpression(node: ThisExpression) {
        context.report({ node, messageId: "noThis" });
      },
    };
  },
};

export default rule;
