import { TableCell } from "@tiptap/extension-table-cell";

export default TableCell.extend({
    addAttributes() {
        return {
            ...this.parent?.(),
            backgroundColor: {
                default: null,
                parseHTML: element => element.style.backgroundColor || null,
                renderHTML: attributes => {
                    return {
                        style: attributes.backgroundColor
                            ? `background-color: ${attributes.backgroundColor} !important`
                            : null,
                    };
                },
            },
        };
    },
})