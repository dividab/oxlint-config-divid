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
import { getIdentifierText, isClassLike, isInClass, isInInterface, isInReturnType, isInsideFunction } from "./_ast-utils.js";

const MUTABLE_TO_READONLY_TYPES = new Map([
  ["Array", "ReadonlyArray"],
  ["Map", "ReadonlyMap"],
  ["Set", "ReadonlySet"],
]);
const COLLECTION_TYPE_NAMES = new Set(MUTABLE_TO_READONLY_TYPES.keys());

function isReadonlyWrapped(node) {
  return node.parent.type === "TSTypeOperator" && node.parent.operator === "readonly";
}

function isNestedArrayOrTuple(node) {
  return node.parent.type === "TSArrayType" || node.parent.type === "TSTupleType";
}

// Walk up past the type-only wrapper nodes surrounding a checked node to find the nearest node
// that actually carries a name - a property, variable, parameter, function or type alias -
// mirroring eslint-plugin-functional's own unwrapping (`shouldIgnorePattern2`) before testing
// ignorePattern against it.
const TYPE_WRAPPER_TYPES = new Set(["TSArrayType", "TSTupleType", "TSTypeAnnotation", "TSTypeReference", "TSIndexSignature", "TSTypeLiteral"]);

function getIdentifierName(node) {
  let current = node;
  while (current !== null && current !== undefined && TYPE_WRAPPER_TYPES.has(current.type)) {
    current = current.parent;
  }
  return getIdentifierText(current);
}

function matchesIgnorePattern(node, patterns) {
  if (patterns.length === 0) {
    return false;
  }
  const name = getIdentifierName(node);
  return name !== undefined && patterns.some((pattern) => pattern.test(name));
}

// Mirrors eslint-plugin-functional's `shouldIgnoreClasses`. The `this.x = ...` assignment-
// expression variant of the "fieldsOnly" case is omitted: this rule never visits
// AssignmentExpression nodes, so it can never apply.
function shouldIgnoreClasses(node, ignoreClass) {
  if (ignoreClass === true) {
    return isClassLike(node) || isInClass(node);
  }
  if (ignoreClass === "fieldsOnly") {
    return node.type === "PropertyDefinition";
  }
  return false;
}

export default {
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
  create(context) {
    const {
      ignoreInterface = false,
      allowLocalMutation = false,
      allowMutableReturnType = false,
      ignoreCollections = false,
      ignoreClass = false,
      ignorePattern,
    } = context.options[0] ?? {};
    const patterns = (Array.isArray(ignorePattern) ? ignorePattern : ignorePattern ? [ignorePattern] : []).map((source) => new RegExp(source));

    function isIgnored(node) {
      return (
        shouldIgnoreClasses(node, ignoreClass) ||
        (ignoreInterface && isInInterface(node)) ||
        (allowLocalMutation && isInsideFunction(node)) ||
        matchesIgnorePattern(node, patterns)
      );
    }

    function isIgnoredReturnType(node) {
      return allowMutableReturnType && isInReturnType(node);
    }

    function checkReadonlyProperty(node, messageId, fixTarget) {
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
      TSPropertySignature(node) {
        checkReadonlyProperty(node, "propertyNotReadonly");
      },

      TSIndexSignature(node) {
        checkReadonlyProperty(node, "propertyNotReadonly");
      },

      PropertyDefinition(node) {
        checkReadonlyProperty(node, "propertyNotReadonly", node.key);
      },

      TSParameterProperty(node) {
        checkReadonlyProperty(node, "propertyNotReadonly", node.parameter);
      },

      // No allowMutableReturnType/ignoreClass/ignoreCollections handling here: eslint-plugin-
      // functional's checkMappedType doesn't apply them either.
      TSMappedType(node) {
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

      TSArrayType(node) {
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

      TSTupleType(node) {
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

      TSTypeReference(node) {
        if (node.typeName.type !== "Identifier" || !COLLECTION_TYPE_NAMES.has(node.typeName.name)) {
          return;
        }
        if (ignoreCollections) {
          return;
        }
        if (isIgnored(node) || isIgnoredReturnType(node)) {
          return;
        }
        context.report({
          node,
          messageId: "typeNotReadonly",
          fix: (fixer) => fixer.replaceText(node.typeName, MUTABLE_TO_READONLY_TYPES.get(node.typeName.name)),
        });
      },
    };
  },
};
