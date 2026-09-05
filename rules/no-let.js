/**
 * Port of eslint-plugin-functional's `no-let`: disallow `let` declarations, prefer `const`.
 * `var` is intentionally left alone here - the core `no-var` rule already covers it.
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow mutable `let` variable declarations.",
    },
    messages: {
      noLet: "Unexpected let, use const instead.",
    },
    schema: [
      {
        type: "object",
        properties: {
          ignoreForLoopInit: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const { ignoreForLoopInit = false } = context.options[0] ?? {};

    return {
      VariableDeclaration(node) {
        if (node.kind !== "let") {
          return;
        }
        if (ignoreForLoopInit && node.parent.type === "ForStatement" && node.parent.init === node) {
          return;
        }
        context.report({ node, messageId: "noLet" });
      },
    };
  },
};
