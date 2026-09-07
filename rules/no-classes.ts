import type { AstNode, Context, Rule } from "./_types.js";

interface Identifier extends AstNode {
  readonly type: "Identifier";
  readonly name: string;
}

interface ClassLike extends AstNode {
  readonly type: "ClassDeclaration" | "ClassExpression";
  readonly id: Identifier | null;
}

interface NoClassesOptions {
  readonly ignoreIdentifierPattern?: string | ReadonlyArray<string>;
  readonly ignoreCodePattern?: string | ReadonlyArray<string>;
}

/** Port of eslint-plugin-functional's `no-classes`: disallow class declarations and expressions. */
// Typed as `Rule` (not `satisfies Rule`) so the exported binding's declaration-emitted type stays
// the plain public `Rule` shape, not the specific `ClassLike` node type used internally below.
const rule: Rule = {
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
  create(context: Context) {
    const { ignoreIdentifierPattern, ignoreCodePattern } = (context.options[0] as NoClassesOptions | undefined) ?? {};
    const identifierPatterns = (
      Array.isArray(ignoreIdentifierPattern) ? ignoreIdentifierPattern : ignoreIdentifierPattern ? [ignoreIdentifierPattern] : []
    ).map((source) => new RegExp(source));
    const codePatterns = (Array.isArray(ignoreCodePattern) ? ignoreCodePattern : ignoreCodePattern ? [ignoreCodePattern] : []).map(
      (source) => new RegExp(source)
    );

    function isIgnored(node: ClassLike): boolean {
      const { id } = node;
      return (
        (id !== null && identifierPatterns.some((pattern) => pattern.test(id.name))) ||
        codePatterns.some((pattern) => pattern.test(context.sourceCode.getText(node)))
      );
    }

    function check(node: ClassLike): void {
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

export default rule;
