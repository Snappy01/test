# 📚 EXPLICATION COMPLÈTE DU PROJET - DOMOTIQUE

## 🎯 PARTIE 1 : LOGIQUE DE FONCTIONNEMENT

### 1.1 Structure du fichier de configuration (`roomConfig.json`)

Le fichier `src/config/roomConfig.json` est le **cœur de l'application**. Il contient toute la configuration pour chaque pièce/zone de la maison.

#### Structure hiérarchique :

```json
{
  "Nom de la Zone": {
    "roomName": "Nom de la Zone",
    "wsUrl": "ws://172.16.80.104:9899/server",
    "devices": {
      "Lights": [...],
      "Blinds": [...],
      "AudioZones": [...],
      "ACs": [...]
    }
  }
}
```

#### Explication détaillée :

- **"Nom de la Zone"** (clé principale) : C'est l'identifiant unique de la zone (ex: "Chambre Maitre", "Salon")
  - C'est cette clé qui est utilisée quand tu sélectionnes une zone dans le Header
  - Elle doit correspondre exactement aux noms dans le Header.jsx

- **"roomName"** : Le nom d'affichage de la zone (peut être identique à la clé)

- **"wsUrl"** : L'URL WebSocket pour se connecter au serveur domotique
  - Format : `ws://IP:PORT/PATH`
  - C'est l'adresse du serveur qui contrôle réellement les appareils

- **"devices"** : Un objet qui regroupe tous les appareils par catégorie

#### Structure d'un device :

```json
{
  "Name": "Cabin",
  "commands": {
    "digital": {
      "power_on": 19,
      "power_off": 20
    },
    "ushort": {
      "intensity": 10
    }
  }
}
```

**Explication :**
- **"Name"** : Le nom affiché sur la carte (ex: "Cabin", "Bed", "Roman")
- **"commands"** : Les commandes disponibles pour cet appareil
  - **"digital"** : Commandes ON/OFF (valeurs binaires)
    - Ce sont des IDs numériques qui identifient la commande sur le serveur
    - Ex: `power_on: 19` signifie "pour allumer, envoyer la commande ID 19"
  - **"ushort"** : Commandes avec valeurs numériques (intensité, volume, température)
    - `intensity: 10` signifie "pour régler l'intensité, utiliser la commande ID 10 avec une valeur (0-100)"

#### Types de devices :

1. **Lights** (Éclairages)
   - Commande digital : `power_on` / `power_off`
   - Commande ushort : `intensity` (0-100)

2. **Blinds** (Stores)
   - Commandes digital : `power_up` / `stop` / `power_down`

3. **AudioZones** (Audio)
   - Commandes digital : `mute_on` / `mute_off`
   - Commandes ushort : `volume` / `subwoofer_level` (bass)

4. **ACs** (Climatisation)
   - Commande ushort : `temperature` (température cible)
   - Commande ushort : `current_temperature` (température actuelle - lecture seule)

---

### 1.2 Flux de sélection de zone

#### Étape par étape :

1. **L'utilisateur clique sur "Select Zone"** dans le Header
   - Cela ouvre un Drawer (menu latéral) avec les zones organisées par étage

2. **L'utilisateur sélectionne une zone** (ex: "Chambre Maitre")
   - La fonction `handleZoneClick` dans Header.jsx est appelée
   - Elle appelle `onZoneSelect("Chambre Maitre")`
   - Le Drawer se ferme automatiquement

3. **Dans App.jsx, `selectedZone` est mis à jour**
   ```javascript
   const [selectedZone, setSelectedZone] = useState(null)
   // Devient : selectedZone = "Chambre Maitre"
   ```

4. **Un `useEffect` se déclenche** dans App.jsx (lignes 23-31)
   ```javascript
   useEffect(() => {
     if (selectedZone && roomConfig[selectedZone]) {
       const config = roomConfig[selectedZone]  // Récupère la config de "Chambre Maitre"
       setRoomData(config)  // Stocke toute la config de la zone
       setWsUrl(config.wsUrl || '')  // Stocke l'URL WebSocket
     }
   }, [selectedZone])  // Se déclenche à chaque changement de selectedZone
   ```

5. **Le nom de la zone s'affiche dans le Header** avec une animation GSAP SplitText

