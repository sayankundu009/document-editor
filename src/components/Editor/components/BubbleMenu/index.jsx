import { BubbleMenu } from '@tiptap/react'
import {
    Bold,
    Italic,
    Strikethrough,
    Sparkles,
    MessageCircle,
    AlignLeft,
    AlignRight,
    AlignCenter,
    Trash2,
} from 'lucide-react'

import './style.css'

const AI_ENABLED = false;

export default function ({ editor, openAiPanel, openCommentsPanel, preview = false }) {
    return (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="bubble-menu">
                {!preview && AI_ENABLED && (
                    <button
                        onClick={() => { editor.chain().blur().run(); openAiPanel() }}
                    >
                        <Sparkles size={10} />
                        <span>Ask AI</span>
                    </button>
                )}

                {!editor.isActive('comment') && !editor.isActive('table') && !editor.isActive('image') && (
                    <button
                        onClick={() => openCommentsPanel()}
                    >
                        <MessageCircle size={10} />
                    </button>
                )}

                {!preview && !editor.isActive('image') && <>
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={editor.isActive('bold') ? 'is-active' : ''}
                    >
                        <Bold size={10} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={editor.isActive('italic') ? 'is-active' : ''}
                    >
                        <Italic size={10} />
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleStrike().run()}
                        className={editor.isActive('strike') ? 'is-active' : ''}
                    >
                        <Strikethrough size={10} />
                    </button>
                </>}

                {!preview && editor.isActive('image') && (<>
                    <button
                        onClick={() => !editor.isActive('image', { align: 'left' }) ? editor.chain().focus().setAlign('left').run() : editor.chain().focus().setAlign('').run()}
                        className={editor.isActive('image', { align: 'left' }) ? 'is-active' : ''}
                    >
                        <AlignLeft size={10} />
                    </button>
                    <button
                        onClick={() => !editor.isActive('image', { align: 'center' }) ? editor.chain().focus().setAlign('center').run() : editor.chain().focus().setAlign('').run()}
                        className={editor.isActive('image', { align: 'center' }) ? 'is-active' : ''}
                    >
                        <AlignCenter size={10} />
                    </button>
                    <button
                        onClick={() => !editor.isActive('image', { align: 'right' }) ? editor.chain().focus().setAlign('right').run() : editor.chain().focus().setAlign('').run()}
                        className={editor.isActive('image', { align: 'right' }) ? 'is-active' : ''}
                    >
                        <AlignRight size={10} />
                    </button>
                    <button
                        className="is-danger"
                        onClick={() => editor.chain().focus().deleteImage().focus('start').blur().run()}
                    >
                        <Trash2 size={10} />
                    </button>
                </>)}
            </div>
        </BubbleMenu>
    )
}