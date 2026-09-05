const FUNCTION_TYPES = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]);

// A function's params and return-type annotation are direct children of the function node too,
// same as its body - so this only counts as "inside" when the climb passed through the body
// specifically. Otherwise a top-level exported function's own parameter/return types would
// wrongly count as "local" (mirrors eslint-plugin-functional's own `getEnclosingFunction`, which
// requires `functionNode.body === child`).
export function isInsideFunction(node) {
  for (let child = node, current = node.parent; current !== null && current !== undefined; child = current, current = current.parent) {
    if (FUNCTION_TYPES.has(current.type) && current.body === child) {
      return true;
    }
  }
  return false;
}

// Mirrors eslint-plugin-functional's `isInInterface`: any ancestor, not just the immediate
// parent - a property's value type can be nested arbitrarily deep (e.g. an index signature
// inside an object type literal that is itself a property's type) and still count as "in an
// interface".
export function isInInterface(node) {
  for (let current = node.parent; current !== null && current !== undefined; current = current.parent) {
    if (current.type === "TSInterfaceBody") {
      return true;
    }
  }
  return false;
}

const CLASS_TYPES = new Set(["ClassDeclaration", "ClassExpression"]);

export function isClassLike(node) {
  return CLASS_TYPES.has(node.type);
}

export function isInClass(node) {
  for (let current = node.parent; current !== null && current !== undefined; current = current.parent) {
    if (CLASS_TYPES.has(current.type)) {
      return true;
    }
  }
  return false;
}

// Mirrors eslint-plugin-functional's `isInReturnType`: does the node (or any of its ancestors)
// sit in the `returnType` slot of an enclosing function.
export function isInReturnType(node) {
  for (let current = node; current !== null && current !== undefined; current = current.parent) {
    const parent = current.parent;
    if (parent !== null && parent !== undefined && FUNCTION_TYPES.has(parent.type) && parent.returnType === current) {
      return true;
    }
  }
  return false;
}

// Mirrors eslint-plugin-functional's `getNodeIdentifierText`/`getNodeIdentifierTexts`, trimmed to
// the node kinds reachable from this package's rules: an own `.id` (VariableDeclarator,
// TSTypeAliasDeclaration, FunctionDeclaration/Expression, ClassDeclaration/Expression) takes
// precedence, then an own `.key` (TSPropertySignature, PropertyDefinition, Property,
// MethodDefinition, TSMethodSignature).
export function getIdentifierText(node) {
  if (node === null || node === undefined) {
    return undefined;
  }
  if (node.type === "Identifier") {
    return node.name;
  }
  if (node.type === "PrivateIdentifier") {
    return `#${node.name}`;
  }
  if (Object.hasOwn(node, "id") && node.id !== null && node.id !== undefined) {
    return getIdentifierText(node.id);
  }
  if (Object.hasOwn(node, "key") && node.key !== null && node.key !== undefined) {
    return getIdentifierText(node.key);
  }
  return undefined;
}
