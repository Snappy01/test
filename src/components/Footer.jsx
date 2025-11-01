import { Button, ButtonGroup } from '@heroui/react'

const Footer = ({ activeCategory, onCategoryChange }) => {
  const categories = [
    { id: 'Lights', label: 'Lights', icon: '💡' },
    { id: 'Blinds', label: 'Blinds', icon: '🪟' },
    { id: 'AudioZones', label: 'Audio', icon: '🔊' },
    { id: 'ACs', label: 'HVAC', icon: '❄️' }
  ]

  return (
    <footer className="bg-blue-900/95 backdrop-blur-sm border-t border-blue-700/50 sticky bottom-0 z-40 safe-area-bottom">
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
              className={`flex-1 flex flex-col items-center gap-1 min-h-[60px] ${
                activeCategory === category.id 
                  ? 'bg-blue-600' 
                  : 'bg-blue-800/50 hover:bg-blue-700/50'
              }`}
              variant={activeCategory === category.id ? 'solid' : 'flat'}
            >
              <span className="text-xl">{category.icon}</span>
              <span className="text-xs sm:text-sm font-medium text-white">
                {category.label}
              </span>
            </Button>
          ))}
        </ButtonGroup>
      </div>
    </footer>
  )
}

export default Footer

