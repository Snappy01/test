import { useState, useEffect, useRef } from 'react'
import { Card, CardBody, Switch, Slider, Button } from '@heroui/react'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useDeviceFeedback } from '../hooks/useDeviceFeedback'
import TextType from './TextType'

/**
 * COMPOSANT CARD POUR L'AUDIO
 * 
 * Gère :
 * - Le volume (slider 0-100%)
 * - Le niveau de basse/subwoofer (slider 0-100%)
 * - Le mute ON/OFF
 * - La synchronisation avec les feedbacks du serveur
 * 
 * Feedbacks utilisés (via useDeviceFeedback) :
 * - ID de volume : Volume actuel
 * - ID de subwoofer_level : Niveau de basse
 * - ID de mute_on : État mute activé
 * - ID de mute_off : État mute désactivé
 */
const AudioCard = ({ device }) => {
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
  
  const [volume, setVolume] = useState(50)
  const [bass, setBass] = useState(50)
  const [isMuted, setIsMuted] = useState(false)
  
  // Refs pour savoir si l'utilisateur est en train d'utiliser les sliders
  // Si true, on ignore les feedbacks du serveur pour éviter les conflits
  const isDraggingVolumeRef = useRef(false)
  const isDraggingBassRef = useRef(false)
  const dragVolumeValueRef = useRef(null)
  const dragBassValueRef = useRef(null)

  // ============================================================
  // EXTRACTION DES IDs DU DEVICE
  // ============================================================
  
  const volumeId = device.commands?.ushort?.volume
  const bassId = device.commands?.ushort?.subwoofer_level
  const muteOnId = device.commands?.digital?.mute_on
  const muteOffId = device.commands?.digital?.mute_off

  // ============================================================
  // SYNCHRONISATION AVEC LES FEEDBACKS DU SERVEUR
  // ============================================================
  
  /**
   * Synchronise l'état local avec les feedbacks reçus du serveur
   * Se déclenche quand feedbacks change (via useDeviceFeedback)
   * IGNORE les feedbacks si l'utilisateur est en train d'utiliser les sliders
   */
  useEffect(() => {
    // SI on est en train de drag, on ne fait RIEN (pas même de vérification)
    // Cela évite tout re-render inutile
    if (isDraggingVolumeRef.current || isDraggingBassRef.current) {
      return // Sortir immédiatement si on drag
    }

    // Vérifier le feedback de volume
    if (feedbacks[volumeId] && feedbacks[volumeId].type === 'ushort') {
      const feedbackValue = feedbacks[volumeId].value
      // Ne mettre à jour que si la valeur a vraiment changé
      if (feedbackValue !== volume) {
        setVolume(feedbackValue)
        console.log(`Feedback pour ${device.Name} volume:`, feedbackValue)
      }
    }

    // Vérifier le feedback de basse
    if (feedbacks[bassId] && feedbacks[bassId].type === 'ushort') {
      const feedbackValue = feedbacks[bassId].value
      // Ne mettre à jour que si la valeur a vraiment changé
      if (feedbackValue !== bass) {
        setBass(feedbackValue)
        console.log(`Feedback pour ${device.Name} bass:`, feedbackValue)
      }
    }

    // Vérifier le feedback mute_on
    if (feedbacks[muteOnId] && feedbacks[muteOnId].type === 'digital') {
      const feedbackValue = feedbacks[muteOnId].value
      setIsMuted(feedbackValue)
      // Si mute activé, mettre le slider à 0 visuellement (mais le slider reste utilisable)
      if (feedbackValue && !isDraggingVolumeRef.current) {
        setVolume(0)
      }
      console.log(`Feedback pour ${device.Name} mute_on:`, feedbackValue)
    }

    // Vérifier le feedback mute_off
    if (feedbacks[muteOffId] && feedbacks[muteOffId].type === 'digital') {
      // mute_off true = mute désactivé (donc !value)
      const feedbackValue = feedbacks[muteOffId].value
      setIsMuted(!feedbackValue)
      console.log(`Feedback pour ${device.Name} mute_off:`, feedbackValue)
    }
  }, [feedbacks, volumeId, bassId, muteOnId, muteOffId, device.Name, volume, bass])

  // ============================================================
  // HANDLERS D'INTERACTION UTILISATEUR
  // ============================================================
  
  /**
   * Gère le début de l'interaction avec le slider de volume
   */
  const handleVolumeDragStart = () => {
    isDraggingVolumeRef.current = true
    dragVolumeValueRef.current = volume
  }

  /**
   * Gère la fin de l'interaction avec le slider de volume
   */
  const handleVolumeDragEnd = () => {
    isDraggingVolumeRef.current = false
    dragVolumeValueRef.current = null
  }

  /**
   * Gère le changement de volume
   * @param {number} value - Nouvelle valeur de volume (0-100)
   */
  const handleVolumeChange = (value) => {
    setVolume(value)
    if (device.commands?.ushort?.volume) {
      sendCommand('ushort', device.commands.ushort.volume, value)
    }
  }

  /**
   * Gère le début de l'interaction avec le slider de basse
   */
  const handleBassDragStart = () => {
    isDraggingBassRef.current = true
    dragBassValueRef.current = bass
  }

  /**
   * Gère la fin de l'interaction avec le slider de basse
   */
  const handleBassDragEnd = () => {
    isDraggingBassRef.current = false
    dragBassValueRef.current = null
  }

  /**
   * Gère le changement de basse
   * @param {number} value - Nouvelle valeur de basse (0-100)
   */
  const handleBassChange = (value) => {
    setBass(value)
    if (device.commands?.ushort?.subwoofer_level) {
      sendCommand('ushort', device.commands.ushort.subwoofer_level, value)
    }
  }

  /**
   * Gère le toggle MUTE
   */
  const handleMuteToggle = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    
    if (device.commands?.digital) {
      // Envoyer la commande mute_on ou mute_off selon l'état
      const command = newMutedState ? device.commands.digital.mute_on : device.commands.digital.mute_off
      if (command) {
        sendCommand('digital', command, null)
      }
    }
  }

  // ============================================================
  // RENDU
  // ============================================================
  
  return (
    <Card className="bg-white dark:bg-blue-800/50 border border-gray-200 dark:border-blue-600/50">
      <CardBody className="p-4">
        <div className="flex flex-col gap-4">
          {/* En-tête avec nom et bouton MUTE */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate flex-1">
            <TextType
                text={device.Name}
                typingSpeed={50}
                initialDelay={100}
                loop={false}
                showCursor={false}

              />
            </h3>
            <Button
              onPress={handleMuteToggle}
              color={isMuted || volume === 0 ? "danger" : "success"}
              variant="flat"
              size="sm"
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              <span className="hidden sm:inline">
                {isMuted || volume === 0 ? '🔇 MUTE' : '🔊 UNMUTE'}
              </span>
              <span className="sm:hidden">
                {isMuted || volume === 0 ? '🔇' : '🔊'}
              </span>
            </Button>
          </div>
          
          {/* Slider de volume (si disponible) */}
          {device.commands?.ushort?.volume !== undefined && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Volume</span>
                <span>{volume}%</span>
              </div>
              <Slider
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                onChangeStart={handleVolumeDragStart}
                onChangeEnd={handleVolumeDragEnd}
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

          {/* Slider de basse/subwoofer (si disponible) */}
          {device.commands?.ushort?.subwoofer_level !== undefined && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Bass</span>
                <span>{bass}%</span>
              </div>
              <Slider
                value={bass}
                onChange={handleBassChange}
                onChangeStart={handleBassDragStart}
                onChangeEnd={handleBassDragEnd}
                minValue={0}
                maxValue={100}
                step={1}
                color="secondary"
                className="max-w-full"
                classNames={{
                  track: "border-s-blue-300",
                  filler: "bg-gradient-to-r from-purple-500 to-purple-400"
                }}
              />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

export default AudioCard
