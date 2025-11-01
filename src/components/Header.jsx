import { useState } from 'react'
import { Button, Drawer, DrawerContent, DrawerHeader, DrawerBody, Accordion, AccordionItem } from '@heroui/react'
import SplitText from './SplitText'

const Header = ({ selectedZone, onZoneSelect }) => {
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
    <header className="bg-blue-900 text-white p-4 flex items-center sticky top-0 z-50">
     
       {/* Bouton Drawer à droite */}
       <Button
        color="primary"
        variant="flat"
        onPress={() => setIsOpen(true)}
        className="text-white w-[120px]"
      >
        Select Zone
      </Button>
      
      {/* Titre de la zone sélectionnée au centre */}
      <div className="flex-1 text-center">
        {selectedZone ? (
          <SplitText
          text={selectedZone}
          className="text-2xl font-semibold text-center"
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
          <h2 className="text-xl font-bold text-gray-400">Aucune zone sélectionnée</h2>
        )}
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

