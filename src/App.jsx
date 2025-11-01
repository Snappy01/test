import { useState, useEffect } from 'react'
import { Card, CardBody } from '@heroui/react'
import { useWebSocket } from './contexts/WebSocketContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Settings from './components/Settings'
import LightsCard from './components/LightsCard'
import BlindsCard from './components/BlindsCard'
import AudioCard from './components/AudioCard'
import HVACCard from './components/HVACCard'
import LightsPresets from './components/LightsPresets'
import roomConfig from './config/roomConfig.json'
import './App.css'

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
  
  // États pour les presets de lumières
  const [lightPresetTrigger, setLightPresetTrigger] = useState(null)
  const [lightPresetValue, setLightPresetValue] = useState(null)
  
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
  // CHARGEMENT DE LA CONFIGURATION DE LA ZONE
  // ============================================================
  
  /**
   * Charge la configuration de la zone sélectionnée depuis roomConfig.json
   * Met à jour roomData et wsUrl quand la zone change
   * Connexion automatique si une URL est disponible
   */
  useEffect(() => {
    if (selectedZone && roomConfig[selectedZone]) {
      const config = roomConfig[selectedZone]
      setRoomData(config)
      const newWsUrl = config.wsUrl || ''
      setWsUrl(newWsUrl)
      
      // CONNEXION AUTOMATIQUE : Se connecter automatiquement si on a une URL
      if (newWsUrl) {
        // Attendre un peu pour que l'état soit mis à jour
        setTimeout(() => {
          connect(newWsUrl)
        }, 100)
      }
    } else {
      setRoomData(null)
      setWsUrl('')
      // Déconnecter si aucune zone n'est sélectionnée
      disconnect()
    }
    // Note: On n'inclut pas isConnected dans les dépendances pour éviter les boucles
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedZone, connect, disconnect])

  // ============================================================
  // GESTION DU THÈME
  // ============================================================
  
  /**
   * Applique le thème au chargement et quand il change
   * Ajoute/retire la classe 'dark' sur <html> et sauvegarde dans localStorage
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
    if (!roomData || !selectedZone) {
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
                <BlindsCard
                  key={`${device.Name}-${index}`}
                  device={device}
                  // Note: onCommand, isConnected et latestFeedback ne sont plus passés
                  // Ils sont maintenant récupérés via useWebSocket() et useDeviceFeedback()
                />
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
