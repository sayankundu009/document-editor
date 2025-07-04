import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code2,
  Undo2,
  Redo2,
  AtSign,
  Baseline,
  Table
} from 'lucide-react'

import './style.css'
import { useRef, useState, useEffect } from 'react';

const COLORS = [
  '#1e293b', '#1e40af', '#134e4a', '#365314', '#7c2d12', '#581c87',
  '#64748b', '#2563eb', '#0e7490', '#b45309', '#b91c1c', '#a21caf',
  '#cbd5e1', '#7dd3fc', '#5eead4', '#fbbf24', '#fb7185', '#e879f9',
  '#e0e6f7', '#b3d4fc', '#a7f3d0', '#fcd34d', '#fdba74', '#fbcfe8'
];

function Colors({ editor }) {
  const buttonRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(editor.getAttributes('textStyle')?.color || '#1e293b');

  const toggleColorPicker = () => {
    setIsOpen(!isOpen);
  }

  const handleColor = (color) => {
    editor.chain().focus().setColor(color).run();
    setSelected(color);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        ref={buttonRef}
        title="Text color"
        role="button"
        onClick={toggleColorPicker}
        style={{position: 'relative'}}
      >
        <Baseline size={16} />
        <span style={{ position: 'absolute', bottom: 7, left: '50%', transform: 'translateX(-50%)', width: '50%', height: 3, backgroundColor: selected || '#e0e6f7' }}></span>
      </button>
      <div className="color-picker" style={{ display: isOpen ? 'flex' : 'none' }} onBlur={() => setIsOpen(false)}>
        {COLORS.map((color) => (
          <button
            key={color}
            onClick={() => handleColor(color)}
            style={{
              border: selected === color ? '2px solid #fff' : 'none',
              background: color,
              boxShadow: selected === color ? '0 0 0 2px #2563eb' : 'none'
            }}
            aria-label={color}
          />
        ))}
      </div>
    </div>
  );
}

const Menu = ({ editor }) => {
  if (!editor) {
    return null
  }

  return (
    <div className="menu">
      <button 
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo"
      >
        <Undo2 size={16} />
      </button>
      <button 
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo"
      >
        <Redo2 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={editor.isActive('paragraph') ? 'is-active' : ''}
        title="Paragraph"
      >
        <Type size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
        title="Heading 1"
      >
        <Heading1 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        title="Heading 2"
      >
        <Heading2 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
        title="Heading 3"
      >
        <Heading3 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'is-active' : ''}
        title="Bold"
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'is-active' : ''}
        title="Italic"
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'is-active' : ''}
        title="Strike"
      >
        <Strikethrough size={16} />
      </button>
      <Colors editor={editor} />
      <button
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={editor.isActive('code') ? 'is-active' : ''}
        title="Inline Code"
      >
        <Code size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'is-active' : ''}
        title="Bullet List"
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'is-active' : ''}
        title="Ordered List"
      >
        <ListOrdered size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive('codeBlock') ? 'is-active' : ''}
        title="Code Block"
      >
        <Code2 size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="Insert Table"
      >
        <Table size={16} />
      </button>
      <button
        onClick={() => { 
            editor.chain().focus().insertContentAt(editor.state.selection.head, '@').run()
        }}
        title="Mention"
      >
        <AtSign size={16} />
      </button>
    </div>
  )
}

export default Menu
