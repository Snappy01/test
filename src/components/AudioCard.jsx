import { useState, useEffect } from 'react'
import { Card, CardBody, Switch, Slider, Button } from '@heroui/react'

const AudioCard = ({ device, onCommand, isConnected, latestFeedback }) => {
  const [volume, setVolume] = useState(50)
  const [bass, setBass] = useState(50)
  const [isMuted, setIsMuted] = useState(false)

  // Gérer les feedbacks du serveur (broadcast)
  useEffect(() => {
    if (!latestFeedback || !device.commands) return

    const volumeId = device.commands.ushort?.volume
    const bassId = device.commands.ushort?.subwoofer_level
    const muteOnId = device.commands.digital?.mute_on
    const muteOffId = device.commands.digital?.mute_off

    // Vérifier si ce feedback concerne ce device
    if (latestFeedback.id === volumeId && latestFeedback.type === 'ushort') {
      setVolume(latestFeedback.value)
      console.log(`Feedback pour ${device.Name} volume:`, latestFeedback.value)
    } else if (latestFeedback.id === bassId && latestFeedback.type === 'ushort') {
      setBass(latestFeedback.value)
      console.log(`Feedback pour ${device.Name} bass:`, latestFeedback.value)
    } else if (latestFeedback.id === muteOnId && latestFeedback.type === 'boolean') {
      setIsMuted(latestFeedback.value)
      console.log(`Feedback pour ${device.Name} mute_on:`, latestFeedback.value)
    } else if (latestFeedback.id === muteOffId && latestFeedback.type === 'boolean') {
      setIsMuted(!latestFeedback.value)
      console.log(`Feedback pour ${device.Name} mute_off:`, latestFeedback.value)
    }
  }, [latestFeedback, device])

  const handleVolumeChange = (value) => {
    setVolume(value)
    if (device.commands?.ushort?.volume) {
      onCommand('ushort', device.commands.ushort.volume, value)
    }
  }

  const handleBassChange = (value) => {
    setBass(value)
    if (device.commands?.ushort?.subwoofer_level) {
      onCommand('ushort', device.commands.ushort.subwoofer_level, value)
    }
  }

  const handleMuteToggle = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    if (device.commands?.digital) {
      const command = newMutedState ? device.commands.digital.mute_on : device.commands.digital.mute_off
      if (command) {
        onCommand('digital', command, null)
      }
    }
  }

  return (
    <Card className="bg-blue-800/50 border border-blue-600/50">
      <CardBody className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base sm:text-lg font-semibold text-white truncate flex-1">{device.Name}</h3>
            <Button
              onPress={handleMuteToggle}
              color={isMuted ? "danger" : "success"}
              variant="flat"
              size="sm"
              className="text-xs sm:text-sm whitespace-nowrap"
            >
              <span className="hidden sm:inline">{isMuted ? '🔇 MUTE' : '🔊'}</span>
              <span className="sm:hidden">{isMuted ? '🔇' : '🔊'}</span>
            </Button>
          </div>
          
          {device.commands?.ushort?.volume !== undefined && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>Volume</span>
                <span>{volume}%</span>
              </div>
              <Slider
                value={volume}
                onChange={handleVolumeChange}
                minValue={0}
                maxValue={100}
                step={1}
                color="primary"
                isDisabled={isMuted}
                className="max-w-full"
                classNames={{
                  track: "border-s-blue-300",
                  filler: "bg-gradient-to-r from-blue-500 to-blue-400"
                }}
              />
            </div>
          )}

          {device.commands?.ushort?.subwoofer_level !== undefined && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>Bass</span>
                <span>{bass}%</span>
              </div>
              <Slider
                value={bass}
                onChange={handleBassChange}
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

