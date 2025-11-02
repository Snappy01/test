import { useState, useEffect } from 'react'
import { Card, CardBody, Spinner } from '@heroui/react'
import { useWebSocket } from './contexts/WebSocketContext'
import { feedbackStore } from './stores/FeedbackStore'
import Header from './components/Header'
import Footer from './components/Footer'
import Settings from './components/Settings'
import LightsCard from './components/LightsCard'
import BlindsCard from './components/BlindsCard'
import AudioCard from './components/AudioCard'
import HVACCard from './components/HVACCard'
import LightsPresets from './components/LightsPresets'
import './App.css'

/**
 * URL de base pour charger les fichiers de configuration des zones
 * Permet de charger les configs depuis public/config/ via HTTP
 * 
 * Pour changer la source plus tard (CDN, API, etc.), modifier cette constante
 * ou utiliser une variable d'environnement : import.meta.env.VITE_CONFIG_BASE_URL
 */
const CONFIG_BASE_URL = import.meta.env.VITE_CONFIG_BASE_URL || '/test/config'

/**
 * COMPOSANT PRINCIPAL DE L'APPLICATION
 * 
 * Gère :
 * - La sélection de zone
 * - La navigation par catégorie
 * - Le thème dark/light
 * - Les presets de lumières
 * - La configuration WebSocket (URL uniquement, connexion gérée par Context)
 */
