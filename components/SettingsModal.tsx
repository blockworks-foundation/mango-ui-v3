import React, { useMemo, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/solid'
import Modal from './Modal'
import { ElementTitle } from './styles'
import Button, { LinkButton } from './Button'
import Input, { Label } from './Input'
import useMangoStore from '../stores/useMangoStore'
import useLocalStorageState from '../hooks/useLocalStorageState'
import Select from './Select'
import { useTranslation } from 'next-i18next'
import Switch from './Switch'
import { MarketKind } from '@blockworks-foundation/mango-client'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/router'
import ButtonGroup from './ButtonGroup'
import dayjs from 'dayjs'

require('dayjs/locale/en')
require('dayjs/locale/es')
require('dayjs/locale/zh')
require('dayjs/locale/zh-tw')

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

const THEMES = ['Light', 'Dark', 'Mango']

export const LANGS = [
  { locale: 'en', name: 'english', description: 'english' },
  { locale: 'es', name: 'spanish', description: 'spanish' },
  {
    locale: 'zh_tw',
    name: 'chinese-traditional',
    description: 'traditional chinese',
  },
  { locale: 'zh', name: 'chinese', description: 'simplified chinese' },
]

const CUSTOM_NODE = NODE_URLS.find((n) => n.label === 'Custom')

export const NODE_URL_KEY = 'node-url-key-0.6'
export const DEFAULT_MARKET_KEY = 'defaultMarket-0.3'
export const ORDERBOOK_FLASH_KEY = 'showOrderbookFlash'
export const DEFAULT_SPOT_MARGIN_KEY = 'defaultSpotMargin'
export const initialMarket = {
  base: 'SOL',
  kind: 'perp' as MarketKind,
  name: 'SOL-PERP',
  path: '/?name=SOL-PERP',
}

const SettingsModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation('common')
  const [settingsView, setSettingsView] = useState('')
  const { theme } = useTheme()
  const [savedLanguage] = useLocalStorageState('language', '')
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

  const savedLanguageName = useMemo(() => {
    const matchingLang = LANGS.find((l) => l.locale === savedLanguage)
    if (matchingLang) {
      return matchingLang.name
    }
  }, [savedLanguage])

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
            className="default-transition flex w-full items-center justify-between rounded-none border-t border-th-bkg-4 py-3 font-normal text-th-fgd-1 hover:text-th-primary focus:outline-none"
            onClick={() => setSettingsView('Default Market')}
          >
            <span>{t('default-market')}</span>
            <div className="flex items-center text-xs text-th-fgd-3">
              {defaultMarket.name}
              <ChevronRightIcon className="ml-1 h-5 w-5 text-th-fgd-1" />
            </div>
          </button>
          <button
            className="default-transition flex w-full items-center justify-between rounded-none border-t border-th-bkg-4 py-3 font-normal text-th-fgd-1 hover:text-th-primary focus:outline-none"
            onClick={() => setSettingsView('Theme')}
          >
            <span>{t('theme')}</span>
            <div className="flex items-center text-xs text-th-fgd-3">
              {theme}
              <ChevronRightIcon className="ml-1 h-5 w-5 text-th-fgd-1" />
            </div>
          </button>
          <button
            className="default-transition flex w-full items-center justify-between rounded-none border-t border-th-bkg-4 py-3 font-normal text-th-fgd-1 hover:text-th-primary focus:outline-none"
            onClick={() => setSettingsView('Language')}
          >
            <span>{t('language')}</span>
            {savedLanguageName ? (
              <div className="flex items-center text-xs text-th-fgd-3">
                {t(savedLanguageName)}
                <ChevronRightIcon className="ml-1 h-5 w-5 text-th-fgd-1" />
              </div>
            ) : null}
          </button>
          <button
            className="default-transition flex w-full items-center justify-between rounded-none border-t border-th-bkg-4 py-3 font-normal text-th-fgd-1 hover:text-th-primary focus:outline-none"
            onClick={() => setSettingsView('RPC Endpoint')}
          >
            <span>{t('rpc-endpoint')}</span>
            <div className="flex items-center text-xs text-th-fgd-3">
              {rpcEndpoint?.label}
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
    case 'Theme':
      return <ThemeSettings setSettingsView={setSettingsView} />
    case 'Language':
      return <LanguageSettings />
    default:
      return null
  }
}

const DefaultMarketSettings = ({ setSettingsView }) => {
  const { t } = useTranslation('common')
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const allMarkets = groupConfig
    ? [...groupConfig.spotMarkets, ...groupConfig.perpMarkets].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    : []
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
        value={rpcEndpoint?.label}
        onChange={(url) => handleSelectEndpointUrl(url)}
        className="w-full"
      >
        {NODE_URLS.map((node) => (
          <Select.Option key={node.value} value={node.value}>
            <span>{node.label}</span>
          </Select.Option>
        ))}
      </Select>
      {rpcEndpoint?.label === 'Custom' ? (
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

const ThemeSettings = ({ setSettingsView }) => {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation('common')

  return (
    <>
      <Label>{t('theme')}</Label>
      <ButtonGroup
        activeValue={theme}
        onChange={(t) => setTheme(t)}
        values={THEMES}
      />
      <Button onClick={() => setSettingsView('')} className="mt-6 w-full">
        <div className={`flex items-center justify-center`}>{t('save')}</div>
      </Button>
    </>
  )
}

const LanguageSettings = () => {
  const [savedLanguage, setSavedLanguage] = useLocalStorageState('language', '')
  const router = useRouter()
  const { pathname, asPath, query } = router
  const { t } = useTranslation('common')

  const handleLangChange = () => {
    router.push({ pathname, query }, asPath, { locale: savedLanguage })
    dayjs.locale(savedLanguage == 'zh_tw' ? 'zh-tw' : savedLanguage)
  }

  return (
    <>
      <Label>{t('language')}</Label>
      <ButtonGroup
        activeValue={savedLanguage}
        onChange={(l) => setSavedLanguage(l)}
        values={LANGS.map((val) => val.locale)}
        names={LANGS.map((val) => t(val.name))}
      />
      <Button onClick={() => handleLangChange()} className="mt-6 w-full">
        <div className={`flex items-center justify-center`}>{t('save')}</div>
      </Button>
    </>
  )
}
