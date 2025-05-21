import { Extension } from '@tiptap/core';

// This extension is used to prevent suspicious updates to the editor, such as using browser devtools to change the content
const PreventSuspiciousUpdate = Extension.create({
    name: 'preventSuspiciousUpdate',

    addOptions() {
        return {
            onChange: () => {},
        }
    },

    addStorage() {
        return {
            lastKnownGoodContent: '',
            isProgrammaticUpdate: false,
        }
    },

    onCreate() {
        this.storage.lastKnownGoodContent = this.editor.getHTML();
    },

    addCommands() {
        return {
            programmaticallySetContent: (content) => ({ commands }) => {
                this.storage.isProgrammaticUpdate = true;
                
                queueMicrotask(() => {
                    this.storage.isProgrammaticUpdate = false;
                });

                return commands.setContent(content, true);
            },
        }
    },

    onTransaction({ transaction }) {
        if (this.storage.isProgrammaticUpdate) {
            return;
        }

        const markType = transaction.steps?.[0]?.mark?.type?.name;
        const isFromKnownUI = transaction.getMeta('uiEvent') || markType === 'comment';

        if (transaction.docChanged && !isFromKnownUI) {
            transaction.setMeta('suspiciousClientUpdate', true);
        }
    },

    onUpdate({ editor, transaction }) {
        const currentHtml = editor.getHTML();
        
        if (transaction?.getMeta('suspiciousClientUpdate') && !this.storage.isProgrammaticUpdate) {
            this.editor.commands.programmaticallySetContent(this.storage.lastKnownGoodContent);
            return;
        }

        this.options.onChange(currentHtml);
        this.storage.lastKnownGoodContent = currentHtml;
    },
}); 

export default PreventSuspiciousUpdate;