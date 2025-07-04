import './App.css'
import { useState } from 'react';
import Sidebar from './components/Sidebar';
import DocumentEditor from './components/Editor';
import PreviewEditor from './components/Editor/preview';
import { Eye, Pencil } from 'lucide-react';

const users = [
  {
    id: 1,
    name: "Sayan Kundu",
    email: "john.doe@example.com",
  },
  {
    id: 2,
    name: "Jane Doe",
    email: "jane.doe@example.com",
  },
];

const commentCollection = [
  {
    id: 123,
    comments: [
      {
        id: Date.now(),
        text: "New comment",
      },
    ],
  },
];

function App() {
  const [value, setValue] = useState(`
    <p>Welcome to our collaborative document editor! Here's a <span class="comment" data-comment-id="123">sample comment</span> to show how comments work. Try clicking on the highlighted text to view the comment thread.</p>
    <p>You can also try mentioning users like <span class="mention" data-type="mention" data-id="1" data-label="Sayan Kundu">@Sayan Kundu</span> or <span class="mention" data-type="mention" data-id="2" data-label="Jane Doe">@Jane Doe</span> </p>
    <p>This is a preview mode where you can view and interact with comments, but cannot edit the content directly.</p>

    <table>
      <tbody>
        <tr>
          <th>Name</th>
          <th>Description</th>
          <th>Actions</th>
        </tr>
        <tr>
          <td>Cyndi Lauper</td>
          <td>Singer</td>
          <td>
            <button>Edit</button>
            <button>Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  `);

  const [comments, setComments] = useState(commentCollection);
  const [currentComment, setCurrentComment] = useState(null);

  const [isPreview, setIsPreview] = useState(true);

  const onCommentOpen = (id) => {
    if (id == null) {
      setCurrentComment(null);
      return;
    }

    setComments((comments) => {
      const comment = comments.find(item => {
        if (item.id === id) {
          return item;
        }
      });

      setCurrentComment(comment);

      return comments;
    });
  }

  const handleCommentCreate = (comment) => {
    setComments([...comments, comment]);

    setCurrentComment(comment);
  }

  const handleCommentReply = (comment, id) => {
    const updatedComments = comments.map(item => {
      if (item.id === id) {
        item.comments.push(comment);
      }

      return item;
    });

    setComments(updatedComments);
    setCurrentComment(updatedComments.find(item => item.id === id));
  }

  const handleCommentDelete = (id) => {
    setComments(comments.filter(item => item.id != id));
  }

  return (
    <>
      <main>
        <aside className='sidebar'>
          <Sidebar />
        </aside>
        <section className='editor'>
          <div className='editor-header'>
            <h4>Project roadmap</h4>
            <div className='editor-header-actions'>
              <button onClick={() => setIsPreview(!isPreview)}>
                {!isPreview ? (
                  <Eye size={10} />
                ) : (
                  <Pencil size={10} />
                )}
                {!isPreview ? "Preview" : "Edit"}
              </button>
            </div>
          </div>
          {!isPreview ? (
            <DocumentEditor
              value={value}
              onChange={(content) => {
                setValue(content);
              }}
              mention={{
                items: users,
                getLabel: (item) => item.name,
                getId: (item) => item.id,
              }}
              selectedComment={currentComment}
              onCommentOpen={onCommentOpen}
              onCommentCreate={handleCommentCreate}
              onCommentReply={handleCommentReply}
              onCommentDelete={handleCommentDelete}
            />
          ) : (
            <PreviewEditor
              value={value}
              onChange={(content) => {
                setValue(content);
              }}
              selectedComment={currentComment}
              onCommentOpen={onCommentOpen}
              onCommentCreate={handleCommentCreate}
              onCommentReply={handleCommentReply}
              onCommentDelete={handleCommentDelete}
            />
          )}
        </section>
      </main>
    </>
  )
}

export default App
