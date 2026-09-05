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
          // A regex source (or array of them) tested against the whole class declaration's
          // source text - the fallback used for anonymous class expressions, which have no name
          // to test ignoreIdentifierPattern against.
          ignoreCodePattern: {
            oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const { ignoreIdentifierPattern, ignoreCodePattern } = context.options[0] ?? {};
    const identifierPatterns = (
      Array.isArray(ignoreIdentifierPattern) ? ignoreIdentifierPattern : ignoreIdentifierPattern ? [ignoreIdentifierPattern] : []
    ).map((source) => new RegExp(source));
    const codePatterns = (Array.isArray(ignoreCodePattern) ? ignoreCodePattern : ignoreCodePattern ? [ignoreCodePattern] : []).map(
      (source) => new RegExp(source)
    );

    function isIgnored(node) {
      return (
        (node.id !== null && identifierPatterns.some((pattern) => pattern.test(node.id.name))) ||
        (codePatterns.length > 0 && codePatterns.some((pattern) => pattern.test(context.sourceCode.getText(node))))
      );
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
