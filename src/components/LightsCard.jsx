import { useState, useEffect } from 'react'
import { Card, CardBody, Switch, Slider } from '@heroui/react'

const LightsCard = ({ device, onCommand, isConnected, presetValue, presetTrigger, latestFeedback }) => {
  const [isOn, setIsOn] = useState(false)
  const [intensity, setIntensity] = useState(50)

  // Appliquer un preset externe
  useEffect(() => {
    if (presetTrigger !== null && presetValue !== null && presetValue !== undefined) {
      const newIntensity = presetValue
      setIntensity(newIntensity)
      
      // Mettre à jour l'état du switch
      setIsOn(newIntensity > 0)
    }
  }, [presetTrigger, presetValue])

  // Gérer les feedbacks du serveur (broadcast)
  useEffect(() => {
    if (!latestFeedback || !device.commands) return

    // Extraire les IDs de ce device
    const intensityId = device.commands.ushort?.intensity
    const powerOnId = device.commands.digital?.power_on
    const powerOffId = device.commands.digital?.power_off

    // Vérifier si ce feedback concerne ce device
    if (latestFeedback.id === intensityId && latestFeedback.type === 'ushort') {
      setIntensity(latestFeedback.value)
      setIsOn(latestFeedback.value > 0)
      console.log(`Feedback pour ${device.Name} intensité:`, latestFeedback.value)
    } else if (latestFeedback.id === powerOnId && latestFeedback.type === 'boolean') {
      setIsOn(latestFeedback.value)
      console.log(`Feedback pour ${device.Name} power_on:`, latestFeedback.value)
    } else if (latestFeedback.id === powerOffId && latestFeedback.type === 'boolean') {
      setIsOn(!latestFeedback.value) // power_off true = lumière OFF
      console.log(`Feedback pour ${device.Name} power_off:`, latestFeedback.value)
    }
  }, [latestFeedback, device])

  const handleToggle = () => {
    const newState = !isOn
    setIsOn(newState)
    
    if (device.commands?.digital && device.commands?.ushort?.intensity) {
      if (newState) {
        // Switch ON : slider à 50% + envoie power_on + intensité 50
        setIntensity(50)
        onCommand('digital', device.commands.digital.power_on, null)
        onCommand('ushort', device.commands.ushort.intensity, 50)
      } else {
        // Switch OFF : slider à 0% + envoie power_off + intensité 0
        setIntensity(0)
        onCommand('digital', device.commands.digital.power_off, null)
        onCommand('ushort', device.commands.ushort.intensity, 0)
      }
    }
  }

  const handleIntensityChange = (value) => {
    setIntensity(value)
    
    // Synchronisation visuelle du switch avec le slider
    if (value === 0) {
      setIsOn(false) // Slider à 0 → switch OFF visuellement
    } else if (value > 0 && !isOn) {
      setIsOn(true) // Slider > 0 et switch était OFF → switch ON visuellement
    }
    
    // Envoie SEULEMENT la commande d'intensité (jamais power_on/off)
    if (device.commands?.ushort?.intensity) {
      onCommand('ushort', device.commands.ushort.intensity, value)
    }
  }

  return (
    <Card className="bg-blue-800/50 border border-blue-600/50">
      <CardBody className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-white truncate flex-1">{device.Name}</h3>
            <Switch
              isSelected={isOn}
              onValueChange={handleToggle}
              color="success"
              size="sm"
              classNames={{
                label: "text-white text-xs sm:text-sm"
              }}
            >
              <span className="text-white text-xs sm:text-sm whitespace-nowrap">{isOn ? 'ON' : 'OFF'}</span>
            </Switch>
          </div>
          
          {device.commands?.ushort?.intensity && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>Intensité</span>
                <span>{intensity}%</span>
              </div>
              <Slider
                value={intensity}
                onChange={handleIntensityChange}
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

