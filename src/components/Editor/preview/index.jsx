import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention'
import CommentExtension from "@sereneinserenade/tiptap-comment-extension";
import SelectionHighlight from '../extensions/SelectionHighlight';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import '../style.css';
import Comments from '../components/Comments';
import BubbleMenu from '../components/BubbleMenu';

const DEFAULT_CONTENT = `
  <h1></h1>
  <p></p>
`;

const PreviewEditor = (props) => {
    const selectionRef = useRef({ from: 0, to: 0 });
    const editorSelectionRef = useRef({ from: 0, to: 0 });
    const [content] = useState(props.value || DEFAULT_CONTENT);

    const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(false);
    const [selectedComment, setSelectedComment] = useState(null);

    const extensions = useMemo(() => {
        return [
            StarterKit,
            SelectionHighlight.configure({
                getSelection: () => {
                    return selectionRef.current;
                },
            }),
            Mention.configure({
                HTMLAttributes: {
                    class: 'mention',
                },
            }),
            CommentExtension.configure({
                HTMLAttributes: {
                    class: "comment",
                },
                onCommentActivated: (commentId) => {
                    if (commentId) {
                        props.onCommentOpen(Number(commentId));

                        queueMicrotask(() => {
                            openCommentPanelOnly();
                        });
                    }
                },
            }),
        ]
    }, [])

    const editor = useEditor({
        extensions,
        content,
        editorProps: {
            attributes: {
                class: 'document-editor',
            },
        },
        onUpdate({ editor }) {
            if (props.onChange) {
                props.onChange(editor.getHTML());
            }
        },
        onSelectionUpdate({ editor }) {
            const { from, to } = editor.view.state.selection;

            editorSelectionRef.current = { from, to };
        },
    });

    const getSelection = () => {
        return editorSelectionRef.current;
    }

    const setCurrentSelection = () => {
        const selection = getSelection();
        selectionRef.current = selection;

        // Remove bubble menu
        editor.commands.setTextSelection({ from: 1, to: 1 })
    }

    const openCommentsPanel = useCallback(() => {
        if (!editor.isActive('comment')) {
            props.onCommentOpen(null);
        }

        setCurrentSelection();

        queueMicrotask(() => {
            setIsCommentsPanelOpen(true);
        });
    }, [editor, props.onCommentOpen, setCurrentSelection]);

    const openCommentPanelOnly = useCallback(() => {
        setIsCommentsPanelOpen(true);
    }, []);

    const cleanUpCommentsPanel = useCallback(() => {
        editor.chain().blur().run();

        selectionRef.current = null;
    }, []);

    const closeCommentsPanel = useCallback(() => {
        cleanUpCommentsPanel();

        setIsCommentsPanelOpen(false);
    }, []);

    const onCommentDelete = useCallback((id) => {
        props.onCommentDelete(id);
    }, [props.onCommentDelete]);

    useEffect(() => {
        setSelectedComment(props.selectedComment);
    }, [props.selectedComment]);

    useEffect(() => {
        let animationFrame = null;

        if (editor) {
            const removeContentEditable = () => {
                editor.view.dom.removeAttribute('contenteditable');

                animationFrame = requestAnimationFrame(removeContentEditable);
            }

            animationFrame = requestAnimationFrame(removeContentEditable);

            editor.view.dom.addEventListener('click', (event) => {
                const target = event.target;
                if (target.dataset.type === 'mention') {
                    const id = target.dataset.id;
                    const name = target.dataset.label;
                    console.log("Mention", id, name);
                }
            });
        }
        return () => {
            cancelAnimationFrame(animationFrame);
            editor?.destroy();
        }
    }, [editor]);

    return (
        <section className="editor-container">
            <EditorContent editor={editor} />
            <BubbleMenu preview={true} editor={editor} openCommentsPanel={openCommentsPanel} />
            <Comments
                open={isCommentsPanelOpen}
                editor={editor}
                selection={selectionRef}
                onClose={closeCommentsPanel}
                onCleanup={cleanUpCommentsPanel}
                selectedComment={selectedComment}
                onCommentCreate={props.onCommentCreate}
                onCommentReply={props.onCommentReply}
                onCommentDelete={onCommentDelete}
            />
        </section>
    )
}

export default PreviewEditor
