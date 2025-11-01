import { useState, useEffect } from 'react'
import { Card, CardBody, Slider, Button, ButtonGroup } from '@heroui/react'

const HVACCard = ({ device, onCommand, isConnected, latestFeedback }) => {
  const [currentTemp, setCurrentTemp] = useState(22)
  const [targetTemp, setTargetTemp] = useState(22)

  // Gérer les feedbacks du serveur (broadcast)
  useEffect(() => {
    if (!latestFeedback || !device.commands?.ushort) return

    const temperatureId = device.commands.ushort.temperature
    const currentTemperatureId = device.commands.ushort.current_temperature

    // Vérifier si ce feedback concerne ce device
    if (latestFeedback.id === temperatureId && latestFeedback.type === 'ushort') {
      setTargetTemp(latestFeedback.value)
      console.log(`Feedback pour ${device.Name} température cible:`, latestFeedback.value)
    } else if (latestFeedback.id === currentTemperatureId && latestFeedback.type === 'ushort') {
      setCurrentTemp(latestFeedback.value)
      console.log(`Feedback pour ${device.Name} température actuelle:`, latestFeedback.value)
    }
  }, [latestFeedback, device])

  const handleTempChange = (value) => {
    setTargetTemp(value)
    if (device.commands?.ushort?.temperature) {
      onCommand('ushort', device.commands.ushort.temperature, value)
    }
  }

  const handleQuickTemp = (delta) => {
    const newTemp = Math.max(16, Math.min(30, targetTemp + delta))
    setTargetTemp(newTemp)
    if (device.commands?.ushort?.temperature) {
      onCommand('ushort', device.commands.ushort.temperature, newTemp)
    }
  }

  return (
    <Card className=" bg-blue-800/50 border border-blue-600/50">
      <CardBody className="p-4">
        <div className="flex flex-col gap-4">
          <h3 className="text-base sm:text-lg font-semibold text-white text-center">{device.Name}</h3>
          
          <div className="flex items-center justify-center gap-2 sm:gap-4">
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-400">Actuelle</span>
              <span className="text-2xl sm:text-3xl font-bold text-white">{currentTemp}°C</span>
            </div>
            <div className="text-gray-500">→</div>
            <div className="flex flex-col items-center">
              <span className="text-xs text-gray-400">Cible</span>
              <span className="text-2xl sm:text-3xl font-bold text-blue-400">{targetTemp}°C</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <span>Température cible</span>
              <span>{targetTemp}°C</span>
            </div>
            <Slider
              value={targetTemp}
              onChange={handleTempChange}
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

