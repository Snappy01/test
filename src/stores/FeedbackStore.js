// src/stores/FeedbackStore.js

/**
 * Store global pour stocker tous les feedbacks reçus du serveur WebSocket
 * 
 * Structure du store:
 * {
 *   digital: { [id]: { id, type, value, timestamp } },
 *   ushort: { [id]: { id, type, value, timestamp } },
 *   string: { [id]: { id, type, value, timestamp } }
 * }
 * 
 * Exemple:
 * {
 *   digital: {
 *     19: { id: 19, type: "digital", value: true, timestamp: 1704123456789 },
 *     20: { id: 20, type: "digital", value: false, timestamp: 1704123456790 }
 *   },
 *   ushort: {
 *     10: { id: 10, type: "ushort", value: 75, timestamp: 1704123456800 }
 *   },
 *   string: {}
 * }
 */
class FeedbackStore {
  constructor() {
    // Structure: { type: { id: feedback } }
    this.store = {
      digital: {},
      ushort: {},
      string: {}
    }
    
    // Liste des callbacks subscribers (fonctions à appeler quand le store change)
    this.subscribers = new Set()
  }

  /**
   * Mettre à jour un feedback dans le store
   * @param {number} id - ID de la commande
   * @param {string} type - Type: "digital", "ushort", ou "string"
   * @param {*} value - Valeur du feedback
   */
  updateFeedback(id, type, value) {
    if (!this.store[type]) {
      console.warn(`Type inconnu: ${type}`)
      return
    }

    const feedback = {
      id,
      type,
      value,
      timestamp: Date.now()
    }

    // Mise à jour du store
    // Exemple: this.store.ushort[10] = { id: 10, type: "ushort", value: 75, timestamp: ... }
    this.store[type][id] = feedback

    // Notifier tous les subscribers
    this.notifySubscribers()
  }

  /**
   * Mettre à jour plusieurs feedbacks en masse (pour action_onopen)
   * @param {string} type - Type: "digital", "ushort", ou "string"
   * @param {Object} feedbacks - Objet { [id]: value }
   * Exemple: { "1": false, "2": false, "10": 75 }
   */
  updateFeedbacksBatch(type, feedbacks) {
    if (!this.store[type]) {
      console.warn(`Type inconnu: ${type}`)
      return
    }

    const timestamp = Date.now()

    // Parcourir tous les feedbacks reçus
    Object.keys(feedbacks).forEach(idStr => {
      const id = parseInt(idStr, 10)  // Convertir "10" → 10
      const value = feedbacks[idStr]

      // Créer le feedback
      this.store[type][id] = {
        id,
        type,
        value,
        timestamp
      }
    })

    // Notifier tous les subscribers une seule fois à la fin
    this.notifySubscribers()
  }

  /**
   * Récupérer un feedback spécifique
   * @param {number} id - ID de la commande
   * @param {string} type - Type: "digital", "ushort", ou "string"
   * @returns {Object|null} - Le feedback ou null si non trouvé
   */
  getFeedback(id, type) {
    return this.store[type]?.[id] || null
  }

  /**
   * Récupérer plusieurs feedbacks par IDs
   * @param {number[]} ids - Liste des IDs à récupérer
   * @param {string} type - Type: "digital", "ushort", ou "string"
   * @returns {Object} - Objet { [id]: feedback }
   * 
   * Exemple:
   * getFeedbacks([10, 19, 20], 'ushort')
   * → { 10: { id: 10, type: "ushort", value: 75, ... } }
   */
  getFeedbacks(ids, type) {
    const result = {}
    ids.forEach(id => {
      const feedback = this.store[type]?.[id]
      if (feedback) {
        result[id] = feedback
      }
    })
    return result
  }

  /**
   * S'abonner aux changements du store
   * @param {Function} callback - Fonction appelée quand le store change
   * @returns {Function} - Fonction de désabonnement (cleanup)
   * 
   * Exemple d'utilisation:
   * const unsubscribe = feedbackStore.subscribe(() => {
   *   console.log('Store a changé!')
   * })
   * 
   * Plus tard, pour se désabonner:
   * unsubscribe()
   */
  subscribe(callback) {
    // Ajouter le callback à la liste des subscribers
    this.subscribers.add(callback)
    
    // Retourner une fonction de nettoyage
    // Quand cette fonction est appelée, elle retire le callback
    return () => {
      this.subscribers.delete(callback)
    }
  }

  /**
   * Notifier tous les subscribers qu'un changement a eu lieu
   * Appelle toutes les fonctions callback enregistrées
   */
  notifySubscribers() {
    this.subscribers.forEach(callback => {
      try {
        callback()
      } catch (error) {
        console.error('Erreur dans subscriber:', error)
      }
    })
  }

  /**
   * Obtenir tout le store (pour debug)
   * @returns {Object} - Le store complet
   */
  getAll() {
    return this.store
  }

  /**
   * Vider le store (utile pour tests ou reset)
   */
  clear() {
    this.store = {
      digital: {},
      ushort: {},
      string: {}
    }
    this.notifySubscribers()
  }
}

// Instance singleton (une seule instance partagée dans toute l'app)
export const feedbackStore = new FeedbackStore()

