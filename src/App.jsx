import './App.css'
import { useState, Suspense, lazy } from 'react';
import Sidebar from './components/Sidebar';

const DocumentEditor = lazy(() => import('./components/Editor'));

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

function App() {
  const [value, setValue] = useState('');

  return (
    <>
      <main>
        <aside className='sidebar'>
          <Sidebar />
        </aside>
        <section className='editor'>
          <Suspense fallback={<div></div>}>
            <DocumentEditor 
              value={value}
              onChange={setValue}
              mention={{
                items: users,
                getLabel: (item) => item.name,
                getId: (item) => item.id,
              }}
            />
          </Suspense>
        </section>
      </main>
    </>
  )
}

export default App
