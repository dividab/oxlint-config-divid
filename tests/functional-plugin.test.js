import { describe, it } from "vitest";
import { RuleTester } from "oxlint/plugins-dev";

import noClasses from "../rules/no-classes.js";
import noLet from "../rules/no-let.js";
import noThisExpressions from "../rules/no-this-expressions.js";
import preferReadonlyType from "../rules/prefer-readonly-type.js";

RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.setDefaultConfig({ languageOptions: { parserOptions: { lang: "ts" } } });

const tester = new RuleTester();

// Test cases below are adapted from eslint-plugin-functional's own test suite
// (https://github.com/eslint-functional/eslint-plugin-functional, tests/rules/*.test.ts), tracking
// which of its behaviors this JS-plugin port actually implements. `checkImplicit` cases for
// prefer-readonly-type are intentionally omitted: that check needs a TypeScript program
// (`getTypeOfNode`) that oxlint's JS-plugin API doesn't give rule authors access to.

tester.run("no-let", noLet, {
  valid: [
    "const x = 1;",

    // allowInFunctions
    { code: "function foo() { let x; let y = 0; }", options: [{ allowInFunctions: true }] },
    { code: "const foo = () => { let x; let y = 0; };", options: [{ allowInFunctions: true }] },
    { code: "class Foo { foo() { let x; let y = 0; } }", options: [{ allowInFunctions: true }] },

    // allowInForLoopInit
    { code: "for (let x = 0; x < 1; x++);", options: [{ allowInForLoopInit: true }] },

    // ignoreIdentifierPattern - "^mutable"
    { code: "let mutable; let mutableX;", options: [{ ignoreIdentifierPattern: "^mutable" }] },
    { code: "let mutable = 0; let mutableX = 0;", options: [{ ignoreIdentifierPattern: "^mutable" }] },
    { code: "for (let mutableX = 0; mutableX < 1; mutableX++);", options: [{ ignoreIdentifierPattern: "^mutable" }] },
    { code: "for (let mutableX in {});", options: [{ ignoreIdentifierPattern: "^mutable" }] },
    { code: "for (let mutableX of []);", options: [{ ignoreIdentifierPattern: "^mutable" }] },
    {
      code: "function foo() { let mutableX; let mutableY = 0; }",
      options: [{ ignoreIdentifierPattern: "^mutable" }],
    },
    {
      code: "const foo = () => { let mutableX; let mutableY = 0; }",
      options: [{ ignoreIdentifierPattern: "^mutable" }],
    },
    {
      code: "class Foo { foo() { let mutableX; let mutableY = 0; } }",
      options: [{ ignoreIdentifierPattern: "^mutable" }],
    },

    // ignoreIdentifierPattern - "Mutable$"
    { code: "let Mutable; let xMutable;", options: [{ ignoreIdentifierPattern: "Mutable$" }] },
    { code: "let Mutable = 0; let xMutable = 0;", options: [{ ignoreIdentifierPattern: "Mutable$" }] },
    { code: "for (let xMutable = 0; xMutable < 1; xMutable++);", options: [{ ignoreIdentifierPattern: "Mutable$" }] },
    { code: "for (let xMutable in {});", options: [{ ignoreIdentifierPattern: "Mutable$" }] },
    { code: "for (let xMutable of []);", options: [{ ignoreIdentifierPattern: "Mutable$" }] },
    {
      code: "function foo() { let xMutable; let yMutable = 0; }",
      options: [{ ignoreIdentifierPattern: "Mutable$" }],
    },
    {
      code: "const foo = () => { let xMutable; let yMutable = 0; }",
      options: [{ ignoreIdentifierPattern: "Mutable$" }],
    },
    {
      code: "class Foo { foo() { let xMutable; let yMutable = 0; } }",
      options: [{ ignoreIdentifierPattern: "Mutable$" }],
    },
  ],
  invalid: [
    {
      code: "let x;\nfunction foo() {\n  let y;\n  let z = 0;\n}",
      errors: [{ messageId: "noLet" }, { messageId: "noLet" }, { messageId: "noLet" }],
    },

    // allowInFunctions doesn't exempt top-level lets
    {
      code: "let x;\nlet y = 0;",
      options: [{ allowInFunctions: true }],
      errors: [{ messageId: "noLet" }, { messageId: "noLet" }],
    },

    // ignoreIdentifierPattern - "^mutable", non-matching names still reported
    {
      code: "let immutable;\nlet immutableX;",
      options: [{ ignoreIdentifierPattern: "^mutable" }],
      errors: [{ messageId: "noLet" }, { messageId: "noLet" }],
    },
    {
      code: "let immutable = 0;\nlet immutableX = 0;",
      options: [{ ignoreIdentifierPattern: "^mutable" }],
      errors: [{ messageId: "noLet" }, { messageId: "noLet" }],
    },
    {
      code: "for (let immutableX = 0; immutableX < 1; immutableX++);",
      options: [{ ignoreIdentifierPattern: "^mutable" }],
      errors: [{ messageId: "noLet" }],
    },
    {
      code: "for (let immutableX in {});",
      options: [{ ignoreIdentifierPattern: "^mutable" }],
      errors: [{ messageId: "noLet" }],
    },
    {
      code: "for (let immutableX of []);",
      options: [{ ignoreIdentifierPattern: "^mutable" }],
      errors: [{ messageId: "noLet" }],
    },
    {
      code: "const foo = () => { let immutableX; let immutableY = 0; }",
      options: [{ ignoreIdentifierPattern: "^mutable" }],
      errors: [{ messageId: "noLet" }, { messageId: "noLet" }],
    },
    {
      code: "function foo() { let immutableX; let immutableY = 0; }",
      options: [{ ignoreIdentifierPattern: "^mutable" }],
      errors: [{ messageId: "noLet" }, { messageId: "noLet" }],
    },
    {
      code: "class Foo { foo() { let immutableX; let immutableY = 0; } }",
      options: [{ ignoreIdentifierPattern: "^mutable" }],
      errors: [{ messageId: "noLet" }, { messageId: "noLet" }],
    },

    // ignoreIdentifierPattern - "Mutable$", non-matching names still reported
    {
      code: "let Immutable;\nlet xImmutable;",
      options: [{ ignoreIdentifierPattern: "Mutable$" }],
      errors: [{ messageId: "noLet" }, { messageId: "noLet" }],
    },
    {
      code: "let Immutable = 0;\nlet xImmutable = 0;",
      options: [{ ignoreIdentifierPattern: "Mutable$" }],
      errors: [{ messageId: "noLet" }, { messageId: "noLet" }],
    },
    {
      code: "for (let xImmutable = 0; xImmutable < 1; xImmutable++);",
      options: [{ ignoreIdentifierPattern: "Mutable$" }],
      errors: [{ messageId: "noLet" }],
    },
    {
      code: "for (let xImmutable in {});",
      options: [{ ignoreIdentifierPattern: "Mutable$" }],
      errors: [{ messageId: "noLet" }],
    },
    {
      code: "for (let xImmutable of []);",
      options: [{ ignoreIdentifierPattern: "Mutable$" }],
      errors: [{ messageId: "noLet" }],
    },
    {
      code: "function foo() { let xImmutable; let yImmutable = 0; }",
      options: [{ ignoreIdentifierPattern: "Mutable$" }],
      errors: [{ messageId: "noLet" }, { messageId: "noLet" }],
    },
    {
      code: "const foo = () => { let xImmutable; let yImmutable = 0; }",
      options: [{ ignoreIdentifierPattern: "Mutable$" }],
      errors: [{ messageId: "noLet" }, { messageId: "noLet" }],
    },
    {
      code: "class Foo { foo() { let xImmutable; let yImmutable = 0; } }",
      options: [{ ignoreIdentifierPattern: "Mutable$" }],
      errors: [{ messageId: "noLet" }, { messageId: "noLet" }],
    },
  ],
});

