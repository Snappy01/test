# 🔔 Explication détaillée : Comment le composant est notifié

## ❓ Question : Où et comment le composant est-il notifié quand le callback est appelé ?

### 📍 Réponse : Le flux complet de notification

```
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 1 : Le composant s'abonne                                │
└─────────────────────────────────────────────────────────────────┘

// Dans useDeviceFeedback.js (ligne 133-149)

useEffect(() => {
  // 1. Créer la fonction callback
  const callback = () => {
    const updatedFeedbacks = readFeedbacks()
    setFeedbacks(updatedFeedbacks)  // ← Cette ligne met à jour l'état React
  }
  
  // 2. S'abonner au store
  const unsubscribe = feedbackStore.subscribe(callback)
  // → feedbackStore.subscribers.add(callback)
  // → callback est maintenant dans la liste : Set([callback])
  
  return unsubscribe
}, [readFeedbacks])

┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 2 : Un feedback arrive du serveur                        │
└─────────────────────────────────────────────────────────────────┘

// Dans WebSocketContext.jsx (ligne 118-158)

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  // message = { action: "action_feedback", id: 10, type: "ushort", value: 80 }
  
  if (message.action === 'action_feedback') {
    // 1. Mettre à jour le store
    feedbackStore.updateFeedback(10, 'ushort', 80)
    //   ↓
    //   Voir étape 3
  }
}

┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 3 : Le store met à jour ET notifie                       │
└─────────────────────────────────────────────────────────────────┘

// Dans FeedbackStore.js (ligne 33-55)

updateFeedback(id, type, value) {
  // 1. Créer le feedback
  const feedback = {
    id: 10,
    type: "ushort",
    value: 80,
    timestamp: Date.now()
  }
  
  // 2. Mettre à jour le store
  this.store.ushort[10] = feedback
  
  // 3. ⭐ ICI : Notifier TOUS les subscribers
  this.notifySubscribers()
  //   ↓
  //   Voir étape 4
}

┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 4 : Tous les callbacks sont appelés                      │
└─────────────────────────────────────────────────────────────────┘

// Dans FeedbackStore.js (ligne 165-174)

notifySubscribers() {
  // this.subscribers = Set([callback1, callback2, callback3, ...])
  
  // ⭐ BOUCLE : Appelle chaque callback un par un
  this.subscribers.forEach(callback => {
    callback()  // ← ⭐ LE CALLBACK EST APPELÉ ICI !
  })
}

┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 5 : Le callback du composant s'exécute                   │
└─────────────────────────────────────────────────────────────────┘

// Dans useDeviceFeedback.js - la fonction callback créée à l'étape 1

callback() {
  // ⭐ CETTE FONCTION EST APPELÉE PAR notifySubscribers()
  
  // 1. Relire les feedbacks depuis le store
  const updatedFeedbacks = readFeedbacks()
  // updatedFeedbacks = { 10: { id: 10, value: 80, ... }, ... }
  
  // 2. ⭐ METTRE À JOUR L'ÉTAT REACT
  setFeedbacks(updatedFeedbacks)
  // → Cela déclenche un re-render du composant React
  // → Le composant se met à jour automatiquement !
}

┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 6 : React re-rend le composant                           │
└─────────────────────────────────────────────────────────────────┘

// React détecte que l'état feedbacks a changé
// → Le composant LightsCard est re-rendu
// → Le useEffect([feedbacks]) se déclenche
// → L'UI se met à jour avec les nouvelles valeurs
```

---

## 🎯 Points clés à retenir

### 1. Où le callback est appelé ?

Le callback est appelé dans `FeedbackStore.notifySubscribers()` :

```javascript
// FeedbackStore.js - ligne 165
notifySubscribers() {
  this.subscribers.forEach(callback => {
    callback()  // ⭐ C'EST ICI QUE LE CALLBACK EST APPELÉ
  })
}
```

### 2. Quand `notifySubscribers()` est appelé ?

`notifySubscribers()` est appelé **automatiquement** quand le store change :

```javascript
// FeedbackStore.js - ligne 55
updateFeedback(id, type, value) {
  // ... mise à jour du store ...
  
  this.notifySubscribers()  // ⭐ APPELÉ AUTOMATIQUEMENT APRÈS CHAQUE MISE À JOUR
}
```

Et aussi dans `updateFeedbacksBatch()` (pour `action_onopen`).

### 3. Comment le composant est notifié ?

Le callback appelle `setFeedbacks()`, qui met à jour l'état React :

