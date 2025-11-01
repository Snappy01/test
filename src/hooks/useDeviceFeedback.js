// src/hooks/useDeviceFeedback.js

import { useState, useEffect, useCallback } from 'react'
import { feedbackStore } from '../stores/FeedbackStore'

/**
 * Hook personnalisé pour gérer les feedbacks d'un device
 * 
 * @param {Object} device - Device depuis roomConfig.json
 * @returns {Object} - Objet avec les feedbacks organisés par ID
 * 
 * Exemple de retour:
 * {
 *   10: { id: 10, type: "ushort", value: 75, timestamp: 1234567890 },
 *   19: { id: 19, type: "digital", value: true, timestamp: 1234567890 },
 *   20: { id: 20, type: "digital", value: false, timestamp: 1234567890 }
 * }
 * 
 * EXPLICATION DÉTAILLÉE:
 * 
 * 1. Ce hook extrait tous les IDs des commandes du device
 * 2. Il lit les feedbacks correspondants depuis le store
 * 3. Il s'abonne aux changements du store
 * 4. Quand le store change, il relit les feedbacks et met à jour l'état
 * 5. Il retourne un objet où les clés sont les IDs (et non les noms de commandes)
 */
export const useDeviceFeedback = (device) => {
  // État local qui stocke les feedbacks pour ce device
  const [feedbacks, setFeedbacks] = useState({})
  // feedbacks = {}  (vide au début)

  /**
   * Fonction pour lire les feedbacks depuis le store
   * 
   * Cette fonction:
   * 1. Extrait tous les IDs du device (digital, ushort, string)
   * 2. Lit les feedbacks correspondants depuis le store
   * 3. Retourne un objet { [id]: feedback }
   * 
   * EXEMPLE CONCRET:
   * 
   * device = {
   *   Name: "Cabin",
   *   commands: {
   *     digital: { power_on: 19, power_off: 20 },
   *     ushort: { intensity: 10 }
   *   }
   * }
   * 
   * Résultat:
   * {
   *   10: { id: 10, type: "ushort", value: 75, timestamp: ... },
   *   19: { id: 19, type: "digital", value: true, timestamp: ... },
   *   20: { id: 20, type: "digital", value: false, timestamp: ... }
   * }
   */
  const readFeedbacks = useCallback(() => {
    // Si pas de device ou pas de commands, retourner objet vide
    if (!device || !device.commands) {
      return {}
    }

    // result est un accumulateur qui va stocker tous les feedbacks trouvés
    const result = {}
    // result = {}  (vide au début)

    // ============================================================
    // ÉTAPE 1 : Extraire et lire les feedbacks DIGITAL
    // ============================================================
    if (device.commands.digital) {
      // Parcourir toutes les commandes digital
      Object.values(device.commands.digital).forEach(id => {
        // id = 19 (pour power_on)
        // id = 20 (pour power_off)
        
        // Chercher le feedback dans le store
        const feedback = feedbackStore.getFeedback(id, 'digital')
        // feedback = this.store.digital[19]
        // = { id: 19, type: "digital", value: true, timestamp: ... }
        // OU null si pas encore de feedback
        
        if (feedback) {
          // Si feedback trouvé, l'ajouter au result avec l'ID comme clé
          result[id] = feedback
          // result[19] = { id: 19, type: "digital", value: true, ... }
        }
      })
    }

    // ============================================================
    // ÉTAPE 2 : Extraire et lire les feedbacks USHORT
    // ============================================================
    if (device.commands.ushort) {
      // Parcourir toutes les commandes ushort
      Object.values(device.commands.ushort).forEach(id => {
        // id = 10 (pour intensity)
        
        const feedback = feedbackStore.getFeedback(id, 'ushort')
        // feedback = this.store.ushort[10]
        // = { id: 10, type: "ushort", value: 75, timestamp: ... }
        
        if (feedback) {
          result[id] = feedback
          // result[10] = { id: 10, type: "ushort", value: 75, ... }
        }
      })
    }

    // ============================================================
    // ÉTAPE 3 : Extraire et lire les feedbacks STRING (si présent)
    // ============================================================
    if (device.commands.string) {
      Object.values(device.commands.string).forEach(id => {
        const feedback = feedbackStore.getFeedback(id, 'string')
        if (feedback) {
          result[id] = feedback
        }
      })
    }

    // Retourner l'objet accumulé
    // result = {
    //   10: { id: 10, type: "ushort", value: 75, timestamp: ... },
    //   19: { id: 19, type: "digital", value: true, timestamp: ... },
    //   20: { id: 20, type: "digital", value: false, timestamp: ... }
    // }
    return result
  }, [device])

  // ============================================================
  // ÉTAPE 4 : Initialisation et abonnement
  // ============================================================
  useEffect(() => {
    // Cette fonction callback sera appelée chaque fois que le store change
    const callback = () => {
      // Quand le store change, relire les feedbacks pour ce device
      const updatedFeedbacks = readFeedbacks()
      // updatedFeedbacks = { 10: {...}, 19: {...}, 20: {...} }
      
      // Mettre à jour l'état local
      setFeedbacks(updatedFeedbacks)
      // feedbacks = { 10: {...}, 19: {...}, 20: {...} }
    }

    // S'abonner aux changements du store
    // feedbackStore.subscribe(callback) fait deux choses:
    // 1. Ajoute callback à la liste des subscribers
    // 2. Retourne une fonction de nettoyage (unsubscribe)
    const unsubscribe = feedbackStore.subscribe(callback)
    // unsubscribe = () => { feedbackStore.subscribers.delete(callback) }

    // Initialiser les feedbacks au montage du composant
    // Lit les feedbacks existants depuis le store
    const initialFeedbacks = readFeedbacks()
    // initialFeedbacks = { 10: {...}, 19: {...} } (si déjà dans le store)
    setFeedbacks(initialFeedbacks)
    // feedbacks = { 10: {...}, 19: {...} }

    // Fonction de nettoyage appelée par React quand le composant se démonte
    // Cela retire le callback de la liste des subscribers
    // IMPORTANT: Sans ça, les callbacks s'accumuleraient (memory leak)
    return unsubscribe
    // Équivalent à:
    // return () => { feedbackStore.subscribers.delete(callback) }
  }, [readFeedbacks])

  // Retourner les feedbacks
  // feedbacks = {
  //   10: { id: 10, type: "ushort", value: 75, timestamp: ... },
  //   19: { id: 19, type: "digital", value: true, timestamp: ... },
  //   20: { id: 20, type: "digital", value: false, timestamp: ... }
  // }
  return feedbacks
}

