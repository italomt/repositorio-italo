import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ToastProvider } from './contexts/ToastContext'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { initSentry } from './lib/sentry'
import { initPostHog } from './lib/posthog'
import './index.css'

initSentry()
initPostHog()

// Registra o service worker de cache offline em toda visita (independente do
// opt-in de push notification, que registra o mesmo /sw.js separadamente).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>,
)
