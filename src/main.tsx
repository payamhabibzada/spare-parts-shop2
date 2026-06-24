import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';

import './styles/tailwind.css';
import './styles/fonts.css';
import './styles/theme.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element not found. Make sure index.html has a div with id="root"');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode >
    <App />
  </React.StrictMode>
);
