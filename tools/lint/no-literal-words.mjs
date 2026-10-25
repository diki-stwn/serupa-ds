// serupa/no-literal-words: a component's words come from its labels (labels.ts, with the Indonesian), so a word
// written into its JSX is English in every language. Flags JSX text with letters and string literals given to the
// attributes people hear or read: aria-label, aria-description, aria-roledescription, aria-valuetext, title, alt,
// placeholder. Symbols and punctuation (×, →, ·) pass; so does anything in the "allow" option.
const SPOKEN = new Set(['aria-label', 'aria-description', 'aria-roledescription', 'aria-valuetext', 'title', 'alt', 'placeholder']);
const WORDS = /\p{L}{2,}/u;

export default {
  meta: { type: 'problem', schema: [{ type: 'object', properties: { allow: { type: 'array', items: { type: 'string' } } }, additionalProperties: false }], messages: { literal: 'Words in a component come from its labels (labels.ts) so they follow the language: "{{text}}"' } },
  create(context) {
    const allow = new Set(context.options[0]?.allow || []);
    const flag = (node, text) => { const t = text.trim(); if (WORDS.test(t) && !allow.has(t)) context.report({ node, messageId: 'literal', data: { text: t.slice(0, 40) } }); };
    return {
      JSXText(node) { flag(node, node.value); },
      JSXAttribute(node) {
        const name = typeof node.name.name === 'string' ? node.name.name : '';
        if (!SPOKEN.has(name) || !node.value) return;
        if (node.value.type === 'Literal' && typeof node.value.value === 'string') flag(node.value, node.value.value);
        else if (node.value.type === 'JSXExpressionContainer' && node.value.expression.type === 'Literal' && typeof node.value.expression.value === 'string') flag(node.value, node.value.expression.value);
      },
    };
  },
};
