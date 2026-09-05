/**
 * Port of eslint-plugin-functional's `no-classes`: disallow class declarations and expressions.
 */
export default {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow classes.",
    },
    messages: {
      noClass: "Unexpected class, use functions instead.",
    },
    schema: [
      {
        type: "object",
        properties: {
          // A regex source (or array of them) tested against the class name. Matching
          // classes are allowed, e.g. `["^.*Error$"]` to permit custom Error subclasses.
          ignoreIdentifierPattern: {
            oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const { ignoreIdentifierPattern } = context.options[0] ?? {};
    const patterns = (
      Array.isArray(ignoreIdentifierPattern) ? ignoreIdentifierPattern : ignoreIdentifierPattern ? [ignoreIdentifierPattern] : []
    ).map((source) => new RegExp(source));

    function isIgnored(node) {
      return node.id !== null && patterns.some((pattern) => pattern.test(node.id.name));
    }

    function check(node) {
      if (!isIgnored(node)) {
        context.report({ node, messageId: "noClass" });
      }
    }

    return {
      ClassDeclaration: check,
      ClassExpression: check,
    };
  },
};
