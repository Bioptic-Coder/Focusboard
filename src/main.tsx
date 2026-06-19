import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { FocusCoordinatorProvider } from './context/FocusCoordinatorContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FocusCoordinatorProvider>
      <App />
    </FocusCoordinatorProvider>
  </StrictMode>,
)
