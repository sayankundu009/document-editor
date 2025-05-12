import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const SelectionDecoration = Extension.create({
  name: 'selectionDecoration',

  addOptions() {
    return {
      className: 'selection-highlight',
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('selection'),
        props: {
          decorations: (state) => {
            const selection = this.options?.getSelection();

            if (!selection) {
              return null;
            }

            return DecorationSet.create(state.doc, [
              Decoration.inline(selection.from, selection.to, {
                class: this.options.className,
              }),
            ]);
          },
        },
      }),
    ];
  },
});

export { SelectionDecoration };

export default SelectionDecoration;