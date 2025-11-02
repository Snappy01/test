import { useEffect } from 'react'
import { Card, CardBody, Button, ButtonGroup } from '@heroui/react'
import { useWebSocket } from '../contexts/WebSocketContext'
import { useDeviceFeedback } from '../hooks/useDeviceFeedback'
import { motion } from 'framer-motion'
import TextType from './TextType'
/**
 * COMPOSANT CARD POUR LES STORES/VOLETS
 * 
 * Gère :
 * - Les commandes UP / STOP / DOWN
 * - La synchronisation avec les feedbacks du serveur (si disponibles)
 * 
 * Feedbacks utilisés (via useDeviceFeedback) :
 * - ID de power_up : Commande montée
 * - ID de stop : Commande arrêt
 * - ID de power_down : Commande descente
 * 
 * Note: Les stores n'ont généralement pas de feedback de position,
 * mais on écoute les feedbacks au cas où le serveur en enverrait
 */
const BlindsCard = ({ device }) => {
  // ============================================================
  // RÉCUPÉRATION DU CONTEXT ET DES FEEDBACKS
  // ============================================================
  
  // Récupérer les fonctions du WebSocketContext
  const { sendCommand, isConnected } = useWebSocket()
  
  // Récupérer les feedbacks pour ce device depuis le store
  // feedbacks = { [id]: { id, type, value, timestamp } }
  const feedbacks = useDeviceFeedback(device)

  // ============================================================
  // EXTRACTION DES IDs DU DEVICE
  // ============================================================
  
  const powerUpId = device.commands?.digital?.power_up
  const powerDownId = device.commands?.digital?.power_down
  const stopId = device.commands?.digital?.stop

  // ============================================================
  // GESTION DES FEEDBACKS (optionnel pour les stores)
  // ============================================================
  
  /**
   * Gère les feedbacks reçus du serveur
   * Les stores n'ont généralement pas de feedback, mais on écoute au cas où
   */
  useEffect(() => {
    // Si un feedback est reçu pour un des IDs du store, on le log
    if (feedbacks[powerUpId] || feedbacks[powerDownId] || feedbacks[stopId]) {
      console.log(`Feedback pour ${device.Name}:`, {
        powerUp: feedbacks[powerUpId],
        powerDown: feedbacks[powerDownId],
        stop: feedbacks[stopId]
      })
      // Ici tu pourrais gérer l'état du store si nécessaire
      // Par exemple, afficher une icône "en mouvement" si feedback reçu
    }
  }, [feedbacks, powerUpId, powerDownId, stopId, device.Name])

  // ============================================================
  // HANDLERS D'INTERACTION UTILISATEUR
  // ============================================================
  
  /**
   * Gère la commande UP (monter le store)
   */
  const handleUp = () => {
    if (device.commands?.digital?.power_up) {
      sendCommand('digital', device.commands.digital.power_up, null)
    }
  }

  /**
   * Gère la commande STOP (arrêter le store)
   */
  const handleStop = () => {
    if (device.commands?.digital?.stop) {
      sendCommand('digital', device.commands.digital.stop, null)
    }
  }

  /**
   * Gère la commande DOWN (descendre le store)
   */
  const handleDown = () => {
    if (device.commands?.digital?.power_down) {
      sendCommand('digital', device.commands.digital.power_down, null)
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
          <TextType
                text={device.Name}
                typingSpeed={50}
                initialDelay={100}
                loop={false}
                showCursor={false}

              />
          </h3>
          
          {/* Boutons de contrôle */}
          <ButtonGroup 
            className="w-full" 
            variant="solid" 
            color="primary"
            size="sm"
          >
            <Button
              onPress={handleUp}
              className="flex-1 text-xs sm:text-sm"
              size="lg"
              startContent={
                <motion.svg 
                  width="28" 
                  height="28" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <path d="m18 15-6-6-6 6"/>
                </motion.svg>
              }
            >
            
            </Button>
            <Button
  onPress={handleStop}
  className="flex-1 text-xs sm:text-sm"
  size="lg"
  startContent={
    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2"/>
    </svg>
  }
>
 
</Button>
            <Button
              onPress={handleDown}
              className="flex-1 text-xs sm:text-sm"
              size="lg"
              startContent={
                <motion.svg 
                  width="28" 
                  height="28" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2.5" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  animate={{ y: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                >
                  <path d="m6 9 6 6 6-6"/>
                </motion.svg>
              }
            >
              
            </Button>
          </ButtonGroup>
        </div>
      </CardBody>
    </Card>
  )
}

export default BlindsCard
