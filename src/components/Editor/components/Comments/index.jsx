import { useEffect, useRef, useState } from 'react';
import './style.css';

export default function Comments(props) {
    const { open, onClose, onCleanup, selection, editor, selectedComment, onCommentCreate, onCommentReply, onCommentDelete } = props;
    const [text, setText] = useState('');
    const [currentComment, setCurrentComment] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const getSelection = () => {
        return selection.current;
    }

    function handleCommentCreate() {
        const message = text.trim();

        if (!message.length) return;

        if (selectedComment && selectedComment.id) {
            onCommentReply({
                id: Date.now(),
                text: message,
            }, selectedComment.id);
        } else {
            const data = {
                id: Date.now(),
                comments: [
                    {
                        id: Date.now(),
                        text: message,
                    }
                ],
            };

            onCommentCreate(data);

            editor.commands.setTextSelection(getSelection());
            editor.chain().focus().setComment(String(data.id)).run();
            editor.chain().blur().run();

            onCleanup();
        }

        setText('');
    }

    function handleCommentDelete(id) {
        onCommentDelete(id);
        editor.commands.unsetComment(String(id));
        closeCommentPanel();
    }

    function closeCommentPanel() {
        onClose();
        onCleanup();
        setText('');
    }

    useEffect(() => {
        setCurrentComment(selectedComment);
        setText('');
    }, [selectedComment]);

    if (!open) return null;

    return (
        <section className="comments-container">
            <div className="comment-header">
                <div className="comment-header-title">
                    {/* <div className="avatar">SK</div> */}

                    <div className="user-info">
                        <span className="user-name">Comments</span>
                    </div>
                </div>

                <div className="comment-actions">
                    <button className="comment-action-btn" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="#000000" d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12z"></path></svg>
                    </button>
                </div>
            </div>

            {currentComment && (
                <div className="comment-thread">
                    {currentComment.comments.map(item => (
                        <div key={item.id} className="comment-item">
                            {item.text}
                        </div>
                    ))}
                </div>
            )}

            <textarea
                className="comment-box"
                placeholder="Type @ to mention someone. We'll let them know."
                value={text}
                onChange={e => setText(e.target.value)}
            />
            <div className="comment-footer">
                {currentComment && (
                    <button className="btn btn-danger" onClick={() => handleCommentDelete(currentComment.id)}>Resolve</button>
                )}
                <button className="btn btn-primary" onClick={handleCommentCreate}>Add</button>
            </div>
        </section>
    );
}