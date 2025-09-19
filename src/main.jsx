import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './mobile.css'
import './glass-fix.css'
import './fun-kids-game.css'
import './advanced-layout.css'
import App from './App.jsx'
import { DialogProvider } from './ui/DialogContext'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DialogProvider>
      <App />
    </DialogProvider>
  </StrictMode>,
)
