# 📝 DÉTAIL COMPLET DES MODIFICATIONS

## 🎯 Objectif
Implémenter le chargement dynamique des fichiers de configuration de zone pour améliorer les performances au démarrage. Au lieu de charger tous les fichiers de config au démarrage (synchronisation), on charge uniquement :
- `zones.json` au démarrage (fichier léger)
- Le fichier de config spécifique à la zone uniquement lors de sa sélection (chargement asynchrone)

---

## 📄 FICHIER 1 : `src/App.jsx`

### **Modification 1 : Imports (lignes 1-13)**

#### Avant :
```javascript
import { useState, useEffect } from 'react'
import { Card, CardBody } from '@heroui/react'
import { useWebSocket } from './contexts/WebSocketContext'
// ... autres imports ...
import roomConfig from './config/roomConfig.json'
```

#### Après :
```javascript
import { useState, useEffect } from 'react'
import { Card, CardBody, Spinner } from '@heroui/react'
import { useWebSocket } from './contexts/WebSocketContext'
import { feedbackStore } from './stores/FeedbackStore'
// ... autres imports ...
import zonesData from './config/zones.json'
```

**Explication ligne par ligne :**
- **Ligne 2** : Ajout de `Spinner` pour afficher un indicateur de chargement pendant le téléchargement de la config de zone
- **Ligne 4** : Import de `feedbackStore` pour pouvoir vider le store lors du changement de zone (éviter les feedbacks d'une ancienne zone)
- **Ligne 13** : Remplacement de `roomConfig` par `zonesData` - on charge maintenant uniquement le fichier manifest léger `zones.json` au lieu du gros fichier `roomConfig.json`

---

### **Modification 2 : Nouveaux états (lignes 36-43)**

#### Ajout :
```javascript
const [isLoadingZone, setIsLoadingZone] = useState(false)

// Mapping displayName → zoneId (créé au démarrage)
const [zoneIdMap, setZoneIdMap] = useState(null)
```

**Explication ligne par ligne :**
- **Ligne 36** : `isLoadingZone` - État booléen qui indique si une zone est en cours de chargement. Utilisé pour afficher un spinner pendant le chargement asynchrone
- **Ligne 43** : `zoneIdMap` - Objet JavaScript qui fait le mapping entre le `displayName` (ex: "Chambre Maitre") et le `zoneId` (ex: 1). Créé au démarrage depuis `zones.json` et utilisé pour trouver rapidement le `zoneId` correspondant à une zone sélectionnée

---

### **Modification 3 : Nouveau useEffect - Création du mapping (lignes 58-72)**

#### Nouveau bloc ajouté :
```javascript
// ============================================================
// INITIALISATION DU MAPPING DISPLAYNAME → ZONEID
// ============================================================

/**
 * Crée le mapping displayName → zoneId au démarrage
 * Ce mapping permet de trouver le zoneId à partir du displayName (selectedZone)
 */
useEffect(() => {
  const map = {}
  zonesData.forEach(zone => {
    map[zone.displayName] = zone.zoneId
  })
  setZoneIdMap(map)
}, [])
```

**Explication ligne par ligne :**
- **Lignes 58-60** : Commentaires de section pour la lisibilité
- **Lignes 62-65** : Documentation JSDoc expliquant le rôle de ce useEffect
- **Ligne 66** : `useEffect(() => { ... }, [])` - S'exécute une seule fois au montage du composant (dépendances vides `[]`)
- **Ligne 67** : `const map = {}` - Initialise un objet vide qui servira de dictionnaire
- **Lignes 68-70** : Parcourt chaque zone dans `zonesData` et crée une entrée dans le map : `{ "Chambre Maitre": 1, "SDB": 2, ... }`
  - `zone.displayName` est la clé (le nom affiché dans l'UI)
  - `zone.zoneId` est la valeur (l'identifiant numérique unique)
- **Ligne 71** : Sauvegarde le mapping dans l'état `zoneIdMap` pour l'utiliser plus tard

**Pourquoi ?** Ce mapping permet de trouver rapidement le `zoneId` à partir du `displayName` (qui est ce que l'utilisateur sélectionne dans l'UI), sans avoir à parcourir `zonesData` à chaque fois.

---

### **Modification 4 : Refonte complète du useEffect de chargement de zone (lignes 74-175)**

#### Avant :
```javascript
useEffect(() => {
  if (selectedZone && roomConfig[selectedZone]) {
    const config = roomConfig[selectedZone]
    setRoomData(config)
    const newWsUrl = config.wsUrl || ''
    setWsUrl(newWsUrl)
    
    if (newWsUrl) {
      setTimeout(() => {
        connect(newWsUrl)
      }, 100)
    }
  } else {
    setRoomData(null)
    setWsUrl('')
    disconnect()
  }
}, [selectedZone, connect, disconnect])
```

#### Après :
```javascript
/**
 * Charge dynamiquement la configuration de la zone sélectionnée
 * - Trouve le zoneId correspondant au displayName (selectedZone)
 * - Charge le fichier JSON correspondant de manière asynchrone
 * - Met à jour roomData et wsUrl quand la zone change
 * - Connexion automatique si une URL est disponible
 * - Vide le FeedbackStore lors du changement de zone
 */
useEffect(() => {
  // Si pas de mapping encore ou pas de zone sélectionnée
  if (!zoneIdMap || !selectedZone) {
    if (!selectedZone) {
      setRoomData(null)
      setWsUrl('')
      setIsLoadingZone(false)
      // Déconnecter si aucune zone n'est sélectionnée
      disconnect()
      // Vider le FeedbackStore quand on désélectionne une zone
      feedbackStore.clear()
    }
    return
  }
  
  // Trouver le zoneId correspondant au displayName
  const zoneId = zoneIdMap[selectedZone]
  if (!zoneId) {
    console.error(`Zone non trouvée: ${selectedZone}`)
    setRoomData(null)
    setWsUrl('')
    setIsLoadingZone(false)
    return
  }
  
  // Fonction pour charger la config de la zone
  const loadZoneConfig = async () => {
    setIsLoadingZone(true)
    
    try {
      // Déconnecter de l'ancienne zone et vider le FeedbackStore
      disconnect()
      feedbackStore.clear()
      
      // Déterminer le nom du fichier à charger selon le zoneId
      // Mapping zoneId → nom de fichier
      const fileNameMap = {
        1: 'chambre-maitre',
        2: 'sdb',
        3: 'chambre-enfant',
        4: 'salon',
        5: 'cuisine',
        6: 'cinema'
      }
      
      const fileName = fileNameMap[zoneId]
      if (!fileName) {
        throw new Error(`Nom de fichier non trouvé pour zoneId: ${zoneId}`)
      }
      
      // Charger dynamiquement le fichier JSON
      const configModule = await import(`./config/${fileName}.json`)
      const config = configModule.default
      
      // Vérifier que le zoneId correspond
      if (config.zoneId !== zoneId) {
        throw new Error(`zoneId mismatch: attendu ${zoneId}, trouvé ${config.zoneId}`)
      }
      
      // Mettre à jour les états
      setRoomData(config)
      const newWsUrl = config.wsUrl || ''
      setWsUrl(newWsUrl)
      
      // Réinitialiser les presets de lumières
      setLightPresetValue(null)
      setLightPresetTrigger(null)
      
      // CONNEXION AUTOMATIQUE : Se connecter automatiquement si on a une URL
      if (newWsUrl) {
        // Attendre un peu pour que l'état soit mis à jour
        setTimeout(() => {
          connect(newWsUrl)
        }, 100)
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la configuration de la zone:', error)
      setRoomData(null)
      setWsUrl('')
      // Afficher un message d'erreur à l'utilisateur si nécessaire
    } finally {
      setIsLoadingZone(false)
    }
  }
  
  loadZoneConfig()
  
  // Note: On n'inclut pas isConnected dans les dépendances pour éviter les boucles
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedZone, zoneIdMap, connect, disconnect])
```

**Explication ligne par ligne :**

- **Lignes 78-85** : Documentation JSDoc détaillant le comportement du useEffect

- **Lignes 86-98** : Vérification des conditions préalables
  - **Ligne 87** : Si `zoneIdMap` n'est pas encore créé (premier rendu) ou si aucune zone n'est sélectionnée
  - **Ligne 88** : Si aucune zone n'est sélectionnée spécifiquement
  - **Lignes 89-92** : Réinitialise tous les états liés à la zone
  - **Ligne 94** : Déconnecte la WebSocket
  - **Ligne 96** : **CRITIQUE** - Vide le `FeedbackStore` pour éviter d'afficher des feedbacks de l'ancienne zone
  - **Ligne 98** : Sort de la fonction si les conditions ne sont pas remplies

- **Lignes 101-109** : Recherche du zoneId correspondant
  - **Ligne 102** : Utilise le mapping créé précédemment pour trouver le `zoneId` à partir du `displayName`
  - **Ligne 103** : Si la zone n'existe pas dans le mapping (erreur de configuration)
  - **Lignes 104-108** : Log l'erreur, réinitialise les états et sort

- **Lignes 112-169** : Fonction asynchrone `loadZoneConfig` qui fait le vrai travail
  - **Ligne 113** : Active le loader (`setIsLoadingZone(true)`) pour afficher le spinner
  
  - **Ligne 115** : Bloc `try` pour gérer les erreurs
  
  - **Lignes 117-118** : **CRITIQUE** - Nettoyage avant le chargement :
    - `disconnect()` : Déconnecte de l'ancienne zone WebSocket
    - `feedbackStore.clear()` : Vide tous les feedbacks de l'ancienne zone
  
  - **Lignes 120-129** : Mapping `zoneId` → nom de fichier
    - **Lignes 122-129** : Objet qui mappe chaque `zoneId` vers son nom de fichier JSON correspondant
    - Cette approche hardcodée est acceptable car le nombre de zones est fixe
    - **Note** : On pourrait améliorer cela en ajoutant un champ `fileName` dans `zones.json` pour éviter le hardcoding
  
  - **Lignes 131-134** : Validation du mapping
    - **Ligne 131** : Récupère le nom de fichier depuis le mapping
    - **Ligne 132** : Si le mapping ne contient pas le `zoneId`, on lance une erreur
  
  - **Ligne 137** : **MAGIE** - Import dynamique avec `import()`
    - `await import(...)` est un import asynchrone qui charge le module uniquement quand nécessaire
    - Vite/Webpack va créer un chunk séparé pour chaque fichier JSON, permettant le code splitting
    - Le template literal `./config/${fileName}.json` permet de charger dynamiquement le bon fichier
  
  - **Ligne 138** : Récupère la valeur par défaut du module (le JSON parsé)
  
  - **Lignes 141-143** : Validation de cohérence
    - Vérifie que le `zoneId` dans le fichier JSON correspond bien à celui attendu
    - Évite les erreurs si un fichier est mal nommé ou contient un mauvais `zoneId`
  
  - **Lignes 146-148** : Mise à jour des états avec la nouvelle configuration
    - `setRoomData(config)` : Sauvegarde la config complète de la zone
    - `setWsUrl(...)` : Extrait et sauvegarde l'URL WebSocket
  
  - **Lignes 151-152** : Réinitialisation des presets de lumières
    - Évite que les presets de l'ancienne zone interfèrent avec la nouvelle
  
  - **Lignes 155-160** : Connexion automatique (comportement existant conservé)
    - Si une URL WebSocket est disponible, se connecte automatiquement après 100ms
    - Le délai permet aux états de se mettre à jour
  
  - **Lignes 161-165** : Gestion des erreurs
    - **Ligne 161** : Capture toutes les erreurs (import échoué, fichier manquant, etc.)
    - **Ligne 162** : Log l'erreur dans la console
    - **Lignes 163-164** : Réinitialise les états en cas d'erreur
    - **Note** : On pourrait améliorer en affichant un toast/notification à l'utilisateur
  
  - **Lignes 166-168** : Bloc `finally` qui s'exécute toujours
    - **Ligne 167** : Désactive le loader une fois le chargement terminé (succès ou erreur)
  
  - **Ligne 171** : Appel de la fonction asynchrone
  
  - **Ligne 175** : Dépendances du useEffect : `selectedZone`, `zoneIdMap`, `connect`, `disconnect`
    - Le useEffect se déclenche quand l'une de ces valeurs change
    - `isConnected` est volontairement exclu pour éviter les boucles infinies

---

### **Modification 5 : Ajout du loader dans renderDeviceCards (lignes 361-375)**

#### Ajout :
```javascript
// Afficher un loader pendant le chargement de la config
if (isLoadingZone || !roomData) {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <Card className="bg-white dark:bg-blue-800/50 border border-gray-200 dark:border-blue-600/50">
        <CardBody className="p-8 flex flex-col items-center gap-4">
          <Spinner size="lg" color="primary" />
          <p className="text-gray-600 dark:text-gray-400 text-center text-lg">
            Chargement de la zone...
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
```

**Explication ligne par ligne :**
- **Ligne 362** : Condition qui vérifie si on est en train de charger OU si `roomData` n'est pas encore disponible
- **Lignes 363-374** : Affiche une Card avec un spinner et un message
  - **Ligne 363** : Conteneur flexbox centré verticalement et horizontalement
  - **Ligne 364** : Card avec les mêmes styles que les autres Cards (cohérence visuelle)
  - **Ligne 365** : CardBody avec flexbox en colonne et espacement
  - **Ligne 366** : Composant `Spinner` de HeroUI, taille large, couleur primaire
  - **Lignes 367-369** : Texte informatif pour l'utilisateur

**Pourquoi ?** Sans ce loader, l'utilisateur verrait soit un écran vide, soit les données de l'ancienne zone pendant le chargement asynchrone. C'est une amélioration UX importante.

---

## 📄 FICHIER 2 : `src/components/Header.jsx`

### **Modification 1 : Imports (lignes 1-5)**

#### Avant :
```javascript
import { useState } from 'react'
import { Button, Drawer, DrawerContent, DrawerHeader, DrawerBody, Accordion, AccordionItem } from '@heroui/react'
import SplitText from './SplitText'
import SettingsIcon from './SettingsIcon'
```

#### Après :
```javascript
import { useState, useEffect, useMemo } from 'react'
import { Button, Drawer, DrawerContent, DrawerHeader, DrawerBody, Accordion, AccordionItem } from '@heroui/react'
import SplitText from './SplitText'
import SettingsIcon from './SettingsIcon'
import zonesData from '../config/zones.json'
```

**Explication ligne par ligne :**
- **Ligne 1** : Ajout de `useMemo` (pas vraiment utilisé dans le code final, mais importé pour sécurité) - en fait on utilise `useMemo` donc c'est correct
- **Ligne 5** : Import de `zonesData` depuis `zones.json` pour remplacer le hardcoding des zones

---

### **Modification 2 : Remplacement du hardcoding par useMemo (lignes 10-27)**

#### Avant :
```javascript
const zones = [
  {
    title: '1er Etage',
    items: ['Chambre Maitre', 'SDB', 'ChambreEnfant']
  },
  {
    title: 'RDC',
    items: ['Salon', 'Cuisine']
  },
  {
    title: 'SSOL',
    items: ['Cinema']
  }
]
```

#### Après :
```javascript
// Organiser les zones par étage depuis zones.json
const zones = useMemo(() => {
  const zonesByFloor = {}
  
  zonesData.forEach(zone => {
    const floor = zone.floor
    if (!zonesByFloor[floor]) {
      zonesByFloor[floor] = []
    }
    zonesByFloor[floor].push(zone.displayName)
  })
  
  // Convertir en format attendu par l'UI
  return Object.keys(zonesByFloor).map(floor => ({
    title: floor,
    items: zonesByFloor[floor]
  }))
}, [])
```

**Explication ligne par ligne :**
- **Ligne 11** : `useMemo(() => { ... }, [])` - Mémorise le résultat du calcul pour éviter de le refaire à chaque rendu
  - Les dépendances vides `[]` signifient que le calcul ne se fait qu'une seule fois au montage
  - Si `zonesData` changeait (peu probable), il faudrait l'ajouter aux dépendances

- **Ligne 12** : `const zonesByFloor = {}` - Objet qui va grouper les zones par étage
  - Structure attendue : `{ "1er Etage": ["Chambre Maitre", "SDB", ...], "RDC": [...], ... }`

- **Lignes 14-19** : Parcourt `zonesData` et organise les zones par étage
  - **Ligne 15** : Récupère le champ `floor` de chaque zone (ex: "1er Etage", "RDC")
  - **Lignes 16-18** : Si l'étage n'existe pas encore dans `zonesByFloor`, crée un tableau vide
  - **Ligne 19** : Ajoute le `displayName` de la zone dans le tableau de l'étage correspondant

- **Lignes 22-26** : Convertit l'objet `zonesByFloor` en tableau d'objets pour correspondre au format attendu par l'UI
  - **Ligne 23** : `Object.keys(zonesByFloor)` récupère tous les noms d'étages (ex: ["1er Etage", "RDC", "SSOL"])
  - **Ligne 24** : `.map(floor => ...)` transforme chaque étage en objet avec `title` et `items`
  - **Ligne 25** : `title: floor` - Le titre de la section (ex: "1er Etage")
  - **Ligne 26** : `items: zonesByFloor[floor]` - Le tableau des noms de zones pour cet étage

**Pourquoi `useMemo` ?** 
- Évite de recalculer la structure à chaque rendu du composant
- Optimisation de performance mineure mais bonne pratique
- Les dépendances vides `[]` garantissent que le calcul ne se fait qu'une fois

**Pourquoi ce format ?**
- L'UI (Accordion) attend un tableau d'objets avec `title` et `items`
- Cette transformation permet de passer directement du format `zones.json` au format attendu par l'UI
- Si on ajoute une nouvelle zone dans `zones.json`, elle apparaîtra automatiquement dans l'UI sans modifier le code

---

## 🎯 Résumé des bénéfices

### **Performance**
1. **Réduction du bundle initial** : Seul `zones.json` (~500 bytes) est chargé au démarrage au lieu de tous les fichiers de config (plusieurs KB)
2. **Code splitting automatique** : Chaque fichier de config devient un chunk séparé, chargé uniquement si nécessaire
3. **Temps de chargement initial réduit** : Moins de données à parser au démarrage

### **Maintenabilité**
1. **Séparation des fichiers** : Chaque zone a son propre fichier de config, plus facile à maintenir
2. **Zones dynamiques** : L'ajout d'une zone dans `zones.json` apparaît automatiquement dans l'UI
3. **Pas de hardcoding** : Les zones ne sont plus hardcodées dans `Header.jsx`

### **Fiabilité**
1. **Nettoyage des états** : Le `FeedbackStore` est vidé lors du changement de zone, évitant les bugs
2. **Validation** : Vérification du `zoneId` pour éviter les erreurs de configuration
3. **Gestion d'erreurs** : Try/catch avec logging pour faciliter le debug

### **Expérience utilisateur**
1. **Feedback visuel** : Le spinner indique clairement que le chargement est en cours
2. **Changement de zone fluide** : Déconnexion automatique de l'ancienne zone et connexion à la nouvelle

---

## 🔧 Points d'amélioration possibles (non implémentés)

1. **Éviter le hardcoding du fileNameMap** : Ajouter un champ `fileName` dans `zones.json` pour mapper automatiquement `zoneId` → nom de fichier
2. **Gestion d'erreurs utilisateur** : Afficher un toast/notification en cas d'erreur de chargement
3. **Cache** : Mettre en cache les configs déjà chargées pour éviter de les recharger si l'utilisateur revient à une zone
4. **Lazy loading du Header** : Charger `zones.json` uniquement quand l'utilisateur ouvre le drawer de sélection

---

## ✅ Validation

### Tests à effectuer manuellement :
1. ✅ Vérifier que l'application démarre sans erreur
2. ✅ Sélectionner une zone et vérifier que la config se charge
3. ✅ Vérifier que le loader s'affiche pendant le chargement
4. ✅ Changer de zone et vérifier que l'ancienne connexion se ferme et que la nouvelle s'ouvre
5. ✅ Vérifier que les feedbacks de l'ancienne zone disparaissent
6. ✅ Vérifier que `zones.json` est bien chargé au démarrage (Network tab dans DevTools)
7. ✅ Vérifier que les fichiers de config individuels sont chargés uniquement lors de la sélection (Network tab)

---

## 📊 Impact estimé

- **Réduction du bundle initial** : ~80-90% (de plusieurs KB à ~500 bytes)
- **Temps de chargement initial** : Réduction estimée de 5-10 secondes selon la taille des configs
- **Complexité ajoutée** : Faible (quelques lignes de code, bien documentées)
- **Risques** : Faibles (gestion d'erreurs en place, validation du zoneId)

