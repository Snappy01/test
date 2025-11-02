// src/contexts/WebSocketContext.jsx

import { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react'
import { feedbackStore } from '../stores/FeedbackStore'
import { ToastContext } from './ToastContext'

const WebSocketContext = createContext(null)

/**
 * Hook pour utiliser le WebSocket Context
 * @returns {Object} - { isConnected, sendCommand, connect, disconnect }
 */
export const useWebSocket = () => {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within WebSocketProvider')
  }
  return context
}

/**
 * Provider WebSocket qui gère:
 * - La connexion WebSocket
 * - La réception des messages (feedback et action_onopen)
 * - La mise à jour du FeedbackStore
 */
export const WebSocketProvider = ({ children, wsUrl = null }) => {
  const wsRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef(null)
  const reconnectAttemptsRef = useRef(0)
  // Ref pour savoir si on était connecté avant la déconnexion (pour les notifications)
  const wasConnectedRef = useRef(false)
  
  // Récupérer le contexte Toast (optionnel)
  // ToastProvider doit être parent de WebSocketProvider dans main.jsx
  const toastContext = useContext(ToastContext)
  const showToast = toastContext?.showToast || null

  /**
   * Fonction pour envoyer une commande au serveur
   * 
   * Format du message selon la doc :
   * {
   *   "action": "action_command",
   *   "id": 202,
   *   "type": "boolean" | "ushort" | "string",
   *   "value": true | number | string
   * }
   * 
   * @param {string} type - "digital", "ushort", ou "string"
   * @param {number} commandId - ID de la commande
   * @param {*} value - Valeur (ignorée pour digital, toujours true)
   * @returns {boolean} - true si envoyé, false sinon
   */
  const sendCommand = useCallback((type, commandId, value = null) => {
    if (!isConnected || !wsRef.current) {
      console.warn('WebSocket non connecté - commande simulée:', { type, commandId, value })
      return false
    }

    // Mapper le type : "digital" devient "boolean" dans le message
    let messageType = type
    if (type === 'digital') {
      messageType = 'boolean'
    }

    // Déterminer la valeur à envoyer
    let messageValue
    if (type === 'digital') {
      // Les commandes digital envoient TOUJOURS true (simule un appui de bouton)
      // Un appui = un message avec value: true
      messageValue = true
    } else {
      // Pour ushort et string, utiliser la valeur fournie
      messageValue = value
    }

    // Construire le message selon le format attendu par le serveur
    const message = {
      action: 'action_command',  // ✅ OBLIGATOIRE selon la doc
      id: commandId,              // ✅ "id" au lieu de "command"
      type: messageType,          // ✅ "boolean", "ushort", ou "string"
      value: messageValue         // ✅ Toujours présent (true pour digital, valeur pour ushort/string)
    }

    try {
      wsRef.current.send(JSON.stringify(message))
      console.log('Commande envoyée:', message)
      return true
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la commande:', error)
      return false
    }
  }, [isConnected])

  /**
   * Fonction pour se connecter au serveur WebSocket
   * @param {string} url - URL WebSocket
   */
  const connect = useCallback((url) => {
    if (!url) {
      console.error('URL WebSocket manquante')
      return
    }

    // Fermer connexion existante
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    try {
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        console.log('WebSocket connecté')
        setIsConnected(true)
        wasConnectedRef.current = true
        reconnectAttemptsRef.current = 0
        
        // Afficher une notification de succès (vert)
        if (showToast) {
          showToast({
            title: '✅ Connecté',
            description: 'Connexion au serveur établie avec succès',
            color: 'success'
          })
        }
      }

      ws.onerror = (error) => {
        console.error('Erreur WebSocket:', error)
        setIsConnected(false)
        wasConnectedRef.current = false
        
        // Afficher une notification d'erreur (rouge)
        if (showToast) {
          showToast({
            title: '❌ Erreur de connexion',
            description: 'Impossible de se connecter au serveur',
            color: 'danger'
          })
        }
      }

      ws.onclose = () => {
        console.log('WebSocket déconnecté')
        const wasConnected = wasConnectedRef.current
        setIsConnected(false)
        wasConnectedRef.current = false
        wsRef.current = null
        
        // Afficher une notification de déconnexion (rouge) seulement si on était connecté avant
        if (wasConnected && showToast) {
          showToast({
            title: '🔌 Déconnecté',
            description: 'Connexion au serveur perdue',
            color: 'danger'
          })
        }
      }

      /**
       * GESTION DES MESSAGES REÇUS
       * 
       * Le serveur envoie deux types de messages:
       * 
       * 1. action_onopen (à la connexion):
       *    {
       *      "action": "action_onopen",
       *      "type": "boolean" | "ushort" | "string",
       *      "feedback": { "1": false, "2": false, "10": 75, ... }
       *    }
       * 
       * 2. action_feedback (quand un état change):
       *    {
       *      "action": "action_feedback",
       *      "id": 10,
       *      "type": "ushort",
       *      "value": 75
       *    }
       */
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('Message reçu:', message)

          // ============================================================
          // CAS 1 : action_onopen - Initialisation des états
          // ============================================================
          if (message.action === 'action_onopen') {
            const { type, feedback } = message
            
            // Le type dans action_onopen peut être "boolean" mais on stocke dans "digital"
            const storeType = type === 'boolean' ? 'digital' : type
            
            // Vérifier que le type est valide
            if (['digital', 'ushort', 'string'].includes(storeType)) {
              // Mettre à jour le store en masse avec tous les feedbacks
              feedbackStore.updateFeedbacksBatch(storeType, feedback)
              console.log(`Feedbacks initiaux chargés: ${storeType}`, Object.keys(feedback).length, 'IDs')
            } else {
              console.warn(`Type inconnu dans action_onopen: ${type}`)
            }
          }
          
          // ============================================================
          // CAS 2 : action_feedback - Mise à jour d'un seul feedback
          // ============================================================
          else if (message.action === 'action_feedback') {
            const { id, type, value } = message

            // Le type peut être "boolean" mais on stocke dans "digital"
            const storeType = type === 'boolean' ? 'digital' : type

            // Vérifier que le type est valide
            if (['digital', 'ushort', 'string'].includes(storeType)) {
              // Mettre à jour le store avec ce feedback
              feedbackStore.updateFeedback(id, storeType, value)
              console.log(`Feedback stocké: ${storeType}[${id}] = ${value}`)
            } else {
              console.warn(`Type de feedback inconnu: ${type}`)
            }
          }
        } catch (error) {
          console.error('Erreur lors du parsing du message:', error)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      setIsConnected(false)
    }
  }, [])

  /**
   * Fonction pour se déconnecter du serveur
   * @param {boolean} silent - Si true, n'affiche pas de notification de déconnexion
   */
  const disconnect = useCallback((silent = false) => {
    // Si silent, marquer comme non connecté pour éviter la notification
    if (silent) {
      wasConnectedRef.current = false
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }, [])

  // Connexion automatique si wsUrl fourni
  useEffect(() => {
    if (wsUrl) {
      connect(wsUrl)
    }

    // Nettoyage au démontage
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [wsUrl, connect])

  const value = {
    isConnected,
    sendCommand,
    connect,
    disconnect
  }

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  )
}

