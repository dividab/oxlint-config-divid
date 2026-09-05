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
const FUNCTION_TYPES = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]);

// A function's params and return-type annotation are direct children of the function node too,
// same as its body - so this only counts as "inside" when the climb passed through the body
// specifically. Otherwise a top-level exported function's own parameter/return types would
// wrongly count as "local".
function isInsideFunction(node) {
  for (let child = node, current = node.parent; current !== null && current !== undefined; child = current, current = current.parent) {
    if (FUNCTION_TYPES.has(current.type) && current.body === child) {
      return true;
    }
  }
  return false;
}

function isReadonlyWrapped(node) {
  return node.parent.type === "TSTypeOperator" && node.parent.operator === "readonly";
}

function isNestedArrayOrTuple(node) {
  return node.parent.type === "TSArrayType" || node.parent.type === "TSTupleType";
}

// Walk up past the type-only wrapper nodes surrounding an array/tuple/`Array<T>` type to find the
// nearest node that actually carries a name - a property, variable, parameter or type alias -
// mirroring eslint-plugin-functional's own unwrapping (`shouldIgnorePattern` for these node
// kinds) before testing ignorePattern against it.
const TYPE_WRAPPER_TYPES = new Set(["TSArrayType", "TSTupleType", "TSTypeAnnotation", "TSTypeReference"]);

function getIdentifierName(node) {
  let current = node;
  while (current !== null && current !== undefined && TYPE_WRAPPER_TYPES.has(current.type)) {
    current = current.parent;
  }
  if (current === null || current === undefined) {
    return undefined;
  }
  switch (current.type) {
    case "TSPropertySignature":
    case "PropertyDefinition":
    case "Property":
      return current.key.type === "Identifier" ? current.key.name : undefined;
    case "VariableDeclarator":
    case "TSTypeAliasDeclaration":
      return current.id.type === "Identifier" ? current.id.name : undefined;
    case "Identifier":
      return current.name;
    default:
      return undefined;
  }
}

function matchesIgnorePattern(node, patterns) {
  if (patterns.length === 0) {
    return false;
  }
  const name = getIdentifierName(node);
  return name !== undefined && patterns.some((pattern) => pattern.test(name));
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
          allowLocalMutation: { type: "boolean" },
          // A regex source (or array of them) tested against the nearest enclosing name (a
          // property, variable, parameter or type alias identifier). A match is allowed, e.g.
          // "^[mM]utable" to permit `mutableFoo: string[]`.
          ignorePattern: {
            oneOf: [{ type: "string" }, { type: "array", items: { type: "string" } }],
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const { ignoreInterface = false, allowLocalMutation = false, ignorePattern } = context.options[0] ?? {};
    const patterns = (Array.isArray(ignorePattern) ? ignorePattern : ignorePattern ? [ignorePattern] : []).map((source) => new RegExp(source));

    function isIgnored(node) {
      return (allowLocalMutation && isInsideFunction(node)) || matchesIgnorePattern(node, patterns);
    }

    return {
      TSPropertySignature(node) {
        if (node.readonly) {
          return;
        }
        if (ignoreInterface && node.parent.type === "TSInterfaceBody") {
          return;
        }
        if (isIgnored(node)) {
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
        if (isIgnored(node)) {
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
        if (isIgnored(node)) {
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
        if (isIgnored(node)) {
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
