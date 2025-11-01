# 📚 Exemple d'utilisation du nouveau système de feedback

## Explication détaillée : Comment utiliser `useDeviceFeedback` dans un composant

### Exemple avec LightsCard (modifié)

```javascript
// src/components/LightsCard.jsx

import { useState, useEffect } from 'react'
import { Card, CardBody, Switch, Slider } from '@heroui/react'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useDeviceFeedback } from '../hooks/useDeviceFeedback'

const LightsCard = ({ device, presetValue, presetTrigger }) => {
  const { sendCommand, isConnected } = useWebSocket()
  
  // ✅ UTILISATION DU HOOK : Récupère les feedbacks organisés par ID
  const feedbacks = useDeviceFeedback(device)
  
  // feedbacks = {
  //   10: { id: 10, type: "ushort", value: 75, timestamp: 1704123456789 },
  //   19: { id: 19, type: "digital", value: true, timestamp: 1704123456790 },
  //   20: { id: 20, type: "digital", value: false, timestamp: 1704123456791 }
  // }
  
  // État local pour l'UI
  const [isOn, setIsOn] = useState(false)
  const [intensity, setIntensity] = useState(50)

  // ============================================================
  // SYNCHRONISATION AVEC LES FEEDBACKS DU SERVEUR
  // ============================================================
  
  // Extraire les IDs du device (pour savoir quels feedbacks nous intéressent)
  const intensityId = device.commands?.ushort?.intensity    // 10
  const powerOnId = device.commands?.digital?.power_on      // 19
  const powerOffId = device.commands?.digital?.power_off    // 20

  useEffect(() => {
    // ✅ ACCÈS PAR ID (pas par nom de commande)
    
    // Vérifier le feedback d'intensité (ID 10)
    if (feedbacks[intensityId]) {
      // feedbacks[10] = { id: 10, type: "ushort", value: 75, ... }
      const feedbackValue = feedbacks[intensityId].value
      setIntensity(feedbackValue)  // setIntensity(75)
      setIsOn(feedbackValue > 0)   // setIsOn(true)
    }

    // Vérifier le feedback power_on (ID 19)
    if (feedbacks[powerOnId]?.value === true) {
      setIsOn(true)
    }

    // Vérifier le feedback power_off (ID 20)
    if (feedbacks[powerOffId]?.value === true) {
      setIsOn(false)
      setIntensity(0)
    }
  }, [feedbacks, intensityId, powerOnId, powerOffId])

  // ============================================================
  // HANDLERS (inchangés)
  // ============================================================
  
  const handleToggle = () => {
    const newState = !isOn
    setIsOn(newState)
    
    if (device.commands?.digital && device.commands?.ushort?.intensity) {
      if (newState) {
        setIntensity(50)
        sendCommand('digital', device.commands.digital.power_on, null)
        sendCommand('ushort', device.commands.ushort.intensity, 50)
      } else {
        setIntensity(0)
        sendCommand('digital', device.commands.digital.power_off, null)
        sendCommand('ushort', device.commands.ushort.intensity, 0)
      }
    }
  }

  const handleIntensityChange = (value) => {
    setIntensity(value)
    
    if (value === 0) {
      setIsOn(false)
    } else if (value > 0 && !isOn) {
      setIsOn(true)
    }
    
    if (device.commands?.ushort?.intensity) {
      sendCommand('ushort', device.commands.ushort.intensity, value)
    }
  }

  return (
    <Card className="bg-white dark:bg-blue-800/50 border border-gray-200 dark:border-blue-600/50">
      <CardBody className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate flex-1">
              {device.Name}
            </h3>
            <Switch
              isSelected={isOn}
              onValueChange={handleToggle}
              color="success"
              size="sm"
            >
              <span className="text-gray-900 dark:text-white text-xs sm:text-sm whitespace-nowrap">
                {isOn ? 'ON' : 'OFF'}
              </span>
            </Switch>
          </div>
          
          {device.commands?.ushort?.intensity && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Intensité</span>
                <span>{intensity}%</span>
              </div>
              <Slider
                value={intensity}
                onChange={handleIntensityChange}
                minValue={0}
                maxValue={100}
                step={1}
                color="primary"
                className="max-w-full"
              />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

export default LightsCard
```

---

## 📊 Flux complet expliqué avec valeurs

### Scénario : Connexion + Feedback reçu

#### Étape 1 : Connexion WebSocket

```javascript
// Utilisateur clique sur "Connecter"
// WebSocket se connecte à ws://192.168.1.110:9494/server

ws.onopen() → Connexion établie
```

#### Étape 2 : Réception de `action_onopen` (digital)

