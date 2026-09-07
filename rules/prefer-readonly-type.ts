import type { AstNode, Context, Rule } from "./_types.js";
import { getIdentifierText, isClassLike, isInClass, isInInterface, isInReturnType, isInsideFunction } from "./_ast-utils.js";

interface Identifier extends AstNode {
  readonly type: "Identifier";
  readonly name: string;
}

interface TSTypeOperator extends AstNode {
  readonly type: "TSTypeOperator";
  readonly operator: "keyof" | "unique" | "readonly";
}

interface ReadonlyCheckable extends AstNode {
  readonly readonly?: boolean;
}

interface PropertyDefinitionNode extends ReadonlyCheckable {
  readonly key: AstNode;
}

interface TSParameterPropertyNode extends ReadonlyCheckable {
  readonly parameter: AstNode;
}

interface TSMappedTypeNode extends AstNode {
  readonly readonly?: true | "+" | "-";
}

interface TSTypeReferenceNode extends AstNode {
  readonly typeName: AstNode;
}

interface PreferReadonlyTypeOptions {
  readonly ignoreInterface?: boolean;
  readonly allowLocalMutation?: boolean;
  readonly allowMutableReturnType?: boolean;
  readonly ignoreCollections?: boolean;
  readonly ignoreClass?: boolean | "fieldsOnly";
  readonly ignorePattern?: string | ReadonlyArray<string>;
}

const MUTABLE_TO_READONLY_TYPES = new Map([
  ["Array", "ReadonlyArray"],
  ["Map", "ReadonlyMap"],
  ["Set", "ReadonlySet"],
]);
const COLLECTION_TYPE_NAMES = new Set(MUTABLE_TO_READONLY_TYPES.keys());

function isReadonlyWrapped(node: AstNode): boolean {
  return node.parent !== null && node.parent.type === "TSTypeOperator" && (node.parent as TSTypeOperator).operator === "readonly";
}

function isNestedArrayOrTuple(node: AstNode): boolean {
  return node.parent !== null && (node.parent.type === "TSArrayType" || node.parent.type === "TSTupleType");
}

// Walk up past the type-only wrapper nodes surrounding a checked node to find the nearest node
// that actually carries a name - a property, variable, parameter, function or type alias -
// mirroring eslint-plugin-functional's own unwrapping (`shouldIgnorePattern2`) before testing
// ignorePattern against it.
const TYPE_WRAPPER_TYPES = new Set(["TSArrayType", "TSTupleType", "TSTypeAnnotation", "TSTypeReference", "TSIndexSignature", "TSTypeLiteral"]);

function getIdentifierName(node: AstNode): string | undefined {
  let current: AstNode | null = node;
  while (current !== null && TYPE_WRAPPER_TYPES.has(current.type)) {
    current = current.parent;
  }
  return getIdentifierText(current);
}

function matchesIgnorePattern(node: AstNode, patterns: ReadonlyArray<RegExp>): boolean {
  if (patterns.length === 0) {
    return false;
  }
  const name = getIdentifierName(node);
  return name !== undefined && patterns.some((pattern) => pattern.test(name));
}

// Mirrors eslint-plugin-functional's `shouldIgnoreClasses`. The `this.x = ...` assignment-
// expression variant of the "fieldsOnly" case is omitted: this rule never visits
// AssignmentExpression nodes, so it can never apply.
function shouldIgnoreClasses(node: AstNode, ignoreClass: boolean | "fieldsOnly"): boolean {
  if (ignoreClass === true) {
    return isClassLike(node) || isInClass(node);
  }
  if (ignoreClass === "fieldsOnly") {
    return node.type === "PropertyDefinition";
  }
  return false;
}

/**
 * Port of eslint-plugin-functional's `prefer-readonly-type`, narrowed to the checks that
 * translate cleanly to a syntax-only (non-type-aware) rule: readonly modifiers missing from
 * property/index signatures, class fields, constructor parameter properties and mapped types;
 * array/tuple types and `Array`/`Map`/`Set` type references not marked as readonly.
 *
 * Not ported, since eslint-plugin-functional's own version of it needs type information (a
 * TypeScript program, via `getTypeOfNode`) that oxlint's JS-plugin API does not give rule authors
 * access to: `checkImplicit` (flagging an inferred-mutable array/tuple with no explicit type
 * annotation).
 */
