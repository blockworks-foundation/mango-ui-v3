import React, { useState } from 'react'
import Modal from './Modal'
import { ElementTitle } from './styles'
import Button from './Button'
import Input from './Input'
import useMangoStore from '../stores/useMangoStore'

const SettingsModal = ({ isOpen, onClose }) => {
  const actions = useMangoStore((s) => s.actions)
  const [rpcEndpointUrl, setRpcEndpointUrl] = useState(
    'https://mango.rpcpool.com'
  )

  const handleSetEndpointUrl = (endpointUrl) => {
    setRpcEndpointUrl(endpointUrl)

    actions.updateConnection(endpointUrl)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <ElementTitle noMarignBottom>Advanced Settings</ElementTitle>
      </Modal.Header>
      <div className="flex flex-col items-center text-th-fgd-1">
        <Input.Group className="w-full">
          <Input
            type="text"
            value={rpcEndpointUrl}
            onChange={(e) => setRpcEndpointUrl(e.target.value)}
            prefix="RPC Node URL"
          />
        </Input.Group>
        <div className={`flex justify-center w-full mt-4`}>
          <Button
            onClick={() => handleSetEndpointUrl(rpcEndpointUrl)}
            className="w-full"
          >
            <div className={`flex items-center justify-center`}>Save</div>
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default React.memo(SettingsModal)
