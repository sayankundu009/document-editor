import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document'
import Mention from '@tiptap/extension-mention'
import Placeholder from '@tiptap/extension-placeholder';
import Menu from './components/Menu';
import SuggestionExtension from './extensions/Mention';
import Link from './extensions/Link'
import ListKeymap from '@tiptap/extension-list-keymap'
import BubbleMenu from './components/BubbleMenu';
import AiPanel from './components/AiPanel';
import { Color } from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight'
import Fragment from './extensions/Fragment';
import SelectionHighlight from './extensions/SelectionHighlight';
import CommentExtension from "@sereneinserenade/tiptap-comment-extension";
import { SlashProvider, SlashElement, SlashExtension } from './extensions/Slash';
import { enableKeyboardNavigation } from '@harshtalks/slash-tiptap';

import Image from '@tiptap/extension-image'

import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from './extensions/Table/TableHeader'
import TableCell from './extensions/Table/TableCell'
import TablePanel from './components/TablePanel'
import UniqueID from '@tiptap/extension-unique-id'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import tippy from 'tippy.js';
import 'tippy.js/themes/light.css';

import './style.css';
import Comments from './components/Comments';

const CustomDocument = Document.extend({
    // content: 'heading block*',
});

const DEFAULT_CONTENT = `
  <h1></h1>
  <p></p>
`;

const generateUniqueId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

function uploadFile(file) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const fileReader = new FileReader();

            fileReader.readAsDataURL(file)
            fileReader.onload = () => {
                resolve({ src: fileReader.result });
            }
        }, 2000);
    });
}

const DocumentEditor = (props) => {
    const selectionRef = useRef({ from: 0, to: 0 });
    const editorSelectionRef = useRef({ from: 0, to: 0 });
    const [content] = useState(props.value || DEFAULT_CONTENT);

    // Mentions
    const mentionItemsRef = useRef(props.mention.items);
    // AI panel
    const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
    // Comments
    const [isCommentsPanelOpen, setIsCommentsPanelOpen] = useState(false);
    const [selectedComment, setSelectedComment] = useState(null);

    const extensions = useMemo(() => {
        return [
            CustomDocument,
            StarterKit.configure({
                document: false,
            }),
            Mention.configure({
                suggestion: SuggestionExtension({
                    getItems: () => mentionItemsRef.current,
                    getItemLabel: props.mention.getLabel,
                    getItemId: props.mention.getId,
                }),
                HTMLAttributes: {
                    class: 'mention',
                },
                deleteTriggerWithBackspace: true,
            }),
            Placeholder.configure({
                placeholder: ({ node }) => {
                    return 'Type / for all commands or @ to mention someone'
                },
                showOnlyCurrent: false
            }),
            Color,
            Link.configure({
                openOnClick: false,
            }),
            Highlight,
            TextStyle,
            SelectionHighlight.configure({
                getSelection: () => {
                    return selectionRef.current;
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
            ListKeymap,
            SlashExtension,
            // Image.configure({
            //     allowBase64: true,
            //     HTMLAttributes: {
            //         class: "editor-image",
            //     }
            // }),
            Image,

            Fragment,

            UniqueID.configure({
                attributeName: 'uid',
                types: ['table', 'tableRow', 'tableHeader', 'tableCell'],
                generateID: () => {
                    return 'table-' + window.crypto.randomUUID();
                }
            }),
            Table.configure({
                resizable: true,
                lastColumnResizable: false,
            }),
            TableRow,
            TableHeader,
            TableCell,

        ]
    }, [])

    const editor = useEditor({
        extensions,
        content,
        editorProps: {
            attributes: {
                class: 'document-editor',
            },
            handleDOMEvents: {
                keydown: (_, v) => enableKeyboardNavigation(v),
            },
            handlePaste: function (view, event, slice) {
                const files = Array.from(event.clipboardData?.files || []);

                const { schema } = view.state

                for (const file of files) {
                    if (file.type.indexOf("image") === 0) {
                        const uploadId = generateUniqueId();

                        const node = schema.nodes.image.create({
                            src: "https://www.tableau.com/sites/default/files/blog/spinning_wheel_2.gif",
                            title: uploadId,
                        });

                        const transaction = view.state.tr.replaceSelectionWith(node);

                        view.dispatch(transaction)

                        uploadFile(file).then((data) => {
                            editor.state.doc.descendants((node, pos) => {
                                if (node.type.name === 'image' && node.attrs && node.attrs['title'] === uploadId) {
                                    const transaction = editor.state.tr.setNodeMarkup(pos, undefined, {
                                        ...node.attrs,
                                        src: data.src,
                                        title: undefined,
                                    }).setMeta("addToHistory", false)

                                    editor.view.dispatch(transaction);

                                    return false;
                                }
                            });
                        });

                        return true;
                    }
                }
                return false;
            },
        },
        // Events
        onUpdate({ editor }) {
            if (props.onChange) {
                const html = editor.getHTML();

                props.onChange(html);
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

    function setCurrentSelection() {
        const selection = getSelection();

        selectionRef.current = selection;

        // Remove bubble menu
        editor.commands.setTextSelection({ from: 1, to: 1 })
    }

    // AI panel
    const openAiPanel = useCallback(() => {
        setCurrentSelection()

        setIsAiPanelOpen(true);
    }, []);

    const closeAiPanel = useCallback(() => {
        editor.chain().blur().run();

        selectionRef.current = null;

        setIsAiPanelOpen(false);
    }, []);

    // Comments
    const openCommentsPanel = useCallback(() => {
        if (!editor.isActive('comment')) {
            props.onCommentOpen(null);
        }

        setCurrentSelection();

        queueMicrotask(() => {
            setIsCommentsPanelOpen(true);
        });
    }, []);

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

    // Comments
    useEffect(() => {
        setSelectedComment(props.selectedComment);
    }, [props.selectedComment]);

    // Mention
    useEffect(() => {
        mentionItemsRef.current = props.mention.items;
    }, [props.mention.items]);

    // Events
    useEffect(() => {
        if (editor) {
            editor.chain().focus().run();

            const root = editor.view.dom;

            root.addEventListener('mousemove', (event) => {
                const target = event.target;

                // Link tooltip
                if (target.tagName === 'A' && !target.__tippy__) {
                    const tooltip = tippy(target, {
                        content: "Open link (Ctrl + Click)",
                        placement: 'top',
                        theme: 'light',
                    });

                    tooltip.show();

                    target.__tippy__ = tooltip;
                }
            });

            root.addEventListener('click', (event) => {
                const target = event.target;

                // Mention
                if (target.dataset.type === 'mention') {
                    const id = target.dataset.id;
                    const name = target.dataset.label;

                    // Handle mention onClick
                    console.log("Mention", id, name);
                }
            });
        }

        return () => {
            editor.destroy();
        }
    }, [editor]);

    return (
        <SlashProvider>
            <section className="editor-container">
                <Menu editor={editor} openAiPanel={openAiPanel} openCommentsPanel={openCommentsPanel} onCommentDelete={onCommentDelete} />
                <EditorContent editor={editor} />
                <BubbleMenu editor={editor} openAiPanel={openAiPanel} openCommentsPanel={openCommentsPanel} onCommentDelete={onCommentDelete} />
                <AiPanel editor={editor} selection={selectionRef} open={isAiPanelOpen} onClose={closeAiPanel} />
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
                <SlashElement editor={editor} />
                <TablePanel editor={editor} />
            </section>
        </SlashProvider>
    )
}

export default DocumentEditor
