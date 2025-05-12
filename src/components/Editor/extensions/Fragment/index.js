import { Node, mergeAttributes } from '@tiptap/core';

export default Node.create({
  name: 'fragment',
  group: 'inline',
  inline: true,
  content: 'block*',
  selectable: true,
  atom: false,
  parseHTML() {
    return [
      {
        tag: 'span[data-type="fragment"]',
      },
    ];
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-type': 'fragment' }), 0];
  },
});