import { useState } from 'react'
import { Button, Drawer, DrawerContent, DrawerHeader, DrawerBody, Accordion, AccordionItem } from '@heroui/react'
import SplitText from './SplitText'

const Header = ({ selectedZone, onZoneSelect, onSettingsOpen }) => {
  const [isOpen, setIsOpen] = useState(false)

  const zones = [
    {
      title: '1er Etage',
      items: ['Chambre Maitre', 'SDB', 'ChambreEnfant']
    },
    {
      title: 'RDC',
      items: ['Salon', 'Cuisine']
    },
    {
      title: 'SSOL',
      items: ['Cinema']
    }
  ]

  const handleZoneClick = (zone) => {
    onZoneSelect(zone)
    setIsOpen(false)
  }

  return (
    <header className="bg-blue-900 text-white p-3 sm:p-4 grid grid-cols-3 items-center gap-2 sm:gap-4 sticky top-0 z-50">
     
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
          <h2 className="text-sm sm:text-xl font-bold text-gray-400">Aucune zone sélectionnée</h2>
        )}
      </div>

      {/* Bouton Réglages */}
      <div className="justify-self-end">
      <Button
        color="secondary"
        variant="flat"
        onPress={() => onSettingsOpen(true)}
        className="text-white min-w-[40px] sm:min-w-[50px]"
        isIconOnly
        size="sm"
        aria-label="Réglages"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364 6.364l-4.243-4.243m-4.242 0l-4.243 4.243m8.485 0l-4.242-4.242m0 8.485l-4.243-4.243"></path>
        </svg>
      </Button>
      </div>
      {/* Drawer */}
      <Drawer isOpen={isOpen} onOpenChange={setIsOpen} placement="left">
        <DrawerContent className="max-w-[40vh] sm:max-w-sm">
          <DrawerHeader className="bg-blue-800 text-white">
            <h2 className="text-2xl font-bold">Select Zone</h2>
          </DrawerHeader>
          <DrawerBody className="bg-blue-900">
            <Accordion selectionMode="single"  className="text-white">
              {zones.map((section, index) => (
                <AccordionItem
                  key={index}
                  title={section.title}
                  className="text-white"
                  classNames={{
                    title: "text-white",
                    indicator: "text-white",
                    content: "text-white"
                  }}
                >
                  <div className="flex flex-col gap-2">
                    {section.items.map((item, itemIndex) => (
                      <Button
                        key={itemIndex}
                        variant="light"
                        className="justify-start text-white hover:bg-blue-700"
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

