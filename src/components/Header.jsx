import { useState, useMemo } from 'react'
import { Button, Drawer, DrawerContent, DrawerHeader, DrawerBody, Accordion, AccordionItem } from '@heroui/react'
import SplitText from './SplitText'
import SettingsIcon from './SettingsIcon'

const Header = ({ selectedZone, onZoneSelect, onSettingsOpen, zonesData = [] }) => {
  const [isOpen, setIsOpen] = useState(false)

  // Organiser les zones par étage depuis zonesData (reçu en prop)
  const zones = useMemo(() => {
    // Si zonesData est vide ou pas encore chargé, retourner un tableau vide
    if (!zonesData || zonesData.length === 0) {
      return []
    }

    const zonesByFloor = {}
    
    zonesData.forEach(zone => {
      if (!zonesByFloor[zone.floor]) {
        zonesByFloor[zone.floor] = []
      }
      zonesByFloor[zone.floor].push(zone.displayName)
    })
    
    // Convertir en format attendu par l'UI
    return Object.keys(zonesByFloor).map(floor => ({
      title: floor,
      items: zonesByFloor[floor]
    }))
  }, [zonesData]) // Dépend de zonesData maintenant !

  const handleZoneClick = (zone) => {
    onZoneSelect(zone)
    setIsOpen(false)
  }

  return (
    <header className="bg-blue-600 dark:bg-blue-900 text-white px-3 pb-3 sm:px-4 sm:pb-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] sm:pt-4 grid grid-cols-3 items-center gap-2 sm:gap-4 sticky top-0 z-50">
      {/* Bouton Drawer */}
      <Button
        color="primary"
        variant="flat"
        onPress={() => setIsOpen(true)}
        className="text-white min-w-[100px] sm:w-[120px] text-xs sm:text-sm"
        size="sm"
      >
        <span className="hidden sm:inline">Select Zone</span>
        <span className="sm:hidden">Zone</span>
      </Button>

      {/* Titre de la zone sélectionnée au centre */}
      <div className="min-w-0 text-center">
        {selectedZone ? (
          <SplitText
            key={selectedZone}
            text={selectedZone}
            className="text-lg sm:text-2xl font-semibold text-center truncate"
            delay={100}
            duration={0.6}
            ease="power3.out"
            splitType="chars"
            from={{ opacity: 0, y: 40 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            textAlign="center"
          />
        ) : (
          <h2 className="text-sm sm:text-xl font-bold text-gray-300 dark:text-gray-400">Aucune zone sélectionnée</h2>
        )}
      </div>

      {/* Bouton Réglages */}
      <div className="flex justify-end">
        <Button
          color="secondary"
          variant="flat"
          onPress={() => onSettingsOpen(true)}
          className="text-white min-w-[40px] sm:min-w-[50px]"
          isIconOnly
          size="sm"
          aria-label="Réglages"
        >
          <SettingsIcon className="w-5 h-5" />
        </Button>
      </div>
      {/* Drawer */}
      <Drawer isOpen={isOpen} onOpenChange={setIsOpen} placement="left">
        <DrawerContent className="max-w-[40vh] sm:max-w-sm bg-white dark:bg-blue-900">
          <DrawerHeader className="bg-blue-500 dark:bg-blue-800 text-white">
            <h2 className="text-2xl font-bold">Select Zone</h2>
          </DrawerHeader>
          <DrawerBody className="bg-white dark:bg-blue-900">
            <Accordion selectionMode="single" className="text-gray-900 dark:text-white">
              {zones.map((section) => (
                <AccordionItem
                  key={section.title}
                  title={section.title}
                  className="text-gray-900 dark:text-white"
                  classNames={{
                    title: "text-gray-900 dark:text-white",
                    indicator: "text-gray-900 dark:text-white",
                    content: "text-gray-900 dark:text-white"
                  }}
                >
                  <div className="flex flex-col gap-2">
                    {section.items.map((item) => (
                      <Button
                        key={item}
                        variant="light"
                        className="justify-start text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-blue-700"
                        onPress={() => handleZoneClick(item)}
                      >
                        {item}
                      </Button>
                    ))}
                  </div>
                </AccordionItem>
              ))}
            </Accordion>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </header>
  )
}

export default Header

