/**
 * oxlint's alpha JS-plugin API (https://oxc.rs/docs/guide/usage/linter/js-plugins.html) ships
 * `oxlint/plugins-dev` types, but that module only exports `RuleTester` - `Context`, `Rule` and the
 * AST node shapes rule authors actually need aren't exported. These are hand-rolled to match its
 * documented runtime shape, scoped to exactly what this package's rules touch (not a full AST).
 */

// `range` is a plain (non-readonly) tuple, matching oxlint's own `Range` type - a `readonly
// [number, number]` here would make `AstNode` structurally incompatible with the real `Ranged`
// interface oxlint's actual `Context`/`Fixer` methods take, since a readonly tuple isn't
// assignable where a mutable one is expected.
export interface AstNode {
  readonly type: string;
  readonly parent: AstNode | null;
  // oxlint-disable-next-line functional/prefer-readonly-type -- see the file-level comment above.
  readonly range: [number, number];
}

export interface Fix {
  // oxlint-disable-next-line functional/prefer-readonly-type -- see the file-level comment above.
  readonly range: [number, number];
  readonly text: string;
}

export interface Fixer {
  readonly insertTextBefore: (nodeOrRange: AstNode, text: string) => Fix;
  // oxlint-disable-next-line functional/prefer-readonly-type -- see the file-level comment above.
  readonly insertTextBeforeRange: (range: [number, number], text: string) => Fix;
  readonly replaceText: (nodeOrRange: AstNode, text: string) => Fix;
}

export interface Diagnostic {
  readonly node: AstNode;
  readonly messageId: string;
  readonly fix?: (fixer: Fixer) => Fix | null | undefined;
}

export interface Context {
  readonly options: ReadonlyArray<unknown>;
  readonly sourceCode: {
    readonly getText: (node?: AstNode | null) => string;
  };
  readonly report: (diagnostic: Diagnostic) => void;
}

// `any` here (not `unknown`) deliberately: it lets each rule's visitor keys declare concrete node
// parameter types (e.g. `(node: ClassLike) => void`) while still matching this shape.
// oxlint-disable-next-line typescript/no-explicit-any
export type Visitor = Record<string, ((node: any) => void) | undefined>;

export interface RuleMeta {
  readonly type?: "problem" | "suggestion" | "layout";
  readonly docs?: { readonly description?: string };
  readonly messages?: Record<string, string>;
  readonly fixable?: "code" | "whitespace";
  readonly schema?: ReadonlyArray<unknown>;
}

export interface Rule {
  readonly meta?: RuleMeta;
  readonly create: (context: Context) => Visitor;
}
