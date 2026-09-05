/**
 * Port of eslint-plugin-functional's `no-let`: disallow `let` declarations, prefer `const`.
 * `var` is intentionally left alone here - the core `no-var` rule already covers it.
 */
const FUNCTION_TYPES = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]);

function isInsideFunction(node) {
  for (let current = node.parent; current !== null && current !== undefined; current = current.parent) {
    if (FUNCTION_TYPES.has(current.type)) {
      return true;
    }
  }
  return false;
}

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
          allowInFunctions: { type: "boolean" },
          // A regex source (or array of them) tested against each declared identifier. A
          // matching declaration is allowed, e.g. "^[mM]utable" to permit `let mutableFoo`.
          ignoreIdentifierPattern: {
            oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const { ignoreForLoopInit = false, allowInFunctions = false, ignoreIdentifierPattern } = context.options[0] ?? {};
    const patterns = (
      Array.isArray(ignoreIdentifierPattern) ? ignoreIdentifierPattern : ignoreIdentifierPattern ? [ignoreIdentifierPattern] : []
    ).map((source) => new RegExp(source));

    return {
      VariableDeclaration(node) {
        if (node.kind !== "let") {
          return;
        }
        if (ignoreForLoopInit && node.parent.type === "ForStatement" && node.parent.init === node) {
          return;
        }
        if (allowInFunctions && isInsideFunction(node)) {
          return;
        }
        if (
          patterns.length > 0 &&
          node.declarations.every((decl) => decl.id.type === "Identifier" && patterns.some((pattern) => pattern.test(decl.id.name)))
        ) {
          return;
        }
        context.report({ node, messageId: "noLet" });
      },
    };
  },
};
