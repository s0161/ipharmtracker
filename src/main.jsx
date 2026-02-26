import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { ToastProvider } from './components/Toast'
import { seedIfNeeded, cleanupOldLocalStorage, cleanupStaleData } from './utils/seed'
import './index.css'

cleanupOldLocalStorage()
cleanupStaleData()
seedIfNeeded()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </HashRouter>
  </React.StrictMode>
)