tester.run("no-classes", noClasses, {
  valid: [
    "function Foo() {}",
    { code: "class Foo {}", options: [{ ignoreIdentifierPattern: "^Foo$" }] },
    { code: "class Foo {}", options: [{ ignoreCodePattern: "class Foo" }] },
  ],
  invalid: [
    { code: "class Foo {}", errors: [{ messageId: "noClass" }] },
    { code: "const klass = class {}", errors: [{ messageId: "noClass" }] },
    {
      code: "class Bar {}",
      options: [{ ignoreIdentifierPattern: "^Foo$" }],
      errors: [{ messageId: "noClass" }],
    },
    {
      code: "class Bar {}",
      options: [{ ignoreCodePattern: "class Foo" }],
      errors: [{ messageId: "noClass" }],
    },
  ],
});

tester.run("no-this-expressions", noThisExpressions, {
  valid: ["function foo() { bar(); }"],
  invalid: [{ code: "function foo() { this.bar(); }", errors: [{ messageId: "noThis" }] }],
});

tester.run("prefer-readonly-type", preferReadonlyType, {
  valid: [
    // basics
    "interface Foo { readonly a: number, readonly b: ReadonlyArray<string>, readonly c: () => string, readonly d: { readonly [key: string]: string }, readonly [key: string]: string, }",
    "type Foo = readonly string[];",
    "type Foo = ReadonlyArray<string>;",
    "type Foo = readonly [string, number];",
    "function foo(): ReadonlyArray<number> { return [1, 2, 3]; }",
    "const foo = (): readonly number[] => { return [1, 2, 3]; }",
    "function foo(...a: ReadonlyArray<number>) { console.log(a); }",
    "const foo = (...a: readonly number[]) => { console.log(a); }",
    "const foo = (tuple: readonly [number, string, readonly [number, string]]) => {}",
    "function foo() { type Foo = ReadonlyArray<string>; }",
    "const foo: ReadonlyArray<string> = [];",
    "interface Foo { (): void\n  foo(): void }",
    "let foo: { readonly [key: string]: number };",
    "type foo = ReadonlyArray<{ readonly type: string, readonly code: string }>;",
    "const func = (x: { readonly [key in string]: number }) => {}",
    // checkImplicit isn't ported (needs type info) - confirm implicit array literals are simply
    // invisible to this rule rather than accidentally flagged by something else.
    "const foo = [1, 2, 3]; function bar(param = [1, 2, 3]) {}",
    `interface Foo {
      readonly a: number,
      readonly b: ReadonlyArray<string>,
      readonly c: () => string,
      readonly d: { readonly [key: string]: string },
      readonly [key: string]: string,
    }`,
    `interface Foo {
      readonly a: number,
      readonly b: ReadonlyArray<string>,
      readonly c: () => string,
      readonly d: { readonly [key: string]: string },
      readonly [key: string]: string,
      readonly e: {
        readonly a: number,
        readonly b: ReadonlyArray<string>,
        readonly c: () => string,
        readonly d: { readonly [key: string]: string },
        readonly [key: string]: string,
      }
    }`,
    `let foo: {
      readonly a: number,
      readonly b: ReadonlyArray<string>,
      readonly c: () => string,
      readonly d: { readonly [key: string]: string }
      readonly [key: string]: string
    };`,
    `class Klass {
      constructor (
        nonParameterProp,
        readonly readonlyProp: string,
        public readonly publicReadonlyProp: string,
        protected readonly protectedReadonlyProp: string,
        private readonly privateReadonlyProp: string,
      ) { }
    }`,

    // allowLocalMutation
    { code: "function f() { const x: string[] = []; }", options: [{ allowLocalMutation: true }] },
    { code: "function f() { const x: [string, number] = ['a', 1]; }", options: [{ allowLocalMutation: true }] },
    // The real suite's own allowLocalMutation test only exercises array/tuple locals - covering
    // the TSTypeReference (Array/Map/Set) and TSMappedType paths too, since they run through the
    // same shared isIgnored() check but are otherwise untested under this option.
    { code: "function f() { const x: Array<string> = []; }", options: [{ allowLocalMutation: true }] },
    { code: "function f() { const x: Map<string, number> = new Map(); }", options: [{ allowLocalMutation: true }] },
    { code: "function f() { const x: { [key in string]: number } = {}; }", options: [{ allowLocalMutation: true }] },
    // params/return types are not "local" even under allowLocalMutation
    // (see the invalid case below for the actual regression guard)
    {
      code: `function foo() {
        let foo: {
          a: number,
          b: ReadonlyArray<string>,
          c: () => string,
          d: { [key: string]: string },
          [key: string]: string,
          readonly d: {
            a: number,
            b: ReadonlyArray<string>,
            c: () => string,
            d: { [key: string]: string },
            [key: string]: string,
          }
        }
      };`,
      options: [{ allowLocalMutation: true }],
    },

    // ignorePattern
    { code: "let mutableFoo: string[] = [];", options: [{ ignorePattern: "^mutable" }] },
    { code: "interface Foo { mutableBar: string[]; }", options: [{ ignorePattern: "^[mM]utable" }] },
    { code: "type MutableFoo = string[];", options: [{ ignorePattern: "^[mM]utable" }] },

    // ignoreInterface
    {
      code: "interface Foo { foo: number, bar: ReadonlyArray<string>, baz: () => string, qux: { [key: string]: string } }",
      options: [{ ignoreInterface: true }],
    },
    // The real suite's own ignoreInterface test only has already-readonly array/tuple values, so
    // it never actually exercises isInInterface being checked from the array/tuple/type-reference
    // visitors (as opposed to the property visitor) - unlike the property-level check, this isn't
    // inherited "for free" from a shared node type, since TSArrayType/TSTupleType/TSTypeReference
    // are separate visitor functions.
    {
      code: "interface Foo { bar: Array<string>; baz: string[]; qux: [string, number]; }",
      options: [{ ignoreInterface: true }],
    },

    // ignoreClass
    {
      code: "class Klass { foo: number; private bar: number; static baz: number; private static qux: number; }",
      options: [{ ignoreClass: true }],
    },
    // Same gap as ignoreInterface above: the real suite's own test only has plain (non-array/
    // tuple/collection) field types, so it never exercises isInClass from the array/tuple/
    // type-reference visitors.
    {
      code: "class Klass { foo: Array<string>; bar: string[]; baz: [string, number]; }",
      options: [{ ignoreClass: true }],
    },
    {
      code: "class Klass { foo: number; private bar: number; static baz: number; private static qux: number; }",
      options: [{ ignoreClass: "fieldsOnly" }],
    },

    // ignorePattern matching the enclosing function's own name (not just a property/variable/
    // type-alias name) - regression test for getIdentifierText only handling declarations with a
    // `.key`/simple name lookup, and missing `.id` on function-like nodes (return types).
    {
      code: "function mutableFoo(): string[] { return []; }",
      options: [{ ignorePattern: "^[mM]utable" }],
    },
    // ignoreCollections
    { code: "type Foo = Array<string>;", options: [{ ignoreCollections: true }] },
    { code: "const foo: number[] = [];", options: [{ ignoreCollections: true }] },
    { code: "type Foo = [string, string];", options: [{ ignoreCollections: true }] },
    { code: "const foo: [string, string] = ['foo', 'bar'];", options: [{ ignoreCollections: true }] },
    { code: "type Foo = Set<string>;", options: [{ ignoreCollections: true }] },
    { code: "const foo: Set<string> = new Set();", options: [{ ignoreCollections: true }] },
    { code: "type Foo = Map<string, string>;", options: [{ ignoreCollections: true }] },
    { code: "const foo: Map<string, string> = new Map();", options: [{ ignoreCollections: true }] },

    // allowMutableReturnType
    {
      code: "function foo(...numbers: ReadonlyArray<number>): Array<number> {}",
      options: [{ allowMutableReturnType: true }],
    },
    {
      code: "function bar(...numbers: readonly number[]): number[] {}",
      options: [{ allowMutableReturnType: true }],
    },
    {
      code: "const foo = (...numbers: ReadonlyArray<number>): Array<number> => {}",
      options: [{ allowMutableReturnType: true }],
    },
    {
      code: "class Foo { foo(...numbers: ReadonlyArray<number>): Array<number> {} }",
      options: [{ allowMutableReturnType: true }],
    },
    {
      code: "function foo(...numbers: ReadonlyArray<number>): Promise<Array<number>> {}",
      options: [{ allowMutableReturnType: true }],
    },
    {
      code: "function foo(...numbers: ReadonlyArray<number>): Promise<Foo<Array<number>>> {}",
      options: [{ allowMutableReturnType: true }],
    },
    {
      code: "function foo(...numbers: ReadonlyArray<number>): { readonly a: Array<number> } | { readonly b: string[] } {}",
      options: [{ allowMutableReturnType: true }],
    },
    {
      code: "function foo(...numbers: ReadonlyArray<number>): { readonly a: Array<number> } & { readonly b: string[] } {}",
      options: [{ allowMutableReturnType: true }],
    },
    {
      code: "function foo<T>(x: T): T extends Array<number> ? string : number[] {}",
      options: [{ allowMutableReturnType: true }],
    },
    {
      code: "function foo(bar: string): { baz: number } { return 1; }",
      options: [{ allowMutableReturnType: true }],
    },
  ],
  invalid: [
    {
      code: "interface Foo { bar: string; }",
      output: "interface Foo { readonly bar: string; }",
      errors: [{ messageId: "propertyNotReadonly" }],
    },
    {
      code: "type Foo = string[];",
      output: "type Foo = readonly string[];",
      errors: [{ messageId: "arrayNotReadonly" }],
    },
    {
      code: "type Foo = Array<string>;",
      output: "type Foo = ReadonlyArray<string>;",
      errors: [{ messageId: "typeNotReadonly" }],
    },
    {
      code: "type Foo = Set<string>;",
      output: "type Foo = ReadonlySet<string>;",
      errors: [{ messageId: "typeNotReadonly" }],
    },
    {
      code: "type Foo = Map<string, string>;",
      output: "type Foo = ReadonlyMap<string, string>;",
      errors: [{ messageId: "typeNotReadonly" }],
    },
    {
      code: "type Foo = [string, number];",
      output: "type Foo = readonly [string, number];",
      errors: [{ messageId: "tupleNotReadonly" }],
    },
    {
      // Array<T> nested inside another generic still gets checked.
      code: "function foo(a: number[], b: Promise<number[]>) {}",
      output: "function foo(a: readonly number[], b: Promise<readonly number[]>) {}",
      errors: [{ messageId: "arrayNotReadonly" }, { messageId: "arrayNotReadonly" }],
    },
    {
      code: "function foo(a: Array<number>, b: Promise<Array<number>>) {}",
      output: "function foo(a: ReadonlyArray<number>, b: Promise<ReadonlyArray<number>>) {}",
      errors: [{ messageId: "typeNotReadonly" }, { messageId: "typeNotReadonly" }],
    },
    {
      code: "function foo(a: Set<number>, b: Promise<Set<number>>) {}",
      output: "function foo(a: ReadonlySet<number>, b: Promise<ReadonlySet<number>>) {}",
      errors: [{ messageId: "typeNotReadonly" }, { messageId: "typeNotReadonly" }],
    },
    {
      code: "function foo(a: Map<string, number>, b: Promise<Map<string, number>>) {}",
      output: "function foo(a: ReadonlyMap<string, number>, b: Promise<ReadonlyMap<string, number>>) {}",
      errors: [{ messageId: "typeNotReadonly" }, { messageId: "typeNotReadonly" }],
    },
    {
      code: "interface Foo { readonly bar: Array<string>; readonly baz: Promise<Array<string>>; }",
      output: "interface Foo { readonly bar: ReadonlyArray<string>; readonly baz: Promise<ReadonlyArray<string>>; }",
      errors: [{ messageId: "typeNotReadonly" }, { messageId: "typeNotReadonly" }],
    },
    {
      code: `interface Foo {
        readonly [key: string]: {
          readonly a: Array<string>;
          readonly b: Promise<Array<string>>;
        };
      }`,
      output: `interface Foo {
        readonly [key: string]: {
          readonly a: ReadonlyArray<string>;
          readonly b: Promise<ReadonlyArray<string>>;
        };
      }`,
      errors: [{ messageId: "typeNotReadonly" }, { messageId: "typeNotReadonly" }],
    },
    {
      code: "interface Bar { [key: string]: string }",
      output: "interface Bar { readonly [key: string]: string }",
      errors: [{ messageId: "propertyNotReadonly" }],
    },
    {
      code: "interface Baz { [key: string]: { prop: string } }",
      output: "interface Baz { readonly [key: string]: { readonly prop: string } }",
      errors: [{ messageId: "propertyNotReadonly" }, { messageId: "propertyNotReadonly" }],
    },
    {
      code: `let foo: {
        a: number,
        b: ReadonlyArray<string>,
        c: () => string,
        d: { readonly [key: string]: string },
        [key: string]: string,
        readonly e: {
          a: number,
          b: ReadonlyArray<string>,
          c: () => string,
          d: { readonly [key: string]: string },
          [key: string]: string,
        }
      };`,
      output: `let foo: {
        readonly a: number,
        readonly b: ReadonlyArray<string>,
        readonly c: () => string,
        readonly d: { readonly [key: string]: string },
        readonly [key: string]: string,
        readonly e: {
          readonly a: number,
          readonly b: ReadonlyArray<string>,
          readonly c: () => string,
          readonly d: { readonly [key: string]: string },
          readonly [key: string]: string,
        }
      };`,
      errors: Array.from({ length: 10 }, () => ({ messageId: "propertyNotReadonly" })),
    },
    {
      code: "class Klass { foo: number; private bar: number; static baz: number; private static qux: number; }",
      output: "class Klass { readonly foo: number; private readonly bar: number; static readonly baz: number; private static readonly qux: number; }",
      errors: [
        { messageId: "propertyNotReadonly" },
        { messageId: "propertyNotReadonly" },
        { messageId: "propertyNotReadonly" },
        { messageId: "propertyNotReadonly" },
      ],
    },
    {
      code: "class Klass { constructor(public publicProp, protected protectedProp, private privateProp) { } }",
      output: "class Klass { constructor(public readonly publicProp, protected readonly protectedProp, private readonly privateProp) { } }",
      errors: [{ messageId: "propertyNotReadonly" }, { messageId: "propertyNotReadonly" }, { messageId: "propertyNotReadonly" }],
    },
    {
      code: "const func = (x: { [key in string]: number }) => {}",
      output: "const func = (x: { readonly [key in string]: number }) => {}",
      errors: [{ messageId: "propertyNotReadonly" }],
    },
    // Unlike array/tuple/type-reference/index-signature checks, ignorePattern can never exempt a
    // mapped type - eslint-plugin-functional's own shouldIgnorePattern2 doesn't unwrap through
    // TSMappedType to find an enclosing name, and a TSMappedType node has no name of its own.
    {
      code: "const func = (mutableFoo: { [key in string]: number }) => {}",
      output: "const func = (mutableFoo: { readonly [key in string]: number }) => {}",
      options: [{ ignorePattern: "^[mM]utable" }],
      errors: [{ messageId: "propertyNotReadonly" }],
    },

    // A parameter's own type isn't "inside" the function's body - only what's declared within
    // the body is local. Regression test: a naive "any function ancestor" check would wrongly
    // exempt this.
    {
      code: "function f(x: string[]) {}",
      output: "function f(x: readonly string[]) {}",
      errors: [{ messageId: "arrayNotReadonly" }],
    },
    {
      code: "function f(x: string[]) {}",
      output: "function f(x: readonly string[]) {}",
      options: [{ allowLocalMutation: true }],
      errors: [{ messageId: "arrayNotReadonly" }],
    },

    {
      code: "interface Foo { bar: string; }",
      output: "interface Foo { readonly bar: string; }",
      options: [{ ignorePattern: "^[mM]utable" }],
      errors: [{ messageId: "propertyNotReadonly" }],
    },

    // ignoreClass "fieldsOnly" only exempts the field declarations themselves, not other
    // violations lexically nested inside the class.
    {
      code: "class Klass { foo: number; method() { let bar: { foo: number; }; } }",
      output: "class Klass { foo: number; method() { let bar: { readonly foo: number; }; } }",
      options: [{ ignoreClass: "fieldsOnly" }],
      errors: [{ messageId: "propertyNotReadonly" }],
    },
  ],
});
