import type { AstNode } from "./_types.js";

const FUNCTION_TYPES = new Set(["FunctionDeclaration", "FunctionExpression", "ArrowFunctionExpression"]);

interface NodeWithBody extends AstNode {
  readonly body?: AstNode;
}

// A function's params and return-type annotation are direct children of the function node too,
// same as its body - so this only counts as "inside" when the climb passed through the body
// specifically. Otherwise a top-level exported function's own parameter/return types would
// wrongly count as "local" (mirrors eslint-plugin-functional's own `getEnclosingFunction`, which
// requires `functionNode.body === child`).
export function isInsideFunction(node: AstNode): boolean {
  let child: AstNode = node;
  let current = node.parent;
  while (current !== null) {
    if (FUNCTION_TYPES.has(current.type) && (current as NodeWithBody).body === child) {
      return true;
    }
    child = current;
    current = current.parent;
  }
  return false;
}

// Mirrors eslint-plugin-functional's `isInInterface`: any ancestor, not just the immediate
// parent - a property's value type can be nested arbitrarily deep (e.g. an index signature
// inside an object type literal that is itself a property's type) and still count as "in an
// interface".
export function isInInterface(node: AstNode): boolean {
  let current = node.parent;
  while (current !== null) {
    if (current.type === "TSInterfaceBody") {
      return true;
    }
    current = current.parent;
  }
  return false;
}

const CLASS_TYPES = new Set(["ClassDeclaration", "ClassExpression"]);

export function isClassLike(node: AstNode): boolean {
  return CLASS_TYPES.has(node.type);
}

export function isInClass(node: AstNode): boolean {
  let current = node.parent;
  while (current !== null) {
    if (CLASS_TYPES.has(current.type)) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

interface NodeWithReturnType extends AstNode {
  readonly returnType?: AstNode;
}

// Mirrors eslint-plugin-functional's `isInReturnType`: does the node (or any of its ancestors)
// sit in the `returnType` slot of an enclosing function.
export function isInReturnType(node: AstNode): boolean {
  let current: AstNode | null = node;
  while (current !== null) {
    const parent = current.parent as NodeWithReturnType | null;
    if (parent !== null && FUNCTION_TYPES.has(parent.type) && parent.returnType === current) {
      return true;
    }
    current = current.parent;
  }
  return false;
}

interface NodeWithIdentifierParts extends AstNode {
  readonly id?: AstNode | null;
  readonly key?: AstNode | null;
  readonly name?: string;
}

// Mirrors eslint-plugin-functional's `getNodeIdentifierText`/`getNodeIdentifierTexts`, trimmed to
// the node kinds reachable from this package's rules: an own `.id` (VariableDeclarator,
// TSTypeAliasDeclaration, FunctionDeclaration/Expression, ClassDeclaration/Expression) takes
// precedence, then an own `.key` (TSPropertySignature, PropertyDefinition, Property,
// MethodDefinition, TSMethodSignature).
export function getIdentifierText(node: AstNode | null | undefined): string | undefined {
  if (node === null || node === undefined) {
    return undefined;
  }
  const withParts = node as NodeWithIdentifierParts;
  if (node.type === "Identifier") {
    return withParts.name;
  }
  if (node.type === "PrivateIdentifier") {
    return `#${withParts.name}`;
  }
  if (Object.hasOwn(node, "id") && withParts.id !== null && withParts.id !== undefined) {
    return getIdentifierText(withParts.id);
  }
  if (Object.hasOwn(node, "key") && withParts.key !== null && withParts.key !== undefined) {
    return getIdentifierText(withParts.key);
  }
  return undefined;
}
