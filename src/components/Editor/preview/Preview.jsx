import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Mention from '@tiptap/extension-mention';
import CommentExtension from "@sereneinserenade/tiptap-comment-extension";
import SelectionHighlight from '../extensions/SelectionHighlight';
import PreventSuspiciousUpdate from '../extensions/PreventSuspiciousUpdate';

import Image from '../extensions/Image'

import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '../extensions/Table/TableCell'
import TableHeader from '../extensions/Table/TableHeader'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Comments from '../components/Comments';
import BubbleMenu from '../components/BubbleMenu';

import '../style.css';

const DEFAULT_CONTENT = `
  <h1></h1>
  <p></p>
`;

const PreviewEditor = (props) => {
    const selectionRef = useRef({ from: 0, to: 0 });
    const editorSelectionRef = useRef({ from: 0, to: 0 });
    const isMountedRef = useRef(false);

    const [initialEditorContent] = useState(props.value || DEFAULT_CONTENT);

    const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(false);
    const [selectedComment, setSelectedComment] = useState(null);

    const extensions = useMemo(() => {
        return [
            StarterKit.configure({
                history: false,
            }),
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
            PreventSuspiciousUpdate.configure({
                onChange: props.onChange,
            }),
            Image.configure({
                allowBase64: true,
                HTMLAttributes: {
                    class: "editor-image",
                }
            }),
            Table,
            TableRow,
            TableHeader,
            TableCell,
        ]
    }, [props.onCommentOpen, props.onChange]);

    const editor = useEditor({
        extensions,
        content: initialEditorContent,
        editorProps: {
            attributes: {
                class: 'document-editor',
            },
            handleDOMEvents: {
                drop: (view, e) => { e.preventDefault(); return true; },
            },
            handlePaste() {
                return true;
            }
        },
        dropCursor: { width: 0, color: 'transparent' },
        onSelectionUpdate({ editor }) {
            const { from, to } = editor.view.state.selection;
            editorSelectionRef.current = { from, to };
        },
    });

    // If value changes from parent, set the editor content
    useEffect(() => {
        if (!isMountedRef.current) return;

        if (editor && props.value !== undefined && props.value !== editor.storage.preventSuspiciousUpdate.lastKnownGoodContent) {
            editor.commands.programmaticallySetContent(props.value);
        }
    }, [props.value, editor]);

    const getSelection = () => {
        return editorSelectionRef.current;
    }

    const setCurrentSelection = useCallback(() => {
        if (!editor) return;
        const selection = getSelection();
        selectionRef.current = selection;
        editor.commands.setTextSelection({ from: 1, to: 1 });
    }, [editor]);

    const openCommentsPanel = useCallback(() => {
        if (!editor) return;
        if (!editor.isActive('comment')) {
            props.onCommentOpen?.(null);
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
        editor?.chain().blur().run();
        selectionRef.current = null;
    }, [editor]);

    const closeCommentsPanel = useCallback(() => {
        cleanUpCommentsPanel();
        setIsCommentsPanelOpen(false);
    }, [cleanUpCommentsPanel]);

    const onCommentDelete = useCallback((id) => {
        props.onCommentDelete?.(id);
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

            const handleClick = (event) => {
                const target = event.target;
                if (target.dataset.type === 'mention' && target.closest('.ProseMirror')) {
                    const id = target.dataset.id;
                    const name = target.dataset.label;
                    console.log("Mention Clicked:", id, name);
                }
            };

            editor.view.dom.addEventListener('click', handleClick);

            removeContentEditable();

            return () => {
                cancelAnimationFrame(animationFrame);
                editor.view.dom.removeEventListener('click', handleClick);
            }
        }
    }, [editor]);

    useEffect(() => {
        isMountedRef.current = true;
    }, []);

    if (!editor) {
        return null;
    }

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

export default PreviewEditor;