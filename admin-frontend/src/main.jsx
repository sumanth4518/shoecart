import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import store from './store/store'
import App from './App.jsx'
import './index.css'
import axios from 'axios'

// Checks runtime window.__ENV__ first (from Render container env), then Vite build-time env
const resolvedApiUrl = (typeof window !== 'undefined' && window.__ENV__?.VITE_API_URL) 
  || import.meta.env.VITE_API_URL

if (resolvedApiUrl) {
  axios.defaults.baseURL = resolvedApiUrl.replace(/\/+$/, '')
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
)
