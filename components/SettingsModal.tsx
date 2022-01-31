import React, { useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/solid'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
import Modal from './Modal'
import { ElementTitle } from './styles'
import Button from './Button'
import Input from './Input'
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
export const DEFAULT_MARKET_KEY = 'defaultMarket'
export const ORDERBOOK_FLASH_KEY = 'showOrderbookFlash'
export const DEFAULT_SPOT_MARGIN_KEY = 'defaultSpotMargin'
export const initialMarket = {
  base: 'BTC',
  kind: 'perp',
  name: 'BTC-PERP',
  path: '/market?name=BTC-PERP',
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
        <button
          className="absolute default-transition flex items-center left-2 text-th-fgd-3 text-xs top-3 focus:outline-none hover:text-th-fgd-1"
          onClick={() => setSettingsView('')}
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <span>{t('back')}</span>
        </button>
      ) : null}
      <Modal.Header>
        <ElementTitle noMarginBottom>{t('settings')}</ElementTitle>
      </Modal.Header>
      {!settingsView ? (
        <div className="border-b border-th-bkg-4">
          <button
            className="border-t border-th-bkg-4 default-transition flex font-normal items-center justify-between py-3 text-th-fgd-1 w-full hover:text-th-primary focus:outline-none"
            onClick={() => setSettingsView('Default Market')}
          >
            <span>{t('default-market')}</span>
            <div className="flex items-center text-th-fgd-3 text-xs">
              {defaultMarket.name}
              <ChevronRightIcon className="h-5 ml-1 w-5 text-th-primary" />
            </div>
          </button>
          <button
            className="border-t border-th-bkg-4 default-transition flex font-normal items-center justify-between py-3 text-th-fgd-1 w-full hover:text-th-primary focus:outline-none"
            onClick={() => setSettingsView('RPC Endpoint')}
          >
            <span>{t('rpc-endpoint')}</span>
            <div className="flex items-center text-th-fgd-3 text-xs">
              {rpcEndpoint.label}
              <ChevronRightIcon className="h-5 ml-1 w-5 text-th-primary" />
            </div>
          </button>
          <div className="border-t border-th-bkg-4 flex items-center justify-between py-3 text-th-fgd-1">
            <span>{t('orderbook-animation')}</span>
            <Switch
              checked={showOrderbookFlash}
              onChange={(checked) => setShowOrderbookFlash(checked)}
            />
          </div>

          <div className="border-t border-th-bkg-4 flex items-center justify-between py-3 text-th-fgd-1">
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
      path: '/market?name=BTC-PERP',
    }
  )
  const handleSetDefaultMarket = (market) => {
    const base = market.slice(0, -5)
    const kind = market.includes('PERP') ? 'perp' : 'spot'

    setDefaultMarket({
      base: base,
      kind: kind,
      name: market,
      path: `/market?name=${market}`,
    })
  }
  const parsedDefaultMarket = defaultMarket
  return (
    <div>
      <label className="block font-semibold mb-1 text-th-fgd-1 text-xs">
        {t('default-market')}
      </label>
      <Select
        value={parsedDefaultMarket.name}
        onChange={(market) => handleSetDefaultMarket(market)}
        className="w-full"
      >
        {allMarkets.map((market) => (
          <Select.Option
            key={market.name}
            value={market.name}
            className={`bg-th-bkg-1 relative rounded-md w-full px-3 py-3 cursor-pointer default-transition flex hover:bg-th-bkg-3 focus:outline-none`}
          >
            <div className="flex items-center justify-between w-full">
              {market.name}
            </div>
          </Select.Option>
        ))}
      </Select>
      <Button onClick={() => setSettingsView('')} className="mt-4 w-full">
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
      <label className="block font-semibold mb-1 text-xs">
        {t('rpc-endpoint')}
      </label>
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
        <div className="pt-4">
          <label className="block font-semibold mb-1 text-xs">
            {t('node-url')}
          </label>
          <Input
            type="text"
            value={rpcEndpointUrl}
            onChange={(e) => setRpcEndpointUrl(e.target.value)}
          />
        </div>
      ) : null}
      <Button
        onClick={() => handleSetEndpointUrl(rpcEndpointUrl)}
        className="mt-4 w-full"
      >
        <div className={`flex items-center justify-center`}>{t('save')}</div>
      </Button>
    </div>
  )
}
