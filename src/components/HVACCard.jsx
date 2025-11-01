import { useState, useEffect, useRef } from 'react'
import { Card, CardBody, Slider, Button, ButtonGroup } from '@heroui/react'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useDeviceFeedback } from '../hooks/useDeviceFeedback'

/**
 * COMPOSANT CARD POUR LA CLIMATISATION (HVAC)
 * 
 * Gère :
 * - La température cible (slider 16-30°C)
 * - La température actuelle (lecture seule)
 * - Les boutons de réglage rapide (-1°, -0.5°, +0.5°, +1°)
 * - La synchronisation avec les feedbacks du serveur
 * 
 * Feedbacks utilisés (via useDeviceFeedback) :
 * - ID de temperature : Température cible
 * - ID de current_temperature : Température actuelle (lecture seule)
 */
const HVACCard = ({ device }) => {
  // ============================================================
  // RÉCUPÉRATION DU CONTEXT ET DES FEEDBACKS
  // ============================================================
  
  // Récupérer les fonctions du WebSocketContext
  const { sendCommand, isConnected } = useWebSocket()
  
  // Récupérer les feedbacks pour ce device depuis le store
  // feedbacks = { [id]: { id, type, value, timestamp } }
  const feedbacks = useDeviceFeedback(device)

  // ============================================================
  // ÉTAT LOCAL POUR L'UI
  // ============================================================
  
  const [currentTemp, setCurrentTemp] = useState(22)
  const [targetTemp, setTargetTemp] = useState(22)
  
  // Ref pour savoir si l'utilisateur est en train d'utiliser le slider
  // Si true, on ignore les feedbacks du serveur pour éviter les conflits
  const isDraggingTempRef = useRef(false)
  const dragTempValueRef = useRef(null)

  // ============================================================
  // EXTRACTION DES IDs DU DEVICE
  // ============================================================
  
  const temperatureId = device.commands?.ushort?.temperature
  const currentTemperatureId = device.commands?.ushort?.current_temperature

  // ============================================================
  // SYNCHRONISATION AVEC LES FEEDBACKS DU SERVEUR
  // ============================================================
  
  /**
   * Synchronise l'état local avec les feedbacks reçus du serveur
   * Se déclenche quand feedbacks change (via useDeviceFeedback)
   * IGNORE les feedbacks si l'utilisateur est en train d'utiliser le slider
   */
  useEffect(() => {
    // SI on est en train de drag, on ne fait RIEN pour la température cible
    // Cela évite tout re-render inutile
    if (!isDraggingTempRef.current) {
      // Vérifier le feedback de température cible
      if (feedbacks[temperatureId] && feedbacks[temperatureId].type === 'ushort') {
        const feedbackValue = feedbacks[temperatureId].value
        // Ne mettre à jour que si la valeur a vraiment changé
        if (feedbackValue !== targetTemp) {
          setTargetTemp(feedbackValue)
          console.log(`Feedback pour ${device.Name} température cible:`, feedbackValue)
        }
      }
    }

    // La température actuelle peut toujours être mise à jour (lecture seule)
    if (feedbacks[currentTemperatureId] && feedbacks[currentTemperatureId].type === 'ushort') {
      const feedbackValue = feedbacks[currentTemperatureId].value
      if (feedbackValue !== currentTemp) {
        setCurrentTemp(feedbackValue)
        console.log(`Feedback pour ${device.Name} température actuelle:`, feedbackValue)
      }
    }
  }, [feedbacks, temperatureId, currentTemperatureId, device.Name, targetTemp, currentTemp])

  // ============================================================
  // HANDLERS D'INTERACTION UTILISATEUR
  // ============================================================
  
  /**
   * Gère le début de l'interaction avec le slider
   */
  const handleTempDragStart = () => {
    isDraggingTempRef.current = true
    dragTempValueRef.current = targetTemp
  }

  /**
   * Gère la fin de l'interaction avec le slider
   */
  const handleTempDragEnd = () => {
    isDraggingTempRef.current = false
    dragTempValueRef.current = null
  }

  /**
   * Gère le changement de température cible via le slider
   * @param {number} value - Nouvelle température cible (16-30°C)
   */
  const handleTempChange = (value) => {
    setTargetTemp(value)
    if (device.commands?.ushort?.temperature) {
      sendCommand('ushort', device.commands.ushort.temperature, value)
    }
  }

  /**
   * Gère le réglage rapide de température
   * @param {number} delta - Variation de température (-1, -0.5, +0.5, +1)
   */
  const handleQuickTemp = (delta) => {
    // Calculer la nouvelle température (bornée entre 16 et 30°C)
    const newTemp = Math.max(16, Math.min(30, targetTemp + delta))
    setTargetTemp(newTemp)
    
    if (device.commands?.ushort?.temperature) {
      sendCommand('ushort', device.commands.ushort.temperature, newTemp)
    }
  }

  // ============================================================
  // RENDU
  // ============================================================
  
  return (
    <Card className="bg-white dark:bg-blue-800/50 border border-gray-200 dark:border-blue-600/50">
      <CardBody className="p-4">
        <div className="flex flex-col gap-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white text-center">
            {device.Name}
          </h3>
          
          {/* Affichage des températures actuelle et cible */}
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Actuelle</span>
              <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {currentTemp}°C
              </span>
            </div>
            <div className="text-gray-400 dark:text-gray-500">→</div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-500 dark:text-gray-400">Cible</span>
              <span className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                {targetTemp}°C
              </span>
            </div>
          </div>

          {/* Slider de température cible */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Température cible</span>
              <span>{targetTemp}°C</span>
            </div>
            <Slider
              value={targetTemp}
              onChange={handleTempChange}
              onChangeStart={handleTempDragStart}
              onChangeEnd={handleTempDragEnd}
              minValue={16}
              maxValue={30}
              step={0.5}
              color="warning"
              className="max-w-full"
              classNames={{
                track: "border-s-orange-300",
                filler: "bg-gradient-to-r from-orange-500 to-orange-400"
              }}
              marks={[
                { value: 16, label: '16°' },
                { value: 22, label: '22°' },
                { value: 30, label: '30°' }
              ]}
            />
          </div>

          {/* Boutons de réglage rapide */}
          <ButtonGroup className="w-full" variant="flat" color="warning" size="sm">
            <Button onPress={() => handleQuickTemp(-1)} className="flex-1 text-xs sm:text-sm">
              -1°
            </Button>
            <Button onPress={() => handleQuickTemp(-0.5)} className="flex-1 text-xs sm:text-sm">
              -0.5°
            </Button>
            <Button onPress={() => handleQuickTemp(0.5)} className="flex-1 text-xs sm:text-sm">
              +0.5°
            </Button>
            <Button onPress={() => handleQuickTemp(1)} className="flex-1 text-xs sm:text-sm">
              +1°
            </Button>
          </ButtonGroup>
        </div>
      </CardBody>
    </Card>
  )
}

export default HVACCard
