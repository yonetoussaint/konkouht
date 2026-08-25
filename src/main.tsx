import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'
import { initNativeShell } from './native'
import { initBrowserLogger } from './lib/logger'

initNativeShell()

// Initialize browser-side logging capture
initBrowserLogger()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)