// serupa/no-literal-delay: a component's waits are named in src/internal/timing.ts (TF6), so two waits that must agree
// (Button's busy wait and Loader's delay) can't drift apart. Flags a number written as the delay of a setTimeout or
// setInterval, and a number given as the fallback of one (`timeout ?? 2000`, `a ? 300 : b`). 0 (the next task) passes,
// and so does a margin added to a measured duration (`ms + 50`), which is slack for the browser and not a wait of its own.
const TIMERS = new Set(['setTimeout', 'setInterval']);
const name = (callee) => (callee.type === 'Identifier' ? callee.name : callee.type === 'MemberExpression' && !callee.computed ? callee.property.name : '');
const literal = (n) => n && n.type === 'Literal' && typeof n.value === 'number' && n.value !== 0;

export default {
  meta: { type: 'suggestion', schema: [], messages: { literal: 'Name this wait in src/internal/timing.ts and import it ({{value}}ms)' } },
  create(context) {
    const check = (n) => {
      if (!n) return;
      if (literal(n)) context.report({ node: n, messageId: 'literal', data: { value: String(n.value) } });
      else if (n.type === 'LogicalExpression') check(n.right);
      else if (n.type === 'ConditionalExpression') { check(n.consequent); check(n.alternate); }
    };
    return { CallExpression(node) { if (TIMERS.has(name(node.callee))) check(node.arguments[1]); } };
  },
};