```javascript
// Serveur envoie :
{
  "action": "action_onopen",
  "type": "boolean",
  "feedback": {
    "1": false,
    "2": false,
    "19": true,    // ← power_on de Cabin
    "20": false,   // ← power_off de Cabin
    ...
  }
}

// WebSocketContext reçoit le message
// → feedbackStore.updateFeedbacksBatch('digital', feedback)

// Store mis à jour :
this.store = {
  digital: {
    1: { id: 1, type: "digital", value: false, timestamp: ... },
    2: { id: 2, type: "digital", value: false, timestamp: ... },
    19: { id: 19, type: "digital", value: true, timestamp: ... },
    20: { id: 20, type: "digital", value: false, timestamp: ... },
    ...
  },
  ushort: {},
  string: {}
}

// → notifySubscribers() appelé
// → Tous les composants abonnés sont notifiés
```

#### Étape 3 : Réception de `action_onopen` (ushort)

```javascript
// Serveur envoie :
{
  "action": "action_onopen",
  "type": "ushort",
  "feedback": {
    "1": 0,
    "2": 0,
    "10": 75,     // ← intensité de Cabin
    "11": 0,
    ...
  }
}

// → feedbackStore.updateFeedbacksBatch('ushort', feedback)

// Store mis à jour :
this.store = {
  digital: { 19: {...}, 20: {...}, ... },
  ushort: {
    1: { id: 1, type: "ushort", value: 0, timestamp: ... },
    10: { id: 10, type: "ushort", value: 75, timestamp: ... },
    ...
  },
  string: {}
}

// → notifySubscribers() appelé
```

#### Étape 4 : LightsCard monte et lit les feedbacks

```javascript
// LightsCard monte (utilisateur affiche catégorie "Lights")

const LightsCard = ({ device }) => {
  // device = {
  //   Name: "Cabin",
  //   commands: {
  //     digital: { power_on: 19, power_off: 20 },
  //     ushort: { intensity: 10 }
  //   }
  // }
  
  const feedbacks = useDeviceFeedback(device)
  
  // Le hook s'exécute :
  // 1. readFeedbacks() est appelé
  
  // readFeedbacks() extrait les IDs :
  // - digital: [19, 20]
  // - ushort: [10]
  
  // readFeedbacks() lit depuis le store :
  // - feedbackStore.getFeedback(19, 'digital') → { id: 19, value: true, ... }
  // - feedbackStore.getFeedback(20, 'digital') → { id: 20, value: false, ... }
  // - feedbackStore.getFeedback(10, 'ushort') → { id: 10, value: 75, ... }
  
  // result = {
  //   19: { id: 19, type: "digital", value: true, ... },
  //   20: { id: 20, type: "digital", value: false, ... },
  //   10: { id: 10, type: "ushort", value: 75, ... }
  // }
  
  // 2. setFeedbacks(result)
  // feedbacks = {
  //   19: { id: 19, value: true, ... },
  //   20: { id: 20, value: false, ... },
  //   10: { id: 10, value: 75, ... }
  // }
  
  const intensityId = 10
  const powerOnId = 19
  
  // useEffect se déclenche car feedbacks a changé
  useEffect(() => {
    // feedbacks[10] existe → value = 75
    if (feedbacks[intensityId]) {
      setIntensity(75)  // ✅ Initialisé avec la bonne valeur !
      setIsOn(true)     // ✅ Initialisé correctement !
    }
  }, [feedbacks])
  
  // Le composant affiche immédiatement :
  // - Intensité: 75%
  // - Switch: ON
  // (Pas de valeurs par défaut !)
}
```

#### Étape 5 : Nouveau feedback reçu

```javascript
// Utilisateur change l'intensité à 80% via un autre contrôleur
// Serveur envoie :
{
  "action": "action_feedback",
  "id": 10,
  "type": "ushort",
  "value": 80
}

// WebSocketContext reçoit
// → feedbackStore.updateFeedback(10, 'ushort', 80)

// Store mis à jour :
this.store.ushort[10] = { id: 10, type: "ushort", value: 80, timestamp: ... }

// → notifySubscribers() appelé
// → callback() dans LightsCard est appelé

// callback() dans useDeviceFeedback :
const callback = () => {
  const updatedFeedbacks = readFeedbacks()
  // updatedFeedbacks[10] = { id: 10, value: 80, ... }
  setFeedbacks(updatedFeedbacks)
}

// feedbacks change : { 10: { value: 80, ... } }
// → useEffect([feedbacks]) se déclenche
// → setIntensity(80)
// → UI se met à jour automatiquement !
```

---

## 🎯 Différence clé : IDs vs Noms

### Avant (avec noms de commandes) :
```javascript
feedbacks = {
  intensity: { id: 10, value: 75 },    // ❌ Clé = nom
  power_on: { id: 19, value: true }    // ❌ Clé = nom
}

// Usage :
if (feedbacks.intensity) { ... }       // ❌ Besoin de connaître le nom
```

### Maintenant (avec IDs) :
```javascript
feedbacks = {
  10: { id: 10, value: 75 },           // ✅ Clé = ID
  19: { id: 19, value: true }          // ✅ Clé = ID
}

// Usage :
if (feedbacks[intensityId]) { ... }    // ✅ Direct, simple
```

**Avantage** : Plus besoin de mapper nom → ID, on utilise directement les IDs !