6. **Les devices de la zone sont maintenant disponibles** dans `roomData.devices`

---

### 1.3 Flux de changement de catégorie (Footer)

1. **L'utilisateur clique sur un bouton du Footer** (Lights, Blinds, Audio, HVAC)

2. **`setActiveCategory` est appelé** avec la nouvelle catégorie (ex: "Blinds")

3. **La fonction `getActiveDevices()` se recalcule** (lignes 114-118)
   ```javascript
   const getActiveDevices = () => {
     if (!roomData || !roomData.devices) return []
     const categoryKey = categoryMap[activeCategory]  // "Blinds" → "Blinds"
     return roomData.devices[categoryKey] || []  // Retourne le tableau des stores
   }
   ```

4. **`renderDeviceCards()` est appelée** et génère les bonnes cards :
   - Si catégorie = "Blinds" → génère des `BlindsCard`
   - Si catégorie = "Lights" → génère des `LightsCard`
   - etc.

5. **Les cards s'affichent à l'écran** dans une grille responsive

---

### 1.4 Flux d'envoi de commande

1. **L'utilisateur interagit avec un contrôle** (ex: allume une lampe)

2. **La fonction handler du composant est appelée** (ex: `handleToggle()` dans LightsCard.jsx)
   ```javascript
   const handleToggle = () => {
     const newState = !isOn
     setIsOn(newState)  // Met à jour l'état local (UI)
     if (device.commands?.digital) {
       const command = newState ? device.commands.digital.power_on : device.commands.digital.power_off
       onCommand('digital', command, null)  // Appelle la fonction parent
     }
   }
   ```

