import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Document from '@tiptap/extension-document'
import Mention from '@tiptap/extension-mention'
import Placeholder from '@tiptap/extension-placeholder';
import Menu from './components/Menu';
import SuggestionExtension from './extensions/Mention';
import Link from './extensions/Link'
import BubbleMenu from './components/BubbleMenu';
import AiPanel from './components/AiPanel';
import { Color } from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight'
import Fragment from './extensions/Fragment';
import SelectionHighlight from './extensions/SelectionHighlight';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import tippy from 'tippy.js';
import 'tippy.js/themes/light.css';

import './style.css';

const CustomDocument = Document.extend({
  // content: 'heading block*',
});

const DEFAULT_CONTENT = `
  <h1></h1>
  <p></p>
`;

const DocumentEditor = (props) => {
  const mentionItemsRef = useRef(props.mention.items);
  const selectionRef = useRef({ from: 0, to: 0 });
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [content] = useState(props.value || DEFAULT_CONTENT);

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
          if (node.type.name === 'heading') {
            return 'Give this page a title'
          }
    
          return 'Type / for all elements or @ to mention someone'
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
      Fragment,
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
    // Events
    onUpdate({ editor }) {
      if(props.onChange) {
        const html = editor.getHTML();

        props.onChange(html);
      }
    },
  });

  const getSelection = useCallback(() => {
    const { view } = editor;
    const { from, to } = view.state.selection;

    return { from, to };
  }, [editor]);

  // AI panel
  const openAiPanel = useCallback(() => {
    const selection = getSelection();
    
    selectionRef.current = selection;

    editor.chain().focus().blur().run();

    setIsAiPanelOpen(true);
  }, []);

  const closeAiPanel = useCallback(() => {
    editor.chain().blur().run();

    selectionRef.current = null;

    setIsAiPanelOpen(false);
  }, []);

  // Mention
  useEffect(() => {
    mentionItemsRef.current = props.mention.items;
  }, [props.mention.items]);

  useEffect(() => {
    if(editor) {
      editor.chain().focus().run();

      const root = editor.view.dom;

      root.addEventListener('mousemove', (event) => {
        const target = event.target;

        // Link tooltip
        if(target.tagName === 'A' && !target.__tippy__) {
          console.log("Tippy");

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
        if(target.dataset.type === 'mention') {
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
    <>
      <Menu editor={editor} />
      <EditorContent editor={editor} />
      <BubbleMenu editor={editor} openAiPanel={openAiPanel}/>
      <AiPanel editor={editor} selection={selectionRef} open={isAiPanelOpen} onClose={closeAiPanel} />
    </>
  )
}

export default DocumentEditor
