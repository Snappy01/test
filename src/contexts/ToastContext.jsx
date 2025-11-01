// src/contexts/ToastContext.jsx

import { createContext, useContext, useState, useCallback } from 'react'

// Export du Context pour pouvoir l'utiliser avec useContext directement dans WebSocketContext
export const ToastContext = createContext(null)

/**
 * Hook pour utiliser le Toast Context
 * @returns {Object} - { showToast }
 */
export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

/**
 * Provider Toast qui gère l'affichage des notifications
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])

  /**
   * Affiche une notification toast
   * @param {Object} options - Options de la notification
   * @param {string} options.title - Titre de la notification
   * @param {string} options.description - Description (optionnel)
   * @param {string} options.color - Couleur: 'success' (vert) ou 'danger' (rouge)
   */
  const showToast = useCallback(({ title, description, color = 'success' }) => {
    const id = Date.now()
    const newToast = { id, title, description, color }
    
    setToasts(prev => [...prev, newToast])

    // Auto-dismiss après 3 secondes
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id))
    }, 3000)
  }, [])

  /**
   * Ferme une notification
   * @param {number} id - ID de la notification à fermer
   */
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Conteneur des toasts - Position top-right */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto
              min-w-[300px] max-w-[400px] p-4 rounded-lg shadow-lg backdrop-blur-sm
              border-2
              animate-slide-in-right
              ${toast.color === 'success' 
                ? 'bg-green-500/90 dark:bg-green-600/90 border-green-600 dark:border-green-500' 
                : 'bg-red-500/90 dark:bg-red-600/90 border-red-600 dark:border-red-500'
              }
            `}
          >
            <div className="flex items-start gap-3">
              {/* Icône */}
              <div className="flex-shrink-0 mt-0.5">
                {toast.color === 'success' ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              
              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-semibold text-sm">{toast.title}</h4>
                {toast.description && (
                  <p className="text-white/90 text-xs mt-1">{toast.description}</p>
                )}
              </div>
              
              {/* Bouton fermer */}
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
                aria-label="Fermer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

