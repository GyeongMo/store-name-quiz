import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { GameProvider } from './context/GameContext'
import { DialogProvider } from './components/common/DialogProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DialogProvider>
      <GameProvider>
        <App />
      </GameProvider>
    </DialogProvider>
  </StrictMode>,
)
