import { useState, useEffect, useRef } from 'react'
import { Card, CardBody, Switch, Slider } from '@heroui/react'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useDeviceFeedback } from '../hooks/useDeviceFeedback'

/**
 * COMPOSANT CARD POUR LES LUMIÈRES
 * 
 * Gère :
 * - L'état ON/OFF de la lumière
 * - L'intensité de la lumière (slider 0-100%)
 * - La synchronisation avec les feedbacks du serveur
 * - L'application des presets externes
 * 
 * Feedbacks utilisés (via useDeviceFeedback) :
 * - ID de power_on : État ON/OFF
 * - ID de power_off : État ON/OFF
 * - ID de intensity : Intensité (0-100)
 */
const LightsCard = ({ device, presetValue, presetTrigger }) => {
  // ============================================================
  // RÉCUPÉRATION DU CONTEXT ET DES FEEDBACKS
  // ============================================================
  
  // Récupérer les fonctions du WebSocketContext
  const { sendCommand, isConnected } = useWebSocket()
  
  // Récupérer les feedbacks pour ce device depuis le store
  // feedbacks = { [id]: { id, type, value, timestamp } }
  // Exemple: { 10: { id: 10, type: "ushort", value: 75, ... }, 19: { id: 19, ... }, ... }
  const feedbacks = useDeviceFeedback(device)

  // ============================================================
  // ÉTAT LOCAL POUR L'UI
  // ============================================================
  
  const [isOn, setIsOn] = useState(false)
  const [intensity, setIntensity] = useState(50) // Valeur affichée dans le slider
  
  // Ref pour savoir si l'utilisateur est en train d'utiliser le slider
  // Si true, on ignore les feedbacks du serveur pour éviter les conflits
  const isDraggingIntensityRef = useRef(false)
  
  // Valeur temporaire pendant le drag (pour éviter les re-renders inutiles)
  const dragValueRef = useRef(null)

  // ============================================================
  // EXTRACTION DES IDs DU DEVICE
  // ============================================================
  
  // Extraire les IDs des commandes pour savoir quels feedbacks nous intéressent
  const intensityId = device.commands?.ushort?.intensity    // Ex: 10
  const powerOnId = device.commands?.digital?.power_on       // Ex: 19
  const powerOffId = device.commands?.digital?.power_off     // Ex: 20

  // ============================================================
  // SYNCHRONISATION AVEC LES FEEDBACKS DU SERVEUR
  // ============================================================
  
  /**
   * Synchronise l'état local avec les feedbacks reçus du serveur
   * Se déclenche quand feedbacks change (via useDeviceFeedback)
   * IGNORE les feedbacks si l'utilisateur est en train d'utiliser le slider
   */
  useEffect(() => {
    // SI on est en train de drag, on ne fait RIEN (pas même de vérification)
    // Cela évite tout re-render inutile
    if (isDraggingIntensityRef.current) {
      return // Sortir immédiatement, ne rien faire
    }

    // Vérifier le feedback d'intensité (ID 10 par exemple)
    if (feedbacks[intensityId]) {
      // feedbacks[10] = { id: 10, type: "ushort", value: 75, ... }
      const feedbackValue = feedbacks[intensityId].value
      
      // Ne mettre à jour que si la valeur a vraiment changé (optimisation)
      if (feedbackValue !== intensity) {
        setIntensity(feedbackValue)  // Mettre à jour l'intensité
        setIsOn(feedbackValue > 0)   // Switch ON si intensité > 0
      }
    }

    // Vérifier le feedback power_on (ID 19 par exemple)
    if (feedbacks[powerOnId]?.value === true) {
      setIsOn(true)
    }

    // Vérifier le feedback power_off (ID 20 par exemple)
    if (feedbacks[powerOffId]?.value === true) {
      setIsOn(false)     
    }
  }, [feedbacks, intensityId, powerOnId, powerOffId, intensity])

  // ============================================================
  // GESTION DES PRESETS EXTERNES
  // ============================================================
  
  /**
   * Applique un preset externe (depuis LightsPresets)
   * Se déclenche quand presetTrigger ou presetValue change
   */
  useEffect(() => {
    if (presetTrigger !== null && presetValue !== null && presetValue !== undefined) {
      const newIntensity = presetValue
      setIntensity(newIntensity)
      setIsOn(newIntensity > 0)
      
      // Envoyer les commandes au serveur
      if (device.commands?.digital && device.commands?.ushort?.intensity) {
        if (newIntensity === 0) {
          // Off : power_off + intensité 0
          sendCommand('digital', device.commands.digital.power_off, null)
        } else {
          // On : power_on + intensité
          sendCommand('digital', device.commands.digital.power_on, null)
        }
        sendCommand('ushort', device.commands.ushort.intensity, newIntensity)
      }
    }
  }, [presetTrigger, presetValue, device, sendCommand])

  // ============================================================
  // HANDLERS D'INTERACTION UTILISATEUR
  // ============================================================
  
  /**
   * Gère le toggle ON/OFF de la lumière
   */
  const handleToggle = () => {
    const newState = !isOn
    setIsOn(newState)
    
    if (device.commands?.digital && device.commands?.ushort?.intensity) {
      if (newState) {
        // Switch ON : slider à 50% + envoie power_on + intensité 50
        setIntensity(50)
        sendCommand('digital', device.commands.digital.power_on, null)
        sendCommand('ushort', device.commands.ushort.intensity, 50)
      } else {
        // Switch OFF : slider à 0% + envoie power_off + intensité 0
        setIntensity(0)
        sendCommand('digital', device.commands.digital.power_off, null)
        sendCommand('ushort', device.commands.ushort.intensity, 0)
      }
    }
  }

  /**
   * Gère le début de l'interaction avec le slider
   * Active le flag pour ignorer les feedbacks pendant le drag
   */
  const handleIntensityDragStart = () => {
    isDraggingIntensityRef.current = true
    dragValueRef.current = intensity // Sauvegarder la valeur de départ
  }

  /**
   * Gère la fin de l'interaction avec le slider
   * Désactive le flag pour réécouter les feedbacks
   */
  const handleIntensityDragEnd = () => {
    isDraggingIntensityRef.current = false
    dragValueRef.current = null // Réinitialiser
  }

  /**
   * Gère le changement d'intensité via le slider
   * @param {number} value - Nouvelle valeur d'intensité (0-100)
   */
  const handleIntensityChange = (value) => {
    setIntensity(value)
    
    // Synchronisation visuelle du switch avec le slider
    if (value === 0) {
      setIsOn(false) // Slider à 0 → switch OFF visuellement
    } else if (value > 0 && !isOn) {
      setIsOn(true) // Slider > 0 et switch était OFF → switch ON visuellement
    }
    
    // Envoyer SEULEMENT la commande d'intensité (jamais power_on/off)
    if (device.commands?.ushort?.intensity) {
      sendCommand('ushort', device.commands.ushort.intensity, value)
    }
  }

  // ============================================================
  // RENDU
  // ============================================================
  
  return (
    <Card className="bg-white dark:bg-blue-800/50 border border-gray-200 dark:border-blue-600/50">
      <CardBody className="p-4">
        <div className="flex flex-col gap-4">
          {/* En-tête avec nom et switch ON/OFF */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate flex-1">
              {device.Name}
            </h3>
            <Switch
              isSelected={isOn}
              onValueChange={handleToggle}
              color="success"
              size="sm"
              classNames={{
                label: "text-gray-900 dark:text-white text-xs sm:text-sm"
              }}
            >
              <span className="text-gray-900 dark:text-white text-xs sm:text-sm whitespace-nowrap">
                {isOn ? 'ON' : 'OFF'}
              </span>
            </Switch>
          </div>
          
          {/* Slider d'intensité (si disponible) */}
          {device.commands?.ushort?.intensity && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Intensité</span>
                <span>{intensity}%</span>
              </div>
              <Slider
                value={intensity}
                onChange={handleIntensityChange}
                onChangeStart={handleIntensityDragStart}
                onChangeEnd={handleIntensityDragEnd}
                minValue={0}
                maxValue={100}
                step={1}
                color="primary"
                className="max-w-full"
                classNames={{
                  track: "border-s-blue-300",
                  filler: "bg-gradient-to-r from-blue-500 to-blue-400"
                }}
              />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

export default LightsCard
