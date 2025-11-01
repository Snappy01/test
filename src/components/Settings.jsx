import { useState } from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Switch } from '@heroui/react'

const Settings = ({ isOpen, onOpenChange, wsUrl, onWsUrlChange, onConnect, onDisconnect, isConnected }) => {
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
        base: "bg-blue-900",
        header: "bg-blue-800 border-b border-blue-700",
        body: "bg-blue-900",
        footer: "bg-blue-800 border-t border-blue-700"
      }}
    >
      <ModalContent>
        <ModalHeader className="text-white">
          <h2 className="text-xl font-bold">⚙️ Réglages WebSocket</h2>
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
                input: "text-white",
                inputWrapper: "border-blue-600",
                label: "text-gray-300"
              }}
              isDisabled={isConnected}
            />
            
            <div className="flex items-center gap-2 p-3 bg-blue-800/50 rounded-lg">
              <Switch
                isSelected={isConnected}
                isDisabled
                color="success"
                size="sm"
              />
              <span className="text-sm text-gray-300">
                Statut: {isConnected ? (
                  <span className="text-green-400 font-semibold">Connecté</span>
                ) : (
                  <span className="text-red-400 font-semibold">Déconnecté</span>
                )}
              </span>
            </div>

            {isConnected && (
              <div className="p-3 bg-blue-700/30 rounded-lg text-sm text-gray-300">
                <p>Serveur connecté à :</p>
                <p className="font-mono text-xs text-blue-300 mt-1">{wsUrl}</p>
              </div>
            )}
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

