import Image from '@tiptap/extension-image';

function mergeStyles(existingStyle = '', newStyles) {
  const style = {};

  if (!existingStyle) existingStyle = '';

  existingStyle.split(';').forEach(pair => {
    const [k, v] = pair.split(':').map(x => x.trim());
    if (k && v) style[k] = v;
  });

  Object.assign(style, newStyles);

  return Object.entries(style)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');
}

export default Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: el => el.getAttribute('style'),
        renderHTML: attrs => attrs.style ? { style: attrs.style } : {},
      },
      align: {
        default: null,
        parseHTML: el => el.getAttribute('data-align'),
        renderHTML: attrs => (
          attrs.align ? { 'data-align': attrs.align } : {}
        ),
      },
    };
  },
  addCommands() {
    return {
      ...this.parent?.(),
      setImageStyle: options => ({ commands, state }) => {
        const { width, height } = options;
        const { selection } = state;
        const node = selection.node;

        if (!node || node.type.name !== 'image') return false;

        const newStyle = mergeStyles(node.attrs.style, {
          ...(width ? { width } : {}),
          ...(height ? { height } : {}),
        });

        return commands.updateAttributes('image', { style: newStyle || null });
      },
      setDataAttribute: ({ key, value }) => ({ commands, state }) => {
        const { selection } = state;
        const node = selection.node;
        if (!node || node.type.name !== 'image') return false;

        const attrs = {
          [key]: value,
        };

        return commands.updateAttributes('image', attrs);
      },
      isAlign: (alignValue) => ({ editor }) => {
        return editor.isActive('image', { align: alignValue });
      },
      setAlign: (align) => ({ commands, state }) => {
        const { selection } = state;
        const node = selection.node;
        if (!node || node.type.name !== 'image') return false;

        return commands.updateAttributes('image', { align });
      },
      deleteImage: () => ({ commands, state }) => {
        const { selection } = state;
        const node = selection.node;
        if (!node || node.type.name !== 'image') return false;

        return commands.deleteRange({ from: selection.from, to: selection.to });
      },
    };
  },
});
