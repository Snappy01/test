import { useState, useEffect, useRef } from 'react'
import { Card, CardBody } from '@heroui/react'
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

function App() {
  const [selectedZone, setSelectedZone] = useState(null)
  const [activeCategory, setActiveCategory] = useState('Lights')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [wsUrl, setWsUrl] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef(null)
  const [roomData, setRoomData] = useState(null)
  const [lightPresetTrigger, setLightPresetTrigger] = useState(null)
  const [lightPresetValue, setLightPresetValue] = useState(null)
  const [latestFeedback, setLatestFeedback] = useState(null) // Dernier feedback reçu : { action, id, type, value, timestamp }
  const [theme, setTheme] = useState(() => {
    // Récupérer depuis localStorage ou 'dark' par défaut
    return localStorage.getItem('theme') || 'dark'
  })

  // Charger la config quand une zone est sélectionnée
  useEffect(() => {
    if (selectedZone && roomConfig[selectedZone]) {
      const config = roomConfig[selectedZone]
      setRoomData(config)
      setWsUrl(config.wsUrl || '')
    } else {
      setRoomData(null)
    }
  }, [selectedZone])

  // Appliquer le thème au chargement et quand il change
  useEffect(() => {
    const root = document.documentElement // <html>
    
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // Sauvegarder dans localStorage
    localStorage.setItem('theme', theme)
  }, [theme])

  // Fonction pour changer le thème
  const handleThemeChange = (newTheme) => {
    setTheme(newTheme)
  }

  // Gestion WebSocket
  const handleConnect = () => {
    if (!wsUrl) return
    
    try {
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('WebSocket connecté')
        setIsConnected(true)
        wsRef.current = ws
      }
      
      ws.onerror = (error) => {
        console.error('Erreur WebSocket:', error)
        setIsConnected(false)
      }
      
      ws.onclose = () => {
        console.log('WebSocket déconnecté')
        setIsConnected(false)
        wsRef.current = null
      }
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log('Message reçu:', message)
          
          // Gérer les feedbacks du serveur
          if (message.action === 'action_feedback') {
            // Envoyer le feedback à tous les composants (broadcast)
            setLatestFeedback({
              ...message,
              timestamp: Date.now() // Pour forcer la mise à jour même si la valeur est la même
            })
            console.log('Feedback reçu et broadcast:', message)
          }
        } catch (error) {
          console.error('Erreur lors du parsing du message:', error)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la connexion:', error)
      setIsConnected(false)
    }
  }

  const handleDisconnect = () => {
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    setIsConnected(false)
  }

  // Nettoyer la connexion WebSocket au démontage
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  // Envoyer une commande via WebSocket
  const handleCommand = (type, commandId, value) => {
    if (!isConnected || !wsRef.current) {
      console.warn('WebSocket non connecté - commande simulée:', { type, commandId, value })
      return
    }

    const message = {
      type,
      command: commandId,
      value: value !== null ? value : undefined
    }

    try {
      wsRef.current.send(JSON.stringify(message))
      console.log('Commande envoyée:', message)
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la commande:', error)
    }
  }

  // Mapper les catégories
  const categoryMap = {
    'Lights': 'Lights',
    'Blinds': 'Blinds',
    'AudioZones': 'AudioZones',
    'ACs': 'ACs'
  }

  // Obtenir les devices de la catégorie active
  const getActiveDevices = () => {
    if (!roomData || !roomData.devices) return []
    const categoryKey = categoryMap[activeCategory]
    return roomData.devices[categoryKey] || []
  }

  const activeDevices = getActiveDevices()

  // Obtenir les presets de lumières
  const getLightPresets = () => {
    if (!roomData || !roomData.devices) return null
    return roomData.devices.lightPresets?.[0] || null
  }

  const lightPresets = getLightPresets()

  // Gérer la sélection d'un preset de lumière
  const handleLightPresetSelect = (presetName, commandId) => {
    if (isConnected) {
      // Mode connecté : envoyer directement la commande au serveur
      handleCommand('digital', commandId, null)
    } else {
      // Mode simulation : appliquer les valeurs manuellement
      const presetValues = {
        'Morning': 80,
        'Afternoon': 60,
        'Evening': 20,
        'Off': 0
      }
      
      const value = presetValues[presetName]
      if (value !== undefined) {
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
                    onCommand={handleCommand}
                    isConnected={isConnected}
                    presetValue={lightPresetValue}
                    presetTrigger={lightPresetTrigger}
                    latestFeedback={latestFeedback}
                  />
                )
            case 'Blinds':
              return (
                <BlindsCard
                  key={`${device.Name}-${index}`}
                  device={device}
                  onCommand={handleCommand}
                  isConnected={isConnected}
                  latestFeedback={latestFeedback}
                />
              )
            case 'AudioZones':
              return (
                <AudioCard
                  key={`${device.Name}-${index}`}
                  device={device}
                  onCommand={handleCommand}
                  isConnected={isConnected}
                  latestFeedback={latestFeedback}
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
                  onCommand={handleCommand}
                  isConnected={isConnected}
                  latestFeedback={latestFeedback}
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
