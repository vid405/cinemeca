import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { profileStore } from './store/profileStore';
import './index.css';

void profileStore.hydrate().then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
