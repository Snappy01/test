import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HeroUIProvider } from '@heroui/react'
import { WebSocketProvider } from './contexts/WebSocketContext'
import { ToastProvider } from './contexts/ToastContext'
import './index.css'
import App from './App.jsx'

/**
 * POINT D'ENTRÉE DE L'APPLICATION
 * 
 * Structure des providers :
 * - HeroUIProvider : Fournit les composants HeroUI à toute l'app
 * - ToastProvider : Gère l'affichage des notifications toast
 * - WebSocketProvider : Fournit la connexion WebSocket et le système de feedback
 *   → Gère la connexion WebSocket
 *   → Gère la réception des messages (action_onopen, action_feedback)
 *   → Met à jour le FeedbackStore
 *   → Expose sendCommand, connect, disconnect, isConnected via Context
 *   → Affiche les notifications toast pour les changements d'état de connexion
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HeroUIProvider>
      <ToastProvider>
        <WebSocketProvider>
          <App />
        </WebSocketProvider>
      </ToastProvider>
    </HeroUIProvider>
  </StrictMode>,
)
