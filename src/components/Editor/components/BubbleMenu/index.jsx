import { BubbleMenu } from '@tiptap/react'
import {
    Bold,
    Italic,
    Strikethrough,
    Sparkles,
    MessageCircle
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

                {!editor.isActive('comment') && !editor.isActive('table') && (
                    <button
                        onClick={() => openCommentsPanel()}
                    >
                        <MessageCircle size={10} />
                    </button>
                )}
                
                {!preview && <>
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
            </div>
        </BubbleMenu>
    )
}