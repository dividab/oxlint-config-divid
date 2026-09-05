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

tester.run("no-let", noLet, {
  valid: [
    "const x = 1;",
    { code: "for (let i = 0; i < 10; i++) {}", options: [{ ignoreForLoopInit: true }] },
    { code: "function f() { let x = 1; }", options: [{ allowInFunctions: true }] },
    { code: "let mutableFoo = 1;", options: [{ ignoreIdentifierPattern: "^[mM]utable" }] },
  ],
  invalid: [
    { code: "let x = 1;", errors: [{ messageId: "noLet" }] },
    { code: "for (let i = 0; i < 10; i++) {}", errors: [{ messageId: "noLet" }] },
    { code: "let x = 1;", options: [{ allowInFunctions: true }], errors: [{ messageId: "noLet" }] },
    {
      code: "let x = 1;",
      options: [{ ignoreIdentifierPattern: "^[mM]utable" }],
      errors: [{ messageId: "noLet" }],
    },
  ],
});

tester.run("no-classes", noClasses, {
  valid: ["function f() {}", { code: "class MyError extends Error {}", options: [{ ignoreIdentifierPattern: "^.*Error$" }] }],
  invalid: [
    { code: "class Foo {}", errors: [{ messageId: "noClass" }] },
    { code: "const Foo = class {};", errors: [{ messageId: "noClass" }] },
    {
      code: "class Foo {}",
      options: [{ ignoreIdentifierPattern: "^.*Error$" }],
      errors: [{ messageId: "noClass" }],
    },
  ],
});

tester.run("no-this-expressions", noThisExpressions, {
  valid: ["function f(x) { return x; }"],
  invalid: [{ code: "function f() { return this.x; }", errors: [{ messageId: "noThis" }] }],
});

tester.run("prefer-readonly-type", preferReadonlyType, {
  valid: [
    "interface Foo { readonly bar: string; }",
    { code: "interface Foo { bar: string; }", options: [{ ignoreInterface: true }] },
    "type Foo = readonly string[];",
    "type Foo = ReadonlyArray<string>;",
    "type Foo = readonly [string, number];",
    { code: "function f() { const x: string[] = []; }", options: [{ allowLocalMutation: true }] },
    { code: "function f() { const x: [string, number] = ['a', 1]; }", options: [{ allowLocalMutation: true }] },
    { code: "interface Foo { mutableBar: string[]; }", options: [{ ignorePattern: "^[mM]utable" }] },
    { code: "type MutableFoo = string[];", options: [{ ignorePattern: "^[mM]utable" }] },
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
      errors: [{ messageId: "arrayNotReadonly" }],
    },
    {
      code: "type Foo = [string, number];",
      output: "type Foo = readonly [string, number];",
      errors: [{ messageId: "tupleNotReadonly" }],
    },
    {
      code: "function f(x: string[]) {}",
      output: "function f(x: readonly string[]) {}",
      errors: [{ messageId: "arrayNotReadonly" }],
    },
    // A parameter's own type isn't "inside" the function's body - only what's declared within
    // the body is local. Regression test: a naive "any function ancestor" check would wrongly
    // exempt this.
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
  ],
});
