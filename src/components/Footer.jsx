import { motion } from 'framer-motion'
import { Button, ButtonGroup } from '@heroui/react'

const Footer = ({ activeCategory, onCategoryChange }) => {
  const categories = [
    { id: 'Lights', label: 'Lights', icon: '💡' },
    { id: 'Blinds', label: 'Blinds', icon: '🪟' },
    { id: 'AudioZones', label: 'Audio', icon: '🔊' },
    { id: 'ACs', label: 'HVAC', icon: '❄️' }
  ]

  return (
    <footer className="bg-blue-600/95 dark:bg-blue-900/95 backdrop-blur-sm border-t border-blue-500/50 dark:border-blue-700/50 sticky bottom-0 z-40 safe-area-bottom">
      <div className="px-4 py-3">
        <ButtonGroup 
          className="w-full justify-center"
          variant="solid"
          color="primary"
          size="lg"
        >
          {categories.map((category) => (
            <Button
              key={category.id}
              onPress={() => onCategoryChange(category.id)}
              className={`relative flex-1 flex flex-col items-center gap-1 min-h-[60px] bg-transparent hover:bg-white/10 dark:hover:bg-white/5 ${
                activeCategory === category.id 
                  ? 'opacity-100' 
                  : 'opacity-70 hover:opacity-100'
              }`}
              variant="light"
              as={motion.button}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              {/* Indicateur animé avec layoutId pour glissement fluide */}
              {activeCategory === category.id && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-1 bg-white rounded-full"
                  layoutId="activeIndicator"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              
              {/* Icône avec animation scale et rotate (wobble) */}
              <motion.span
                className="relative text-xl"
                animate={{
                  scale: activeCategory === category.id ? 1.2 : 1,
                  rotate: activeCategory === category.id ? [0, -10, 10, -10, 0] : 0,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                {category.icon}
              </motion.span>
              
              {/* Texte avec animation fade et décalage vertical */}
              <motion.span
                className="text-xs sm:text-sm font-medium text-white"
                animate={{
                  opacity: activeCategory === category.id ? 1 : 0.7,
                  y: activeCategory === category.id ? 0 : 2,
                }}
                transition={{ duration: 0.3 }}
              >
                {category.label}
              </motion.span>
            </Button>
          ))}
        </ButtonGroup>
      </div>
    </footer>
  )
}

export default Footer

