import { BubbleMenu } from '@tiptap/react'
import {
    Bold,
    Italic,
    Strikethrough,
    Sparkles
} from 'lucide-react'

import './style.css'

export default function ({ editor, openAiPanel}) {
    return (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
            <div className="bubble-menu">
                <button
                    onClick={() =>{ editor.chain().blur().run(); openAiPanel()}}
                >
                    <Sparkles size={10} />
                    <span>Ask AI</span>
                </button>
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
            </div>
        </BubbleMenu>
    )
}