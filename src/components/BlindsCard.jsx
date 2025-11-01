import { Card, CardBody, Button, ButtonGroup } from '@heroui/react'
import { useEffect } from 'react'

const BlindsCard = ({ device, onCommand, isConnected, latestFeedback }) => {
  // Gérer les feedbacks du serveur (broadcast)
  useEffect(() => {
    if (!latestFeedback || !device.commands?.digital) return

    const powerUpId = device.commands.digital.power_up
    const powerDownId = device.commands.digital.power_down
    const stopId = device.commands.digital.stop

    // Les stores n'ont généralement pas de feedback direct, mais on peut gérer si nécessaire
    // Par exemple, si le serveur envoie un feedback de position
    if (latestFeedback.type === 'boolean') {
      if (latestFeedback.id === powerUpId || latestFeedback.id === powerDownId || latestFeedback.id === stopId) {
        console.log(`Feedback pour ${device.Name}:`, latestFeedback)
        // Ici tu pourrais gérer l'état du store si nécessaire
      }
    }
  }, [latestFeedback, device])
  const handleUp = () => {
    if (device.commands?.digital?.power_up) {
      onCommand('digital', device.commands.digital.power_up, null)
    }
  }

  const handleStop = () => {
    if (device.commands?.digital?.stop) {
      onCommand('digital', device.commands.digital.stop, null)
    }
  }

  const handleDown = () => {
    if (device.commands?.digital?.power_down) {
      onCommand('digital', device.commands.digital.power_down, null)
    }
  }

  return (
    <Card className="bg-white dark:bg-blue-800/50 border border-gray-200 dark:border-blue-600/50">
      <CardBody className="p-4">
        <div className="flex flex-col gap-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white text-center">{device.Name}</h3>
          
          <ButtonGroup 
            className="w-full" 
            variant="solid" 
            color="primary"
            size="sm"
          >
            <Button
              onPress={handleUp}
              className="flex-1 text-xs sm:text-sm"
              size="md"
              startContent={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              }
            >
              <span className="hidden sm:inline">UP</span>
              <span className="sm:hidden">↑</span>
            </Button>
            <Button
              onPress={handleStop}
              className="flex-1 text-xs sm:text-sm"
              size="md"
            >
              STOP
            </Button>
            <Button
              onPress={handleDown}
              className="flex-1 text-xs sm:text-sm"
              size="md"
              startContent={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              }
            >
              <span className="hidden sm:inline">DOWN</span>
              <span className="sm:hidden">↓</span>
            </Button>
          </ButtonGroup>
        </div>
      </CardBody>
    </Card>
  )
}

export default BlindsCard

