import type { AstNode, Context, Rule } from "./_types.js";
import { isInsideFunction } from "./_ast-utils.js";

interface Identifier extends AstNode {
  readonly type: "Identifier";
  readonly name: string;
}

interface VariableDeclarator extends AstNode {
  readonly id: AstNode;
}

interface VariableDeclaration extends AstNode {
  readonly type: "VariableDeclaration";
  readonly kind: "var" | "let" | "const" | "using" | "await using";
  readonly declarations: ReadonlyArray<VariableDeclarator>;
}

interface ForStatement extends AstNode {
  readonly type: "ForStatement";
  readonly init: AstNode | null;
}

interface NoLetOptions {
  readonly allowInForLoopInit?: boolean;
  readonly allowInFunctions?: boolean;
  readonly ignoreIdentifierPattern?: string | ReadonlyArray<string>;
}

/**
 * Port of eslint-plugin-functional's `no-let`: disallow `let` declarations, prefer `const`.
 * `var` is intentionally left alone here - the core `no-var` rule already covers it.
 */
// Typed as `Rule` (not `satisfies Rule`) so the exported binding's declaration-emitted type stays
// the plain public `Rule` shape, not the specific node types used internally below.
const rule: Rule = {
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
          // Named to match eslint-plugin-functional's own option name for this rule.
          allowInForLoopInit: { type: "boolean" },
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
  create(context: Context) {
    const { allowInForLoopInit = false, allowInFunctions = false, ignoreIdentifierPattern } = (context.options[0] as NoLetOptions | undefined) ?? {};
    const patterns = (
      Array.isArray(ignoreIdentifierPattern) ? ignoreIdentifierPattern : ignoreIdentifierPattern ? [ignoreIdentifierPattern] : []
    ).map((source) => new RegExp(source));

    return {
      VariableDeclaration(node: VariableDeclaration) {
        if (node.kind !== "let") {
          return;
        }
        const parent = node.parent;
        if (allowInForLoopInit && parent !== null && parent.type === "ForStatement" && (parent as ForStatement).init === node) {
          return;
        }
        if (allowInFunctions && isInsideFunction(node)) {
          return;
        }
        if (
          patterns.length > 0 &&
          node.declarations.every((decl) => decl.id.type === "Identifier" && patterns.some((pattern) => pattern.test((decl.id as Identifier).name)))
        ) {
          return;
        }
        context.report({ node, messageId: "noLet" });
      },
    };
  },
};

export default rule;
