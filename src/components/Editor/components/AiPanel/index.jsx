import { ChevronUp, Wand2, FileText, CheckCircle, PenLine, Scissors, XCircle, Loader2 } from 'lucide-react';
import { convertToContentCollection, generateWriting } from './api';
import { useRef, useState } from 'react';
import './style.css';
import { useClickOutside } from '../../hooks';
import { removeClass, setClass } from '../../utils';

function getSuggestionText(suggestion) {
  switch(suggestion) {
    case 'improve':
      return 'Improve the writing of the following text';
    case 'summarize':
      return 'Summarize the following text';
    case 'fix-grammar':
      return 'Fix the grammar of the following text';
    case 'continue':
      return 'Continue writing the following text';
    case 'make-shorter':
      return 'Make the following text shorter';
  }
}

export default function AiPanel({ editor, open, selection, onClose}) {
  const [input, setInput] = useState('');
  const panelRef = useRef(null);
  const [loading, setLoading] = useState(false);
  
  useClickOutside(panelRef, onClose);

  const isEmpty = () => !editor.state.doc.textContent.trim().length;

  const getSelection = () => {
    return selection.current;
  }

  const getSelectedText = () => {
    const { from, to } = getSelection();

    return editor.state.doc.textBetween(from, to, '').trim();
  }

  const handleSuggestion = (suggestion) => {
    const message = getSuggestionText(suggestion);

    generateContent(message);
  }

  async function generateContent(message){
    const selectedText = getSelectedText();

    setLoading(true);
    setClass(editor.view.dom, 'ai-loading');

    try {
      const result = await generateWriting({
          message,
          selection: selectedText,
          isFull: !isEmpty(),
      });

      removeClass(editor.view.dom, 'ai-loading');
  
      const selection = {...getSelection()};
  
      setClass(editor.view.dom, 'animated-blocks');

      if(typeof result === 'string') {
        editor.commands.insertContent(result);
      } else {
        const collection = convertToContentCollection(result);
    
        editor.commands.insertContentAt(selection, collection);
      }

      onClose();
    } catch (error) {
      console.error(error);
      removeClass(editor.view.dom, 'ai-loading');
    } finally {
      setLoading(false);

      setTimeout(() => {
        removeClass(editor.view.dom, 'animated-blocks');
      }, 1200);
    }
  }

  async function handleSubmit(e) {
    if(loading) return;
    e.preventDefault();

    const message = input;
    setInput('');

    generateContent(message);
  }

  if(!open) return null;

  return (
    <div className="ai-panel" ref={panelRef}>
      <form className="ai-input-container" onSubmit={handleSubmit}>
          <input className="ai-input" type="text" placeholder={loading ? 'Generating...' : 'Ask AI anything...'} value={input} onInput={(e) => setInput(e.target.value)} disabled={loading}/>
          <button className="ai-button" type="submit" disabled={loading}>
            {loading ? <div className="loader" /> : <ChevronUp size={15} />}
          </button>
      </form>
      <div className="ai-suggestions-container">
        <button className="ai-suggestion" onClick={() => handleSuggestion('improve')}>
            <Wand2 size={10} />
            <span>Improve writing</span>
        </button>
        <button className="ai-suggestion" onClick={() => handleSuggestion('summarize')}>
            <FileText size={10} />
            <span>Summarize</span>
        </button>
        <button className="ai-suggestion" onClick={() => handleSuggestion('fix-grammar')}>
            <CheckCircle size={10} />
            <span>Fix grammar</span>
        </button>
        <button className="ai-suggestion" onClick={() => handleSuggestion('continue')}>
            <PenLine size={10} />
            <span>Continue writing</span>
        </button>
        <button className="ai-suggestion" onClick={() => handleSuggestion('make-shorter')}>
            <Scissors size={10} />
            <span>Make shorter</span>
        </button>
      </div>
    </div>
  )
}