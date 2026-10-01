import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

const babel = require('@babel/core');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

// Compile the actual prop/default functions: a plain formatter crashes the native UI runtime.
for (const [component, values] of [
  ['TickingNumber', [[0, '0'], [12.6, '13']]],
  ['AnswerTierCard', [[50, '$0.50'], [250, '$2.50']]],
  ['ConfidenceRing', [[0, '0%'], [92.4, '92%']]],
] as const) {
  test(`${component}'s number formatter runs as a serialized UI worklet`, () => {
    const filename = resolve(`src/components/${component}.tsx`);
    const source = readFileSync(filename, 'utf8');
    const ast = parser.parse(source, { sourceType: 'module', plugins: ['typescript', 'jsx'] });
    let formatter: { start: number; end: number } | undefined;
    traverse(ast, {
      AssignmentPattern(path: { node: { left: { name?: string }; right: typeof formatter } }) {
        if (path.node.left.name === 'formatter') formatter = path.node.right;
      },
      JSXAttribute(path: { node: { name: { name: string }; value: { expression: typeof formatter } } }) {
        if (path.node.name.name === 'formatter') formatter = path.node.value.expression;
      },
    });
    assert.ok(formatter, 'formatter exists');
    const expression = source.slice(formatter.start, formatter.end);
    const compile = (body: string) => {
      const { code } = babel.transformSync(`module.exports = ${body}`, {
        filename, configFile: false, babelrc: false,
        plugins: ['react-native-worklets/plugin'],
      });
      const context = { module: { exports: {} as { __workletHash?: number; __initData?: { code: string } } }, global: { Error } };
      runInNewContext(code, context);
      return context.module.exports;
    };
    // Reproduce the old failure: the formatter had no function on the UI runtime.
    assert.equal(compile(expression.replace(/'worklet';\s*/, '')).__workletHash, undefined);
    const compiled = compile(expression);
    assert.equal(typeof compiled.__workletHash, 'number');
    assert.ok(compiled.__initData);
    const uiFormatter = runInNewContext(`(${compiled.__initData.code})`);
    for (const [input, expected] of values) assert.equal(uiFormatter(input), expected);
  });
}
