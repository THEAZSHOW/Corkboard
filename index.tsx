
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CorkboardMeta } from './types';

const Main: React.FC = () => {
  const defaultBoard: CorkboardMeta = { id: 'default-board', name: 'My Corkboard' };

  return <App board={defaultBoard} />;
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Main />
  </React.StrictMode>
);
