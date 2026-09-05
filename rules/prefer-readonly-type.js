/**
 * Port of eslint-plugin-functional's `prefer-readonly-type`, narrowed to the checks that
 * translate cleanly to a syntax-only (non-type-aware) rule:
 *  - interface / object type literal properties missing `readonly`
 *  - array types (`T[]` and `Array<T>`) not marked as readonly
 *  - tuple types not marked as readonly
 *
 * Class fields are deliberately NOT checked here: doing so soundly requires knowing whether a
 * field is reassigned outside the constructor, which needs the scope/reference analysis that the
 * already-enabled, type-aware `typescript/prefer-readonly` rule already does correctly. A
 * syntax-only "flag every non-readonly field" check would produce unsound fixes (breaking fields
 * that are legitimately reassigned elsewhere in the class).
 */
function isReadonlyWrapped(node) {
  return node.parent.type === "TSTypeOperator" && node.parent.operator === "readonly";
}

function isNestedArrayOrTuple(node) {
  return node.parent.type === "TSArrayType" || node.parent.type === "TSTupleType";
}

export default {
  meta: {
    type: "suggestion",
    fixable: "code",
    docs: {
      description: "Prefer readonly array/tuple/object types over mutable ones.",
    },
    messages: {
      propertyNotReadonly: "Property should be readonly.",
      arrayNotReadonly: "Array type should be readonly.",
      tupleNotReadonly: "Tuple type should be readonly.",
    },
    schema: [
      {
        type: "object",
        properties: {
          ignoreInterface: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const { ignoreInterface = false } = context.options[0] ?? {};

    return {
      TSPropertySignature(node) {
        if (node.readonly) {
          return;
        }
        if (ignoreInterface && node.parent.type === "TSInterfaceBody") {
          return;
        }
        context.report({
          node,
          messageId: "propertyNotReadonly",
          fix: (fixer) => fixer.insertTextBefore(node.key, "readonly "),
        });
      },

      TSArrayType(node) {
        if (isReadonlyWrapped(node) || isNestedArrayOrTuple(node)) {
          return;
        }
        context.report({
          node,
          messageId: "arrayNotReadonly",
          fix: (fixer) => fixer.insertTextBefore(node, "readonly "),
        });
      },

      TSTupleType(node) {
        if (isReadonlyWrapped(node) || isNestedArrayOrTuple(node)) {
          return;
        }
        context.report({
          node,
          messageId: "tupleNotReadonly",
          fix: (fixer) => fixer.insertTextBefore(node, "readonly "),
        });
      },

      TSTypeReference(node) {
        if (node.typeName.type !== "Identifier" || node.typeName.name !== "Array") {
          return;
        }
        context.report({
          node,
          messageId: "arrayNotReadonly",
          fix: (fixer) => fixer.replaceText(node.typeName, "ReadonlyArray"),
        });
      },
    };
  },
};
