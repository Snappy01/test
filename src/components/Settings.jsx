import { useState } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Switch } from '@heroui/react'

const Settings = ({ isOpen, onOpenChange, wsUrl, onWsUrlChange, onConnect, onDisconnect, isConnected, theme, onThemeChange }) => {
  const [localWsUrl, setLocalWsUrl] = useState(wsUrl)

  const handleConnect = () => {
    onWsUrlChange(localWsUrl)
    onConnect()
    onOpenChange(false)
  }

  const handleDisconnect = () => {
    onDisconnect()
    onOpenChange(false)
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onOpenChange={onOpenChange}
      size="lg"
      classNames={{
        base: "bg-white dark:bg-blue-900",
        header: "bg-gray-100 dark:bg-blue-800 border-b border-gray-200 dark:border-blue-700",
        body: "bg-white dark:bg-blue-900",
        footer: "bg-gray-100 dark:bg-blue-800 border-t border-gray-200 dark:border-blue-700"
      }}
    >
      <ModalContent>
        <ModalHeader className="text-gray-900 dark:text-white">
          <h2 className="text-xl font-bold">⚙️ Réglages</h2>
        </ModalHeader>
        <ModalBody>
          <div className="flex flex-col gap-4">
            <Input
              label="URL WebSocket"
              placeholder="ws://172.16.80.104:9899/server"
              value={localWsUrl}
              onChange={(e) => setLocalWsUrl(e.target.value)}
              variant="bordered"
              classNames={{
                input: "text-gray-900 dark:text-white",
                inputWrapper: "border-gray-300 dark:border-blue-600",
                label: "text-gray-700 dark:text-gray-300"
              }}
              isDisabled={isConnected}
            />
            
            <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-blue-800/50 rounded-lg">
              <Switch
                isSelected={isConnected}
                isDisabled
                color="success"
                size="sm"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Statut: {isConnected ? (
                  <span className="text-green-600 dark:text-green-400 font-semibold">Connecté</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 font-semibold">Déconnecté</span>
                )}
              </span>
            </div>

            {isConnected && (
              <div className="p-3 bg-gray-100 dark:bg-blue-700/30 rounded-lg text-sm text-gray-700 dark:text-gray-300">
                <p>Serveur connecté à :</p>
                <p className="font-mono text-xs text-blue-600 dark:text-blue-300 mt-1">{wsUrl}</p>
              </div>
            )}

            {/* Section Apparence */}
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-200 dark:border-blue-700/50">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Apparence
              </h3>
              
              <div className="flex items-center justify-between p-3 bg-gray-100 dark:bg-blue-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-base">🌙</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Mode Sombre
                  </span>
                </div>
                <Switch
                  isSelected={theme === 'dark'}
                  onValueChange={(isDark) => onThemeChange(isDark ? 'dark' : 'light')}
                  color="primary"
                  size="md"
                />
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          {isConnected ? (
            <Button
              color="danger"
              variant="solid"
              onPress={handleDisconnect}
            >
              Déconnecter
            </Button>
          ) : (
            <Button
              color="success"
              variant="solid"
              onPress={handleConnect}
              isDisabled={!localWsUrl.trim()}
            >
              Connecter
            </Button>
          )}
          <Button
            color="default"
            variant="light"
            onPress={() => onOpenChange(false)}
          >
            Fermer
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export default Settings