function App() {
  // ============================================================
  // ÉTATS LOCAUX
  // ============================================================
  
  const [selectedZone, setSelectedZone] = useState(null)
  const [activeCategory, setActiveCategory] = useState('Lights')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [wsUrl, setWsUrl] = useState('')
  const [roomData, setRoomData] = useState(null)
  const [isLoadingZone, setIsLoadingZone] = useState(false)
  
  // États pour les presets de lumières
  const [lightPresetTrigger, setLightPresetTrigger] = useState(null)
  const [lightPresetValue, setLightPresetValue] = useState(null)
  
  // Données des zones chargées depuis zones.json
  const [zonesData, setZonesData] = useState([])
  
  // Mapping displayName → zoneId (créé au démarrage)
  const [zoneIdMap, setZoneIdMap] = useState(null)
  
  // Thème dark/light (persisté dans localStorage)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark'
  })

  // ============================================================
  // RÉCUPÉRATION DU CONTEXT WEBSOCKET
  // ============================================================
  
  // Récupérer les fonctions et l'état du WebSocketContext
  // Ces fonctions sont partagées par tous les composants via le Context
  const { sendCommand, connect, disconnect, isConnected } = useWebSocket()

  // ============================================================
  // CHARGEMENT DE ZONES.JSON
  // ============================================================
  
  /**
   * Charge zones.json au démarrage de l'application via fetch()
   * Ce fichier contient la liste de toutes les zones disponibles
   */
  useEffect(() => {
    const loadZones = async () => {
      try {
        const response = await fetch(`${CONFIG_BASE_URL}/zones.json`)
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}: Impossible de charger zones.json`)
        }
        const data = await response.json()
        setZonesData(data)
      } catch (error) {
        console.error('Erreur lors du chargement de zones.json:', error)
        // En cas d'erreur, zonesData reste un tableau vide
        setZonesData([])
      }
    }

    loadZones()
  }, [])

  // ============================================================
  // INITIALISATION DU MAPPING DISPLAYNAME → ZONEID
  // ============================================================
  
  /**
   * Crée le mapping displayName → zoneId une fois que zonesData est chargé
   * Ce mapping permet de trouver le zoneId à partir du displayName (selectedZone)
   */
  useEffect(() => {
    if (zonesData.length === 0) {
      // Pas encore chargé ou erreur
      return
    }

    const map = {}
    zonesData.forEach(zone => {
      map[zone.displayName] = zone.zoneId
    })
    setZoneIdMap(map)
  }, [zonesData])
  
  // ============================================================
  // CHARGEMENT DE LA CONFIGURATION DE LA ZONE
  // ============================================================
  
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
        // Déconnecter de l'ancienne zone (silent = true pour éviter la notification)
        // et vider le FeedbackStore
        disconnect(true)
        feedbackStore.clear()
        
        // Trouver la zone dans zonesData pour récupérer le fileName
        const zoneInfo = zonesData.find(zone => zone.zoneId === zoneId)
        if (!zoneInfo || !zoneInfo.fileName) {
          throw new Error(`Zone ou fileName non trouvé pour zoneId: ${zoneId}`)
        }
        
        // Charger dynamiquement le fichier JSON via HTTP (fileName contient déjà l'extension .json)
        const configUrl = `${CONFIG_BASE_URL}/${zoneInfo.fileName}`
        const response = await fetch(configUrl)
        
        // Vérifier que la requête HTTP a réussi
        if (!response.ok) {
          throw new Error(`Erreur HTTP ${response.status}: Impossible de charger ${configUrl}`)
        }
        
        // Parser la réponse JSON
        const config = await response.json()
        
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

  // ============================================================
  // GESTION DU THÈME
  // ============================================================
  
  /**
   * Applique le thème au chargement et quand il change
   * Ajoute/retire la classe 'dark' sur <html> et sauvegarde dans localStorage
   * Met à jour la meta tag theme-color pour correspondre au header
   */
  useEffect(() => {
    const root = document.documentElement // <html>
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Sauvegarder dans localStorage pour persister entre les sessions
    localStorage.setItem('theme', theme)
    
    // Mettre à jour la meta tag theme-color pour correspondre au fond du MainContent
    // bg-gray-50 (light) = #f9fafb, bg-blue-900 (dark) =rgb(16, 33, 78)
    const themeColor = theme === 'dark' ? '#011631' : '#f9fafb'
    let themeColorMeta = document.querySelector('meta[name="theme-color"]')
    
    if (!themeColorMeta) {
      // Créer la meta tag si elle n'existe pas
      themeColorMeta = document.createElement('meta')
      themeColorMeta.setAttribute('name', 'theme-color')
      document.head.appendChild(themeColorMeta)
    }
    
    // Mettre à jour la couleur
    themeColorMeta.setAttribute('content', themeColor)
  }, [theme])

  /**
   * Fonction pour changer le thème
   * @param {string} newTheme - 'dark' ou 'light'
   */
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
  }

  // ============================================================
  // GESTION DE LA CONNEXION WEBSOCKET
  // ============================================================
  
  /**
   * Gère la connexion WebSocket
   * Utilise la fonction connect() du WebSocketContext
   */
  const handleConnect = () => {
    if (!wsUrl) {
      console.warn('URL WebSocket manquante')
      return
    }
    // La connexion est gérée par le WebSocketContext
    connect(wsUrl)
  }

  /**
   * Gère la déconnexion WebSocket
   * Utilise la fonction disconnect() du WebSocketContext
   */
  const handleDisconnect = () => {
    disconnect()
  }

  // ============================================================
  // GESTION DES COMMANDES
  // ============================================================
  
  /**
   * Envoie une commande au serveur via WebSocket
   * Utilise la fonction sendCommand() du WebSocketContext
   * 
   * @param {string} type - Type de commande: 'digital', 'ushort', ou 'string'
   * @param {number} commandId - ID de la commande
   * @param {*} value - Valeur de la commande (null pour digital)
   */
  const handleCommand = (type, commandId, value) => {
    // La fonction sendCommand du Context gère déjà le mode offline
    sendCommand(type, commandId, value)
  }

  // ============================================================
  // MAPPING DES CATÉGORIES
  // ============================================================
  
  /**
   * Mappe les noms de catégories de l'UI vers les clés dans roomConfig.json
   */
  const categoryMap = {
    'Lights': 'Lights',
    'Blinds': 'Blinds',
    'AudioZones': 'AudioZones',
    'ACs': 'ACs'
  }

  // ============================================================
  // RÉCUPÉRATION DES DEVICES ET PRESETS
  // ============================================================
  
  /**
   * Récupère les devices de la catégorie active
   * @returns {Array} - Liste des devices de la catégorie active
   */
  const getActiveDevices = () => {
    if (!roomData || !roomData.devices) return []
    const categoryKey = categoryMap[activeCategory]
    return roomData.devices[categoryKey] || []
  }

  const activeDevices = getActiveDevices()

  /**
   * Récupère les presets de lumières pour la zone active
   * @returns {Object|null} - Configuration des presets ou null
   */
  const getLightPresets = () => {
    if (!roomData || !roomData.devices) return null
    return roomData.devices.lightPresets?.[0] || null
  }

  const lightPresets = getLightPresets()

  // ============================================================
  // GESTION DES PRESETS DE LUMIÈRES
  // ============================================================
  
  /**
   * Gère la sélection d'un preset de lumière
   * 
   * Mode connecté : envoie directement la commande au serveur
   * Mode offline : applique les valeurs manuellement aux devices
   * 
   * @param {string} presetName - Nom du preset: 'Morning', 'Afternoon', 'Evening', 'Off'
   * @param {number} commandId - ID de la commande du preset
   */
  const handleLightPresetSelect = (presetName, commandId) => {
    if (isConnected) {
      // Mode connecté : le serveur gère le preset
      // Envoie uniquement la commande du preset
      handleCommand('digital', commandId, null)
    } else {
      // Mode simulation : applique les valeurs manuellement
      const presetValues = {
        'Morning': 80,
        'Afternoon': 60,
        'Evening': 20,
        'Off': 0
      }
      
      const value = presetValues[presetName]
      if (value !== undefined) {
        // Déclencher la mise à jour des composants LightsCard via les props
        setLightPresetValue(value)
        setLightPresetTrigger(prev => (prev === null ? 0 : prev + 1))
        
        // Appliquer à tous les devices Lights
        const lightsDevices = roomData.devices.Lights || []
        lightsDevices.forEach(device => {
          if (device.commands?.ushort?.intensity) {
            if (value === 0) {
              // Off : power_off + intensité 0
              if (device.commands?.digital?.power_off) {
                handleCommand('digital', device.commands.digital.power_off, null)
              }
              handleCommand('ushort', device.commands.ushort.intensity, 0)
            } else {
              // On : power_on + intensité
              if (device.commands?.digital?.power_on) {
                handleCommand('digital', device.commands.digital.power_on, null)
              }
              handleCommand('ushort', device.commands.ushort.intensity, value)
            }
          }
        })
      }
    }
  }

  // Rendre les cards selon la catégorie
  const renderDeviceCards = () => {
    if (!selectedZone) {
      return (
        <div className="flex items-center justify-center h-full">
          <Card className="bg-white dark:bg-blue-800/50 border border-gray-200 dark:border-blue-600/50">
            <CardBody className="p-8">
              <p className="text-gray-600 dark:text-gray-400 text-center text-lg">
                Veuillez sélectionner une zone pour commencer
              </p>
            </CardBody>
          </Card>
        </div>
      )
    }
    
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

    if (activeDevices.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <Card className="bg-white dark:bg-blue-800/50 border border-gray-200 dark:border-blue-600/50">
            <CardBody className="p-8">
              <p className="text-gray-600 dark:text-gray-400 text-center text-lg">
                Aucun appareil {activeCategory.toLowerCase()} disponible dans cette zone
              </p>
            </CardBody>
          </Card>
        </div>
      )
    }

    return (
      <>
        {/* Presets pour les lumières */}
        {activeCategory === 'Lights' && lightPresets && (
          <LightsPresets
            presets={lightPresets}
            onPresetSelect={handleLightPresetSelect}
            isConnected={isConnected}
          />
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4">
          {activeDevices.map((device, index) => {
            switch (activeCategory) {
              case 'Lights':
                return (
                  <LightsCard
                    key={`${device.Name}-${index}`}
                    device={device}
                    presetValue={lightPresetValue}
                    presetTrigger={lightPresetTrigger}
                    // Note: onCommand, isConnected et latestFeedback ne sont plus passés
                    // Ils sont maintenant récupérés via useWebSocket() et useDeviceFeedback()
                  />
                )
            case 'Blinds':
              return (
                <div className='justify-items-center'>
                <BlindsCard
                  key={`${device.Name}-${index}`}
                  device={device}
                  // Note: onCommand, isConnected et latestFeedback ne sont plus passés
                  // Ils sont maintenant récupérés via useWebSocket() et useDeviceFeedback()
                />
                </div>
              )
            case 'AudioZones':
              return (
                <AudioCard
                  key={`${device.Name}-${index}`}
                  device={device}
                  // Note: onCommand, isConnected et latestFeedback ne sont plus passés
                  // Ils sont maintenant récupérés via useWebSocket() et useDeviceFeedback()
                />
              )
            case 'ACs':
              return (
                <div 
                key={`${device.Name}-${index}`}
                className={activeDevices.length === 1 ? 'col-span-full flex justify-center' : ''}
              >
                <HVACCard
                  key={`${device.Name}-${index}`}
                  device={device}
                  // Note: onCommand, isConnected et latestFeedback ne sont plus passés
                  // Ils sont maintenant récupérés via useWebSocket() et useDeviceFeedback()
                />
                </div>
              )
            default:
              return null
          }
        })}
      </div>
      </>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-blue-900">
      <Header
        selectedZone={selectedZone}
        onZoneSelect={setSelectedZone}
        onSettingsOpen={setIsSettingsOpen}
        zonesData={zonesData}
      />

      {/* Zone de contenu principale - scrollable */}
      <main className="flex-1 overflow-y-auto pb-24 sm:pb-20">
        {renderDeviceCards()}
      </main>

      {/* Footer avec navigation */}
      <Footer
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
      />

      {/* Modal Settings */}
      <Settings
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        wsUrl={wsUrl}
        onWsUrlChange={setWsUrl}
        onConnect={handleConnect}
        onDisconnect={handleDisconnect}
        isConnected={isConnected}
        theme={theme}
        onThemeChange={handleThemeChange}
      />
    </div>
  )
}

export default App
