import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { prefsStore } from './store/prefsStore';
import { profileStore } from './store/profileStore';
import './index.css';

void Promise.all([profileStore.hydrate(), prefsStore.hydrate()]).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
