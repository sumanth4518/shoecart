import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from './store/store.js';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

// Ensure all API calls know where the backend is: checks runtime window.__ENV__ first, then Vite build-time env, with production fallback
const resolvedApiUrl = (typeof window !== 'undefined' && window.__ENV__?.VITE_API_URL) 
  || import.meta.env.VITE_API_URL
  || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' 
      ? 'https://aura-kicks-backend.onrender.com' 
      : 'http://localhost:5000');

if (resolvedApiUrl) {
  axios.defaults.baseURL = resolvedApiUrl.replace(/\/+$/, '');
}

// Hidden background warmup ping to wake up sleeping Render backend and keep it warm
const wakeUpBackend = () => {
  const target = axios.defaults.baseURL || 'https://aura-kicks-backend.onrender.com';
  const ping = () => {
    fetch(`${target}/api/health`, { method: 'GET', mode: 'cors', cache: 'no-store' })
      .catch(() => {});
  };
  ping();
  // Ping every 8 minutes while tab is open to prevent Render free-tier sleep (sleep timeout is 15 min)
  setInterval(ping, 8 * 60 * 1000);
};

wakeUpBackend();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
        <ToastContainer position="top-right" autoClose={3000} />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
