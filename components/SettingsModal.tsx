import React from 'react'
import Modal from './Modal'
import { ElementTitle } from './styles'
import Button from './Button'
import Input from './Input'
import useMangoStore from '../stores/useMangoStore'
import useLocalStorageState from '../hooks/useLocalStorageState'
import Select from './Select'

const NODE_URLS = [
  { label: 'Mango Node', value: 'https://mango.rpcpool.com' },
  {
    label: 'Genesys Go',
    value: 'https://lokidfxnwlabdq.main.genesysgo.net:8899/',
  },
  {
    label: 'Project Serum',
    value: 'https://solana-api.projectserum.com/',
  },
  { label: 'Custom', value: '' },
]

const CUSTOM_NODE = NODE_URLS.find((n) => n.label === 'Custom')

export const NODE_URL_KEY = 'node-url-key-0.4'

const SettingsModal = ({ isOpen, onClose }) => {
  const actions = useMangoStore((s) => s.actions)
  const [rpcEndpointUrl, setRpcEndpointUrl] = useLocalStorageState(
    NODE_URL_KEY,
    NODE_URLS[0].value
  )
  const rpcEndpoint =
    NODE_URLS.find((node) => node.value === rpcEndpointUrl) || CUSTOM_NODE

  console.log('rpcEndpoint', rpcEndpointUrl)

  const handleSetEndpointUrl = (endpointUrl) => {
    setRpcEndpointUrl(endpointUrl)
    actions.updateConnection(endpointUrl)
    onClose()
  }

  const handleSelectEndpointUrl = (url) => {
    setRpcEndpointUrl(url)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <ElementTitle noMarignBottom>Advanced Settings</ElementTitle>
      </Modal.Header>
      <div className="flex flex-col items-center text-th-fgd-1">
        <Select
          value={rpcEndpoint.label}
          onChange={(url) => handleSelectEndpointUrl(url)}
          className="w-full"
        >
          <div className="space-y-2">
            {NODE_URLS.map((node) => (
              <Select.Option
                key={node.value}
                value={node.value}
                className={`bg-th-bkg-1 relative rounded-md w-full px-3 py-3 cursor-pointer default-transition flex hover:bg-th-bkg-3 focus:outline-none`}
              >
                <div className="flex items-center justify-between w-full">
                  {node.label}
                </div>
              </Select.Option>
            ))}
          </div>
        </Select>
        {rpcEndpoint.label === 'Custom' ? (
          <Input.Group className="w-full mt-4">
            <Input
              type="text"
              value={rpcEndpointUrl}
              onChange={(e) => setRpcEndpointUrl(e.target.value)}
              prefix="RPC Node URL"
            />
          </Input.Group>
        ) : null}
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
