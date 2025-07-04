import Table from '@tiptap/extension-table';

const CustomTable = Table.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            uid: {
                default: null,
                parseHTML: element => element.getAttribute('data-uid'),
                renderHTML: attributes => {
                    return {
                        'data-uid': attributes.uid,
                    };
                },
            },
        };
    },
});

export default CustomTable;