3. **`onCommand` est appelé** (c'est `handleCommand` dans App.jsx, lignes 85-103)
   ```javascript
   const handleCommand = (type, commandId, value) => {
     // type = "digital" ou "ushort"
     // commandId = 19 (par ex pour power_on)
     // value = null pour digital, ou un nombre pour ushort
     
     if (!isConnected || !wsRef.current) {
       // Mode hors ligne : juste log dans la console
       console.warn('WebSocket non connecté - commande simulée:', { type, commandId, value })
       return
     }

     // Mode connecté : envoie via WebSocket
     const message = {
       type,           // "digital" ou "ushort"
       command: commandId,  // 19, 20, etc.
       value: value !== null ? value : undefined
     }
     
     wsRef.current.send(JSON.stringify(message))  // Envoie au serveur
   }
   ```

4. **Le serveur WebSocket reçoit la commande** et contrôle l'appareil réel

---

### 1.5 Gestion de la connexion WebSocket

#### Connexion manuelle :

1. **L'utilisateur clique sur le bouton ⚙️** dans le Header
   - Cela ouvre le Modal `Settings`

2. **L'utilisateur entre/modifie l'URL WebSocket** si nécessaire
   - Par défaut, l'URL vient de `roomConfig.json` de la zone sélectionnée

3. **L'utilisateur clique sur "Connecter"**
   - `handleConnect()` est appelé (lignes 34-65)

4. **Une nouvelle connexion WebSocket est créée**
   ```javascript
   const ws = new WebSocket(wsUrl)
   ```

5. **Les event handlers sont configurés** :
   - `ws.onopen` : Quand la connexion s'établit → `setIsConnected(true)`
   - `ws.onerror` : En cas d'erreur → `setIsConnected(false)`
   - `ws.onclose` : Quand la connexion se ferme → `setIsConnected(false)`
   - `ws.onmessage` : Quand le serveur envoie un message → log dans la console

6. **La référence WebSocket est stockée** dans `wsRef.current` pour pouvoir envoyer des commandes plus tard

#### Déconnexion :

- L'utilisateur clique sur "Déconnecter" → `handleDisconnect()` ferme la connexion

---

## 🔄 PARTIE 2 : CHANGEMENTS PAR RAPPORT À LA VERSION D'AVANT

### 2.1 Ancienne version (avant modifications)

#### Structure :
- Application de démonstration avec :
  - Exemples de boutons HeroUI
  - Animation de texte avec GSAP (SplitText)
  - Grille de cubes 3D interactive (Cubes.jsx)
  - Composant Galaxy (WebGL) importé mais non utilisé
  - Header simple sans fonctionnalité de sélection

#### Limitations :
- Pas de gestion domotique
- Pas de système de configuration par zone
- Pas de WebSocket
- Pas de système de cards pour contrôler des appareils
- Composant Cubes masqué sur mobile
- Navbar commentée (non utilisée)

---

### 2.2 Nouvelle version (après modifications)

#### Ajouts majeurs :

1. **Système de configuration centralisé**
   - Fichier `roomConfig.json` avec toutes les zones et devices
   - Chargement dynamique selon la zone sélectionnée

2. **Header fonctionnel avec sélection de zone**
   - Drawer avec zones organisées par étage
   - Animation GSAP du nom de zone
   - Bouton Settings (⚙️) pour gérer WebSocket

3. **4 nouveaux composants de contrôle** :
   - `LightsCard.jsx` : Switch ON/OFF + Slider intensité
   - `BlindsCard.jsx` : Boutons UP/STOP/DOWN
   - `AudioCard.jsx` : Sliders Volume/Bass + Toggle Mute
   - `HVACCard.jsx` : Slider température + boutons rapides

4. **Footer de navigation**
   - 4 boutons pour changer de catégorie
   - Affichage visuel de la catégorie active
   - Responsive (adaptatif mobile/desktop)

5. **Modal Settings**
   - Configuration de l'URL WebSocket
   - Boutons Connecter/Déconnecter
   - Indicateur de statut de connexion

6. **Gestion WebSocket complète**
   - Connexion/déconnexion manuelle
   - Envoi de commandes JSON
   - Gestion des erreurs
   - Mode hors ligne (contrôles utilisables sans connexion)

7. **Affichage dynamique**
   - Grid responsive qui s'adapte au nombre de devices
   - Messages d'état (pas de zone, pas de devices)
   - Rendu conditionnel selon la catégorie active

#### Modifications de l'architecture :

- **App.jsx** complètement réécrit :
  - Suppression des exemples de boutons
  - Suppression du composant Cubes
  - Ajout de la logique de gestion de zone
  - Ajout de la logique WebSocket
  - Ajout du rendu dynamique des cards

- **Header.jsx** amélioré :
  - Ajout du prop `onSettingsOpen`
  - Ajout du bouton Settings
  - Amélioration responsive

- **Nouveaux fichiers** :
  - `src/config/roomConfig.json`
  - `src/components/LightsCard.jsx`
  - `src/components/BlindsCard.jsx`
  - `src/components/AudioCard.jsx`
  - `src/components/HVACCard.jsx`
  - `src/components/Footer.jsx`
  - `src/components/Settings.jsx`

#### Comportements modifiés :

- **Avant** : Les contrôles étaient désactivés si pas connecté
- **Maintenant** : Les contrôles sont TOUJOURS utilisables, même sans connexion
  - L'état local est mis à jour (UI réactive)
  - Les commandes sont loggées dans la console si pas connecté
  - Les commandes sont envoyées via WebSocket si connecté

---

## 🎨 PARTIE 3 : EXPLICATION DES CLASSES TAILWIND

### 3.1 Classes de layout (structure)

#### Flexbox :
- **`flex`** : Active le display flex
- **`flex-col`** : Direction colonne (éléments empilés verticalement)
- **`flex-row`** : Direction ligne (éléments côte à côte) - par défaut
- **`flex-1`** : L'élément prend tout l'espace disponible
- **`items-center`** : Aligne les éléments au centre verticalement (align-items: center)
- **`justify-center`** : Aligne les éléments au centre horizontalement (justify-content: center)
- **`justify-between`** : Espace les éléments avec de l'espace entre eux
- **`gap-2`** : Espacement de 0.5rem (8px) entre les éléments flex
- **`gap-4`** : Espacement de 1rem (16px)

#### Grid :
- **`grid`** : Active le display grid
- **`grid-cols-1`** : 1 colonne (mobile)
- **`grid-cols-2`** : 2 colonnes
- **`grid-cols-3`** : 3 colonnes
- **`grid-cols-4`** : 4 colonnes
- **`sm:grid-cols-2`** : 2 colonnes à partir de 640px (small breakpoint)
- **`lg:grid-cols-3`** : 3 colonnes à partir de 1024px (large breakpoint)
- **`xl:grid-cols-4`** : 4 colonnes à partir de 1280px (extra large breakpoint)

#### Positionnement :
- **`sticky`** : Position sticky (reste visible au scroll)
- **`top-0`** : Collé en haut (top: 0)
- **`bottom-0`** : Collé en bas (bottom: 0)
- **`z-50`** : Z-index élevé (superpose les autres éléments)
- **`z-40`** : Z-index moyen-élevé

#### Taille et espacement :
- **`min-h-screen`** : Hauteur minimum = 100vh (hauteur de l'écran)
- **`h-full`** : Hauteur = 100%
- **`w-full`** : Largeur = 100%
- **`min-w-[100px]`** : Largeur minimum = 100px (valeur arbitraire)
- **`max-w-full`** : Largeur maximum = 100%

---

### 3.2 Classes responsive (mobile-first)

Tailwind utilise le principe **mobile-first** : tu définis d'abord le style pour mobile, puis tu surcharges pour desktop.

#### Breakpoints Tailwind :
- **`sm:`** : À partir de 640px (petit écran)
- **`md:`** : À partir de 768px (moyen écran)
- **`lg:`** : À partir de 1024px (grand écran)
- **`xl:`** : À partir de 1280px (très grand écran)
- **`2xl:`** : À partir de 1536px (écran énorme)

#### Exemples :
- **`text-xs sm:text-sm`** :
  - Mobile : texte extra-small (12px)
  - Desktop (≥640px) : texte small (14px)

- **`hidden sm:inline`** :
  - Mobile : élément caché
  - Desktop (≥640px) : élément visible inline

- **`p-3 sm:p-4`** :
  - Mobile : padding de 12px (0.75rem)
  - Desktop (≥640px) : padding de 16px (1rem)

- **`pb-24 sm:pb-20`** :
  - Mobile : padding-bottom de 96px (6rem) - pour laisser de la place au footer
  - Desktop (≥640px) : padding-bottom de 80px (5rem)

---

### 3.3 Classes de couleur

#### Background (fond) :
- **`bg-blue-900`** : Fond bleu très foncé (#1e3a8a)
- **`bg-blue-800`** : Fond bleu foncé (#1e40af)
- **`bg-blue-800/50`** : Fond bleu foncé avec opacité 50% (semi-transparent)
- **`bg-blue-700`** : Fond bleu moyen-foncé (#1d4ed8)
- **`bg-blue-600`** : Fond bleu moyen (#2563eb)

#### Texte :
- **`text-white`** : Texte blanc
- **`text-gray-400`** : Texte gris clair (#9ca3af)
- **`text-gray-300`** : Texte gris très clair (#d1d5db)
- **`text-blue-400`** : Texte bleu clair (#60a5fa)

#### Bordure :
- **`border`** : Bordure de 1px
- **`border-blue-600/50`** : Bordure bleue avec opacité 50%
- **`border-blue-700/50`** : Bordure bleu moyen-foncé avec opacité 50%

#### Opacité (transparence) :
- La syntaxe `/50` signifie opacité 50% (0.5)
- Exemples : `/30` = 30%, `/50` = 50%, `/90` = 90%

---

### 3.4 Classes de typographie

#### Taille de texte :
- **`text-xs`** : 12px (extra-small)
- **`text-sm`** : 14px (small)
- **`text-base`** : 16px (base/normal)
- **`text-lg`** : 18px (large)
- **`text-xl`** : 20px (extra-large)
- **`text-2xl`** : 24px
- **`text-3xl`** : 30px
- **`text-4xl`** : 36px

#### Poids de police :
- **`font-semibold`** : Font-weight 600 (semi-gras)
- **`font-bold`** : Font-weight 700 (gras)

#### Autres :
- **`truncate`** : Coupe le texte trop long avec "..." (overflow: hidden + text-overflow: ellipsis)
- **`whitespace-nowrap`** : Empêche le retour à la ligne
- **`text-center`** : Texte centré

---

### 3.5 Classes utilitaires

#### Espacement (padding/margin) :
- **`p-4`** : Padding de 16px (1rem) sur tous les côtés
- **`p-8`** : Padding de 32px (2rem)
- **`px-4`** : Padding horizontal (left + right) de 16px
- **`py-3`** : Padding vertical (top + bottom) de 12px
- **`pt-4`** : Padding-top de 16px
- **`pb-20`** : Padding-bottom de 80px (5rem)
- **`gap-2`** : Espacement entre éléments flex/grid de 8px
- **`gap-4`** : Espacement de 16px

#### Overflow :
- **`overflow-y-auto`** : Scroll vertical automatique si contenu trop grand

#### Display :
- **`hidden`** : display: none (caché)
- **`inline`** : display: inline
- **`block`** : display: block

---

### 3.6 Classes spécifiques au projet

#### Combinaisons courantes dans le projet :

```css
/* Header sticky */
"bg-blue-900 text-white p-3 sm:p-4 flex items-center gap-2 sm:gap-4 sticky top-0 z-50"
```
- Fond bleu foncé, texte blanc
- Padding responsive (12px mobile, 16px desktop)
- Flex horizontal, éléments centrés verticalement
- Gap responsive
- Collé en haut, superpose les autres éléments

```css
/* Card de device */
"bg-blue-800/50 border border-blue-600/50"
```
- Fond bleu semi-transparent (50% opacité)
- Bordure bleue semi-transparente

```css
/* Grid responsive */
"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4"
```
- Mobile : 1 colonne, gap 12px, padding 12px
- ≥640px : 2 colonnes, gap 16px, padding 16px
- ≥1024px : 3 colonnes
- ≥1280px : 4 colonnes

```css
/* Texte responsive */
"text-base sm:text-lg font-semibold text-white truncate flex-1"
```
- Taille responsive (16px → 18px)
- Semi-gras, blanc
- Coupe si trop long
- Prend tout l'espace disponible

---

## 📋 RÉSUMÉ : Architecture de l'application

### Flux complet de l'application :

```
1. L'utilisateur ouvre l'app
   ↓
2. App.jsx se charge (état initial : selectedZone = null)
   ↓
3. L'utilisateur clique sur "Select Zone" dans le Header
   ↓
4. Drawer s'ouvre avec les zones
   ↓
5. L'utilisateur sélectionne une zone (ex: "Chambre Maitre")
   ↓
6. useEffect dans App.jsx charge la config de cette zone depuis roomConfig.json
   ↓
7. roomData contient maintenant tous les devices de la zone
   ↓
8. Le Footer affiche les 4 catégories (Lights, Blinds, Audio, HVAC)
   ↓
9. Par défaut, activeCategory = "Lights"
   ↓
10. getActiveDevices() retourne tous les appareils Lights de la zone
    ↓
11. renderDeviceCards() génère une LightsCard pour chaque appareil
    ↓
12. Les cards s'affichent dans une grille responsive
    ↓
13. L'utilisateur peut :
    - Cliquer sur un Switch pour allumer/éteindre (met à jour l'UI localement)
    - Bouger un Slider (met à jour l'UI localement)
    - Si connecté → la commande est envoyée via WebSocket
    - Si pas connecté → la commande est loggée dans la console
    ↓
14. L'utilisateur peut changer de catégorie via le Footer
    ↓
15. activeCategory change, getActiveDevices() retourne les nouveaux devices
    ↓
16. renderDeviceCards() génère les nouvelles cards (BlindsCard, AudioCard, etc.)
    ↓
17. Le cycle continue...
```

---

## 🔧 Points techniques importants

### React Hooks utilisés :

- **`useState`** : Gère l'état local des composants
  - Ex: `const [isOn, setIsOn] = useState(false)`

- **`useEffect`** : Exécute du code quand certaines dépendances changent
  - Ex: Charger la config quand `selectedZone` change

- **`useRef`** : Stocke une référence mutable qui persiste entre les renders
  - Ex: `wsRef.current` garde la référence de la connexion WebSocket

### Gestion d'état :

- **État local** : Chaque card gère son propre état (isOn, volume, etc.)
- **État global** : App.jsx gère l'état de l'application (selectedZone, activeCategory, isConnected)
- **Props drilling** : Les fonctions et valeurs sont passées comme props aux composants enfants

### Communication entre composants :

- **Header → App** : `onZoneSelect(zone)` change `selectedZone`
- **Footer → App** : `onCategoryChange(category)` change `activeCategory`
- **Card → App** : `onCommand(type, id, value)` envoie une commande
- **App → Card** : `isConnected` indique l'état de connexion

---

C'est tout ! 🎉

Si tu as des questions sur un point précis, n'hésite pas à demander !