// Typed as `Rule` (not `satisfies Rule`) so the exported binding's declaration-emitted type stays
// the plain public `Rule` shape, not the specific node types used internally below.
const rule: Rule = {
  meta: {
    type: "suggestion",
    fixable: "code",
    docs: {
      description: "Prefer readonly array/tuple/object/collection types over mutable ones.",
    },
    messages: {
      propertyNotReadonly: "Property should be readonly.",
      arrayNotReadonly: "Array type should be readonly.",
      tupleNotReadonly: "Tuple type should be readonly.",
      typeNotReadonly: "Only readonly types allowed.",
    },
    schema: [
      {
        type: "object",
        properties: {
          ignoreInterface: { type: "boolean" },
          allowLocalMutation: { type: "boolean" },
          allowMutableReturnType: { type: "boolean" },
          ignoreCollections: { type: "boolean" },
          ignoreClass: {
            oneOf: [{ type: "boolean" }, { type: "string", enum: ["fieldsOnly"] }],
          },
          // A regex source (or array of them) tested against the nearest enclosing name (a
          // property, variable, parameter, function or type alias identifier). A match is
          // allowed, e.g. "^[mM]utable" to permit `mutableFoo: string[]`.
          ignorePattern: {
            oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context: Context) {
    const {
      ignoreInterface = false,
      allowLocalMutation = false,
      allowMutableReturnType = false,
      ignoreCollections = false,
      ignoreClass = false,
      ignorePattern,
    } = (context.options[0] as PreferReadonlyTypeOptions | undefined) ?? {};
    const patterns = (Array.isArray(ignorePattern) ? ignorePattern : ignorePattern ? [ignorePattern] : []).map((source) => new RegExp(source));

    function isIgnored(node: AstNode): boolean {
      return (
        shouldIgnoreClasses(node, ignoreClass) ||
        (ignoreInterface && isInInterface(node)) ||
        (allowLocalMutation && isInsideFunction(node)) ||
        matchesIgnorePattern(node, patterns)
      );
    }

    function isIgnoredReturnType(node: AstNode): boolean {
      return allowMutableReturnType && isInReturnType(node);
    }

    function checkReadonlyProperty(node: ReadonlyCheckable, messageId: string, fixTarget?: AstNode): void {
      if (node.readonly) {
        return;
      }
      if (isIgnored(node) || isIgnoredReturnType(node)) {
        return;
      }
      context.report({
        node,
        messageId,
        fix: (fixer) => fixer.insertTextBefore(fixTarget ?? node, "readonly "),
      });
    }

    return {
      TSPropertySignature(node: ReadonlyCheckable) {
        checkReadonlyProperty(node, "propertyNotReadonly");
      },

      TSIndexSignature(node: ReadonlyCheckable) {
        checkReadonlyProperty(node, "propertyNotReadonly");
      },

      PropertyDefinition(node: PropertyDefinitionNode) {
        checkReadonlyProperty(node, "propertyNotReadonly", node.key);
      },

      TSParameterProperty(node: TSParameterPropertyNode) {
        checkReadonlyProperty(node, "propertyNotReadonly", node.parameter);
      },

      // No allowMutableReturnType/ignoreClass/ignoreCollections handling here: eslint-plugin-
      // functional's checkMappedType doesn't apply them either.
      TSMappedType(node: TSMappedTypeNode) {
        if (node.readonly === true || node.readonly === "+") {
          return;
        }
        if (isIgnored(node)) {
          return;
        }
        context.report({
          node,
          messageId: "propertyNotReadonly",
          fix: (fixer) => fixer.insertTextBeforeRange([node.range[0] + 1, node.range[1]], " readonly"),
        });
      },

      TSArrayType(node: AstNode) {
        if (isReadonlyWrapped(node) || isNestedArrayOrTuple(node) || ignoreCollections) {
          return;
        }
        if (isIgnored(node) || isIgnoredReturnType(node)) {
          return;
        }
        context.report({
          node,
          messageId: "arrayNotReadonly",
          fix: (fixer) => fixer.insertTextBefore(node, "readonly "),
        });
      },

      TSTupleType(node: AstNode) {
        if (isReadonlyWrapped(node) || isNestedArrayOrTuple(node) || ignoreCollections) {
          return;
        }
        if (isIgnored(node) || isIgnoredReturnType(node)) {
          return;
        }
        context.report({
          node,
          messageId: "tupleNotReadonly",
          fix: (fixer) => fixer.insertTextBefore(node, "readonly "),
        });
      },

      TSTypeReference(node: TSTypeReferenceNode) {
        if (node.typeName.type !== "Identifier" || !COLLECTION_TYPE_NAMES.has((node.typeName as Identifier).name)) {
          return;
        }
        if (ignoreCollections) {
          return;
        }
        if (isIgnored(node) || isIgnoredReturnType(node)) {
          return;
        }
        const typeName = node.typeName as Identifier;
        const replacement = MUTABLE_TO_READONLY_TYPES.get(typeName.name);
        if (replacement === undefined) {
          return;
        }
        context.report({
          node,
          messageId: "typeNotReadonly",
          fix: (fixer) => fixer.replaceText(typeName, replacement),
        });
      },
    };
  },
};

export default rule;
