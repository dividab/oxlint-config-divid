/**
 * Port of eslint-plugin-functional's `no-this-expressions`: disallow use of `this`.
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow `this` access.",
    },
    messages: {
      noThis: "Unexpected this, functions should not rely on the calling context.",
    },
  },
  create(context) {
    return {
      ThisExpression(node) {
        context.report({ node, messageId: "noThis" });
      },
    };
  },
};
