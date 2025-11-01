import { Tabs, Tab } from '@heroui/react'
import { useState } from 'react'

const LightsPresets = ({ presets, onPresetSelect, isConnected }) => {
  // État local pour le preset sélectionné (null = aucun sélectionné au démarrage)
  const [selectedKey, setSelectedKey] = useState(null)

  if (!presets || !presets.commands?.digital) {
    return null
  }

  const presetCommands = presets.commands.digital

  // Fonction appelée au clic sur un Tab
  const handleTabClick = (presetKey) => {
    if (presetKey && presetCommands[presetKey]) {
      // Mettre à jour l'état visuel
      setSelectedKey(presetKey)
      // Déclencher la commande (uniquement au clic utilisateur)
      onPresetSelect(presetKey, presetCommands[presetKey])
    }
  }

  return (
    <div className="px-3 sm:px-4 pt-3 sm:pt-4">
      <Tabs
        aria-label="Light Presets"
        color="primary"
        variant="underlined"
        size="lg"
        selectedKey={selectedKey}
        classNames={{
          base: "w-full",
          tabList: "gap-2 sm:gap-4 w-full relative rounded-none p-0 border-b border-blue-700/50 justify-center",
          cursor: "w-full bg-blue-500",
          tab: "max-w-fit px-3 sm:px-6 h-10 sm:h-12",
          tabContent: "group-data-[selected=true]:text-blue-400 text-gray-400 text-sm sm:text-base font-semibold"
        }}
      >
        <Tab
          key="Morning"
          onPress={() => handleTabClick("Morning")}
          title={
            <div className="flex items-center gap-2">
              <span>🌅</span>
              <span>Morning</span>
            </div>
          }
        />
        <Tab
          key="Afternoon"
          onPress={() => handleTabClick("Afternoon")}
          title={
            <div className="flex items-center gap-2">
              <span>☀️</span>
              <span>Afternoon</span>
            </div>
          }
        />
        <Tab
          key="Evening"
          onPress={() => handleTabClick("Evening")}
          title={
            <div className="flex items-center gap-2">
              <span>🌆</span>
              <span>Evening</span>
            </div>
          }
        />
        <Tab
          key="Off"
          onPress={() => handleTabClick("Off")}
          title={
            <div className="flex items-center gap-2">
              <span>🌙</span>
              <span>Off</span>
            </div>
          }
        />
      </Tabs>
    </div>
  )
}

export default LightsPresets

