import React, { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/solid'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
import Modal from './Modal'
import { ElementTitle } from './styles'
import Button, { LinkButton } from './Button'
import Input, { Label } from './Input'
import useMangoStore from '../stores/useMangoStore'
import useLocalStorageState from '../hooks/useLocalStorageState'
import Select from './Select'
import { useTranslation } from 'next-i18next'
import Switch from './Switch'

const NODE_URLS = [
  { label: 'Triton (RPC Pool)', value: 'https://mango.rpcpool.com' },
  {
    label: 'Genesys Go',
    value: 'https://mango.genesysgo.net/',
  },
  {
    label: 'Project Serum',
    value: 'https://solana-api.projectserum.com/',
  },
  { label: 'Custom', value: '' },
]

const CUSTOM_NODE = NODE_URLS.find((n) => n.label === 'Custom')

export const NODE_URL_KEY = 'node-url-key-0.5'
export const DEFAULT_MARKET_KEY = 'defaultMarket-0.3'
export const ORDERBOOK_FLASH_KEY = 'showOrderbookFlash'
export const DEFAULT_SPOT_MARGIN_KEY = 'defaultSpotMargin'
export const initialMarket = {
  base: 'SOL',
  kind: 'perp',
  name: 'SOL-PERP',
  path: '/?name=SOL-PERP',
}

const SettingsModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation('common')
  const [settingsView, setSettingsView] = useState('')
  const [rpcEndpointUrl] = useLocalStorageState(
    NODE_URL_KEY,
    NODE_URLS[0].value
  )

  const [defaultMarket] = useLocalStorageState(
    DEFAULT_MARKET_KEY,
    initialMarket
  )
  const [showOrderbookFlash, setShowOrderbookFlash] = useLocalStorageState(
    ORDERBOOK_FLASH_KEY,
    true
  )

  const [defaultSpotMargin, setDefaultSpotMargin] = useLocalStorageState(
    DEFAULT_SPOT_MARGIN_KEY,
    false
  )

  const rpcEndpoint =
    NODE_URLS.find((node) => node.value === rpcEndpointUrl) || CUSTOM_NODE
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {settingsView !== '' ? (
        <LinkButton
          className="absolute left-2 top-3 flex items-center"
          onClick={() => setSettingsView('')}
        >
          <ChevronLeftIcon className="h-5 w-5" />
          <span>{t('back')}</span>
        </LinkButton>
      ) : null}
      <Modal.Header>
        <ElementTitle noMarginBottom>{t('settings')}</ElementTitle>
      </Modal.Header>
      {!settingsView ? (
        <div className="border-b border-th-bkg-4">
          <button
            className="default-transition flex w-full items-center justify-between border-t border-th-bkg-4 py-3 font-normal text-th-fgd-1 hover:text-th-primary focus:outline-none"
            onClick={() => setSettingsView('Default Market')}
          >
            <span>{t('default-market')}</span>
            <div className="flex items-center text-xs text-th-fgd-3">
              {defaultMarket.name}
              <ChevronRightIcon className="ml-1 h-5 w-5 text-th-fgd-1" />
            </div>
          </button>
          <button
            className="default-transition flex w-full items-center justify-between border-t border-th-bkg-4 py-3 font-normal text-th-fgd-1 hover:text-th-primary focus:outline-none"
            onClick={() => setSettingsView('RPC Endpoint')}
          >
            <span>{t('rpc-endpoint')}</span>
            <div className="flex items-center text-xs text-th-fgd-3">
              {rpcEndpoint.label}
              <ChevronRightIcon className="ml-1 h-5 w-5 text-th-fgd-1" />
            </div>
          </button>
          <div className="flex items-center justify-between border-t border-th-bkg-4 py-3 text-th-fgd-1">
            <span>{t('orderbook-animation')}</span>
            <Switch
              checked={showOrderbookFlash}
              onChange={(checked) => setShowOrderbookFlash(checked)}
            />
          </div>

          <div className="flex items-center justify-between border-t border-th-bkg-4 py-3 text-th-fgd-1">
            <span>{t('default-spot-margin')}</span>
            <Switch
              checked={defaultSpotMargin}
              onChange={(checked) => setDefaultSpotMargin(checked)}
            />
          </div>
        </div>
      ) : null}
      <SettingsContent
        settingsView={settingsView}
        setSettingsView={setSettingsView}
      />
      {!settingsView ? (
        <div className="flex justify-center pt-6">
          <Button onClick={onClose}>{t('done')}</Button>
        </div>
      ) : null}
    </Modal>
  )
}

