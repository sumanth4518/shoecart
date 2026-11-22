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

// Ensure all API calls know where the backend is: checks runtime window.__ENV__ first, then Vite build-time env
const resolvedApiUrl = (typeof window !== 'undefined' && window.__ENV__?.VITE_API_URL) 
  || import.meta.env.VITE_API_URL;

if (resolvedApiUrl) {
  axios.defaults.baseURL = resolvedApiUrl.replace(/\/+$/, '');
}

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