```javascript
const callback = () => {
  const updatedFeedbacks = readFeedbacks()
  setFeedbacks(updatedFeedbacks)  // ⭐ MET À JOUR L'ÉTAT REACT
}
```

Quand l'état React change, React **re-rend automatiquement** le composant !

---

## 📊 Exemple concret avec valeurs

### Scénario : Feedback reçu pour l'intensité

```javascript
// ============================================================
// 1. Le composant s'abonne (au montage)
// ============================================================

// LightsCard monte
// useDeviceFeedback() s'exécute

useEffect(() => {
  const callback = () => {
    const updatedFeedbacks = readFeedbacks()
    setFeedbacks(updatedFeedbacks)
  }
  
  const unsubscribe = feedbackStore.subscribe(callback)
  // → callback est ajouté à feedbackStore.subscribers
  // → feedbackStore.subscribers = Set([callback])
  
  return unsubscribe
}, [readFeedbacks])

// ============================================================
// 2. Un feedback arrive du serveur
// ============================================================

// Serveur envoie : { action: "action_feedback", id: 10, type: "ushort", value: 80 }
// WebSocketContext reçoit dans ws.onmessage

ws.onmessage = (event) => {
  const message = { action: "action_feedback", id: 10, type: "ushort", value: 80 }
  
  // Appeler updateFeedback
  feedbackStore.updateFeedback(10, 'ushort', 80)
}

// ============================================================
// 3. Le store met à jour ET appelle notifySubscribers()
// ============================================================

// Dans FeedbackStore.updateFeedback()
updateFeedback(10, 'ushort', 80) {
  // Mettre à jour le store
  this.store.ushort[10] = { id: 10, type: "ushort", value: 80, timestamp: ... }
  
  // ⭐ APPELER notifySubscribers()
  this.notifySubscribers()
}

// ============================================================
// 4. notifySubscribers() appelle TOUS les callbacks
// ============================================================

notifySubscribers() {
  // this.subscribers = Set([callback])
  
  // ⭐ BOUCLE : Pour chaque callback dans la liste
  this.subscribers.forEach(callback => {
    callback()  // ⭐ APPEL DU CALLBACK ICI !
    // → callback() s'exécute maintenant
  })
}

// ============================================================
// 5. Le callback s'exécute et met à jour React
// ============================================================

// callback() s'exécute (créé dans useDeviceFeedback)
callback() {
  // Lire les feedbacks depuis le store
  const updatedFeedbacks = readFeedbacks()
  // updatedFeedbacks = { 10: { id: 10, value: 80, ... }, ... }
  
  // ⭐ METTRE À JOUR L'ÉTAT REACT
  setFeedbacks(updatedFeedbacks)
  // → React détecte que feedbacks a changé
  // → React déclenche un re-render
}

// ============================================================
// 6. React re-rend le composant
// ============================================================

// React re-rend LightsCard
// → const feedbacks = useDeviceFeedback(device) retourne { 10: { value: 80, ... } }
// → useEffect([feedbacks]) se déclenche
// → setIntensity(80)
// → L'UI se met à jour : slider affiche 80%
```

---

## 🔍 Visualisation : Où exactement ?

```
FeedbackStore.js (ligne 165-174)
────────────────────────────────
notifySubscribers() {
  this.subscribers.forEach(callback => {
    callback()  ← ⭐ LE CALLBACK EST APPELÉ ICI
  })
}
```

Cette fonction est appelée depuis :

```
1. FeedbackStore.updateFeedback() (ligne 55)
   └─> notifySubscribers()

2. FeedbackStore.updateFeedbacksBatch() (ligne 94)
   └─> notifySubscribers()
```

Qui sont eux-mêmes appelés depuis :

```
WebSocketContext.jsx (ligne 135 et 152)
────────────────────────────────────────
feedbackStore.updateFeedbacksBatch(...)  ← action_onopen
feedbackStore.updateFeedback(...)        ← action_feedback
```

---

## ✅ Résumé

**Le callback est appelé dans `FeedbackStore.notifySubscribers()`**

1. Le composant enregistre son callback via `subscribe()`
2. Quand le store change, `notifySubscribers()` est appelé automatiquement
3. `notifySubscribers()` appelle tous les callbacks enregistrés
4. Le callback met à jour l'état React avec `setFeedbacks()`
5. React re-rend automatiquement le composant

**Tout est automatique !** Le composant n'a rien à faire, il reçoit les notifications automatiquement. 🎉