export default React.memo(SettingsModal)

const SettingsContent = ({ settingsView, setSettingsView }) => {
  switch (settingsView) {
    case 'Default Market':
      return <DefaultMarketSettings setSettingsView={setSettingsView} />
    case 'RPC Endpoint':
      return <RpcEndpointSettings setSettingsView={setSettingsView} />
    case '':
      return null
  }
}

const DefaultMarketSettings = ({ setSettingsView }) => {
  const { t } = useTranslation('common')
  const groupConfig = useMangoGroupConfig()
  const allMarkets = [
    ...groupConfig.spotMarkets,
    ...groupConfig.perpMarkets,
  ].sort((a, b) => a.name.localeCompare(b.name))
  const [defaultMarket, setDefaultMarket] = useLocalStorageState(
    DEFAULT_MARKET_KEY,
    {
      base: 'BTC',
      kind: 'perp',
      name: 'BTC-PERP',
      path: '/?name=BTC-PERP',
    }
  )
  const handleSetDefaultMarket = (market) => {
    const base = market.slice(0, -5)
    const kind = market.includes('PERP') ? 'perp' : 'spot'

    setDefaultMarket({
      base: base,
      kind: kind,
      name: market,
      path: `/?name=${market}`,
    })
  }
  const parsedDefaultMarket = defaultMarket
  return (
    <div>
      <Label>{t('default-market')}</Label>
      <Select
        value={parsedDefaultMarket.name}
        onChange={(market) => handleSetDefaultMarket(market)}
        className="w-full"
      >
        {allMarkets.map((market) => (
          <Select.Option key={market.name} value={market.name}>
            <div className="flex w-full items-center justify-between">
              {market.name}
            </div>
          </Select.Option>
        ))}
      </Select>
      <Button onClick={() => setSettingsView('')} className="mt-6 w-full">
        <div className={`flex items-center justify-center`}>{t('save')}</div>
      </Button>
    </div>
  )
}

const RpcEndpointSettings = ({ setSettingsView }) => {
  const { t } = useTranslation('common')
  const actions = useMangoStore((s) => s.actions)
  const [rpcEndpointUrl, setRpcEndpointUrl] = useLocalStorageState(
    NODE_URL_KEY,
    NODE_URLS[0].value
  )
  const rpcEndpoint =
    NODE_URLS.find((node) => node.value === rpcEndpointUrl) || CUSTOM_NODE

  const handleSetEndpointUrl = (endpointUrl) => {
    setRpcEndpointUrl(endpointUrl)
    actions.updateConnection(endpointUrl)
    setSettingsView('')
  }

  const handleSelectEndpointUrl = (url) => {
    setRpcEndpointUrl(url)
  }
  return (
    <div className="flex flex-col text-th-fgd-1">
      <Label>{t('rpc-endpoint')}</Label>
      <Select
        value={rpcEndpoint.label}
        onChange={(url) => handleSelectEndpointUrl(url)}
        className="w-full"
      >
        {NODE_URLS.map((node) => (
          <Select.Option key={node.value} value={node.value}>
            <span>{node.label}</span>
          </Select.Option>
        ))}
      </Select>
      {rpcEndpoint.label === 'Custom' ? (
        <div className="pt-4">
          <Label>{t('node-url')}</Label>
          <Input
            type="text"
            value={rpcEndpointUrl}
            onChange={(e) => setRpcEndpointUrl(e.target.value)}
          />
        </div>
      ) : null}
      <Button
        onClick={() => handleSetEndpointUrl(rpcEndpointUrl)}
        className="mt-6 w-full"
      >
        <div className={`flex items-center justify-center`}>{t('save')}</div>
      </Button>
    </div>
  )
}
