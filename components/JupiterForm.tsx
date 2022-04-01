import {
  useEffect,
  useMemo,
  useState,
  FunctionComponent,
  useCallback,
} from 'react'
import { useJupiter, RouteInfo } from '@jup-ag/react-hook'
import { TOKEN_LIST_URL } from '@jup-ag/core'
import { PublicKey } from '@solana/web3.js'
import useMangoStore from '../stores/useMangoStore'
import { connectionSelector } from '../stores/selectors'
import sortBy from 'lodash/sortBy'
import sum from 'lodash/sum'
import {
  CogIcon,
  ExclamationCircleIcon,
  ExternalLinkIcon,
  InformationCircleIcon,
  SwitchVerticalIcon,
} from '@heroicons/react/outline'
import { ChevronDownIcon, SwitchHorizontalIcon } from '@heroicons/react/solid'
import { abbreviateAddress } from '../utils'
import SwapTokenSelect from './SwapTokenSelect'
import { notify } from '../utils/notifications'
import { Token } from '../@types/types'
import {
  getTokenAccountsByOwnerWithWrappedSol,
  nativeToUi,
  zeroKey,
} from '@blockworks-foundation/mango-client'
import Button, { IconButton, LinkButton } from './Button'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import useLocalStorageState from '../hooks/useLocalStorageState'
import Modal from './Modal'
import { ElementTitle } from './styles'
import { RefreshClockwiseIcon, WalletIcon } from './icons'
import Tooltip from './Tooltip'
import SwapSettingsModal from './SwapSettingsModal'
import SwapTokenInfo from './SwapTokenInfo'
import { numberFormatter } from './SwapTokenInfo'
import { useTranslation } from 'next-i18next'
import Tabs from './Tabs'
import SwapTokenInsights from './SwapTokenInsights'
import { useWallet } from '@solana/wallet-adapter-react'
import { handleWalletConnect } from 'components/ConnectWalletButton'

const TABS = ['Market Data', 'Performance Insights']

type UseJupiterProps = Parameters<typeof useJupiter>[0]
type UseFormValue = Omit<UseJupiterProps, 'amount'> & {
  amount: null | number
}

const JupiterForm: FunctionComponent = () => {
  const { t } = useTranslation(['common', 'swap'])
  const { wallet, publicKey, connected, signAllTransactions, signTransaction } =
    useWallet()
  const connection = useMangoStore(connectionSelector)
  const [showSettings, setShowSettings] = useState(false)
  const [depositAndFee, setDepositAndFee] = useState<any | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo | null>(null)
  const [showInputTokenSelect, setShowInputTokenSelect] = useState(false)
  const [showOutputTokenSelect, setShowOutputTokenSelect] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const [tokens, setTokens] = useState<Token[]>([])
  const [tokenPrices, setTokenPrices] = useState<any | null>(null)
  const [coinGeckoList, setCoinGeckoList] = useState<any[] | null>(null)
  const [walletTokens, setWalletTokens] = useState<any[]>([])
  const [slippage, setSlippage] = useState(0.5)
  const [formValue, setFormValue] = useState<UseFormValue>({
    amount: null,
    inputMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    outputMint: new PublicKey('MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac'),
    slippage,
  })
  const [hasSwapped, setHasSwapped] = useLocalStorageState('hasSwapped', false)
  const [showWalletDraw, setShowWalletDraw] = useState(false)
  const [walletTokenPrices, setWalletTokenPrices] = useState<any[] | null>(null)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false
  const [feeValue, setFeeValue] = useState<number | null>(null)
  const [showRoutesModal, setShowRoutesModal] = useState(false)
  const [loadWalletTokens, setLoadWalletTokens] = useState(false)
  const [swapRate, setSwapRate] = useState(false)
  const [activeTab, setActiveTab] = useState('Market Data')

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  const fetchWalletTokens = useCallback(async () => {
    if (!publicKey) {
      return
    }
    const ownedTokens: any[] = []
    const ownedTokenAccounts = await getTokenAccountsByOwnerWithWrappedSol(
      connection,
      publicKey
    )

    ownedTokenAccounts.forEach((account) => {
      const decimals = tokens.find(
        (t) => t?.address === account.mint.toString()
      )?.decimals

      const uiBalance = nativeToUi(account.amount, decimals || 6)
      ownedTokens.push({ account, uiBalance })
    })
    setWalletTokens(ownedTokens)
  }, [publicKey, connection, tokens])

  // @ts-ignore
  const [inputTokenInfo, outputTokenInfo] = useMemo(() => {
    return [
      tokens.find(
        (item) => item?.address === formValue.inputMint?.toBase58() || ''
      ),
      tokens.find(
        (item) => item?.address === formValue.outputMint?.toBase58() || ''
      ),
    ]
  }, [
    formValue.inputMint?.toBase58(),
    formValue.outputMint?.toBase58(),
    tokens,
  ])

  useEffect(() => {
    if (width >= 1680) {
      setShowWalletDraw(true)
    }
  }, [])

  useEffect(() => {
    const fetchCoinGeckoList = async () => {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/list'
      )
      const data = await response.json()
      setCoinGeckoList(data)
    }

    fetchCoinGeckoList()
  }, [])

  useEffect(() => {
    if (connected) {
      fetchWalletTokens()
    }
  }, [connected, fetchWalletTokens])

  useEffect(() => {
    if (!coinGeckoList?.length) return
    setTokenPrices(null)
    const fetchTokenPrices = async () => {
      const inputId = coinGeckoList.find((x) =>
        inputTokenInfos?.extensions?.coingeckoId
          ? x?.id === inputTokenInfos.extensions.coingeckoId
          : x?.symbol?.toLowerCase() === inputTokenInfo?.symbol?.toLowerCase()
      )?.id
      const outputId = coinGeckoList.find((x) =>
        outputTokenInfos?.extensions?.coingeckoId
          ? x?.id === outputTokenInfos.extensions.coingeckoId
          : x?.symbol?.toLowerCase() === outputTokenInfo?.symbol?.toLowerCase()
      )?.id

      if (inputId && outputId) {
        const results = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${inputId},${outputId}&vs_currencies=usd`
        )
        const json = await results.json()
        if (json[inputId]?.usd && json[outputId]?.usd) {
          setTokenPrices({
            inputTokenPrice: json[inputId].usd,
            outputTokenPrice: json[outputId].usd,
          })
        }
      }
    }

    if (inputTokenInfo && outputTokenInfo) {
      fetchTokenPrices()
    }
  }, [inputTokenInfo, outputTokenInfo, coinGeckoList])

  const amountInDecimal = useMemo(() => {
    if (typeof formValue?.amount === 'number') {
      return formValue.amount * 10 ** (inputTokenInfo?.decimals || 1)
    }
  }, [inputTokenInfo, formValue.amount])

  const { routeMap, allTokenMints, routes, loading, exchange, error, refresh } =
    useJupiter({
      ...formValue,
      amount: amountInDecimal ? amountInDecimal : 0,
      slippage,
    })

  useEffect(() => {
    // Fetch token list from Jupiter API
    fetch(TOKEN_LIST_URL['mainnet-beta'])
      .then((response) => response.json())
      .then((result) => {
        const tokens = allTokenMints.map((mint) =>
          result.find((item) => item?.address === mint)
        )
        setTokens(tokens)
      })
  }, [allTokenMints])

  useEffect(() => {
    if (routes) {
      setSelectedRoute(routes[0])
    }
  }, [routes])

  useEffect(() => {
    const getDepositAndFee = async () => {
      const fees = await selectedRoute?.getDepositAndFee()
      if (fees) {
        setDepositAndFee(fees)
      }
    }
    if (selectedRoute && connected) {
      getDepositAndFee()
    }
  }, [selectedRoute])

  const outputTokenMints: any[] = useMemo(() => {
    if (routeMap.size && formValue.inputMint) {
      const routeOptions = routeMap.get(formValue.inputMint.toString())

      const routeOptionTokens =
        routeOptions?.map((address) => {
          return tokens.find((t) => {
            return t.address === address
          })
        }) ?? []

      return routeOptionTokens
    } else {
      return sortedTokenMints
    }
  }, [routeMap, tokens, formValue.inputMint])

  const handleConnect = useCallback(() => {
    if (wallet) {
      handleWalletConnect(wallet)
    }
  }, [wallet])

  const inputWalletBalance = () => {
    if (walletTokens.length) {
      const walletToken = walletTokens.filter((t) => {
        return t.account.mint.toString() === inputTokenInfo?.address
      })
      const largestTokenAccount = sortBy(walletToken, 'uiBalance').reverse()[0]
      return largestTokenAccount?.uiBalance || 0.0
    }

    return 0.0
  }

  const outputWalletBalance = () => {
    if (walletTokens.length) {
      const walletToken = walletTokens.filter((t) => {
        return t.account.mint.toString() === outputTokenInfo?.address
      })
      const largestTokenAccount = sortBy(walletToken, 'uiBalance').reverse()[0]
      return largestTokenAccount?.uiBalance || 0.0
    }
    return 0.0
  }

  const [walletTokensWithInfos] = useMemo(() => {
    const userTokens: any[] = []
    tokens.map((item) => {
      const found = walletTokens.find(
        (token) => token.account.mint.toBase58() === item?.address
      )
      if (found) {
        userTokens.push({ ...found, item })
      }
    })
    return [userTokens]
  }, [walletTokens, tokens])

  const getWalletTokenPrices = async () => {
    const ids = walletTokensWithInfos.map(
      (token) => token.item.extensions?.coingeckoId
    )
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.toString()}&vs_currencies=usd`
    )
    const data = await response.json()
    setWalletTokenPrices(data)
  }

  const refreshWallet = async () => {
    setLoadWalletTokens(true)
    await fetchWalletTokens()
    await getWalletTokenPrices()
    setLoadWalletTokens(false)
  }

  const getSwapFeeTokenValue = async () => {
    if (!selectedRoute) return
    const mints = selectedRoute.marketInfos.map((info) => info.lpFee.mint)
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${mints.toString()}&vs_currencies=usd`
    )
    const data = await response.json()

    const feeValue = selectedRoute.marketInfos.reduce((a, c) => {
      const feeToken = tokens.find((item) => item?.address === c.lpFee?.mint)
      // FIXME: Remove ts-ignore possibly move the logic out of a reduce
      // @ts-ignore
      const amount = c.lpFee?.amount / Math.pow(10, feeToken.decimals)
      if (data[c.lpFee?.mint]) {
        return a + data[c.lpFee?.mint].usd * amount
      }
      if (c.lpFee?.mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
        return a + 1 * amount
      }
    }, 0)
    if (feeValue) {
      setFeeValue(feeValue)
    }
  }

  useEffect(() => {
    if (selectedRoute) {
      getSwapFeeTokenValue()
    }
  }, [selectedRoute])

  useEffect(() => {
    getWalletTokenPrices()
  }, [walletTokensWithInfos])

  const handleSelectRoute = (route) => {
    setShowRoutesModal(false)
    setSelectedRoute(route)
  }

  const handleSwitchMints = () => {
    setFormValue((val) => ({
      ...val,
      inputMint: formValue.outputMint,
      outputMint: formValue.inputMint,
    }))
  }

  const sortedTokenMints = sortBy(tokens, (token) => {
    return token.symbol.toLowerCase()
  })

  const outAmountUi = selectedRoute
    ? selectedRoute.outAmount / 10 ** (outputTokenInfo?.decimals || 1)
    : null

  const swapDisabled = loading || !selectedRoute || routes?.length === 0

  const inputTokenInfos = inputTokenInfo ? (inputTokenInfo as any) : null
  const outputTokenInfos = outputTokenInfo ? (outputTokenInfo as any) : null

  return (
    <div className="grid grid-cols-12 lg:space-x-4">
      <div className="col-span-12 xl:col-span-10 xl:col-start-2 ">
        <div className="flex flex-col md:flex-row md:space-x-6">
          <div className="w-full md:w-1/2  lg:w-1/3">
            <div className="relative">
              {connected &&
              walletTokensWithInfos.length &&
              walletTokenPrices &&
              !isMobile ? (
                <div
                  className={`top-22 fixed right-0 z-30 flex w-80 transform overflow-hidden transition-all duration-700 ease-in-out ${
                    showWalletDraw ? 'translate-x-0' : 'mr-16 translate-x-full'
                  }`}
                >
                  <aside
                    className={`ml-16 w-64 rounded-l-md bg-th-bkg-3 pb-4 pt-6`}
                  >
                    <div className="thin-scroll max-h-[480px] overflow-auto">
                      <div className="flex items-center justify-between px-4 pb-2">
                        <div>
                          <div className="text-base font-bold text-th-fgd-1">
                            {t('wallet')}
                          </div>
                          {publicKey ? (
                            <a
                              className="flex items-center text-xs text-th-fgd-3 hover:text-th-fgd-2"
                              href={`https://explorer.solana.com/address/${publicKey}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {abbreviateAddress(publicKey)}
                              <ExternalLinkIcon className="ml-0.5 -mt-0.5 h-3.5 w-3.5" />
                            </a>
                          ) : null}
                        </div>
                        <IconButton onClick={() => refreshWallet()}>
                          <RefreshClockwiseIcon
                            className={`h-4 w-4 ${
                              loadWalletTokens && 'animate-spin'
                            }`}
                          />
                        </IconButton>
                      </div>
                      {walletTokensWithInfos
                        .sort((a, b) => {
                          const aId = a.item.extensions?.coingeckoId
                          const bId = b.item.extensions?.coingeckoId
                          return (
                            b.uiBalance * walletTokenPrices[bId]?.usd -
                            a.uiBalance * walletTokenPrices[aId]?.usd
                          )
                        })
                        .map((token) => {
                          const geckoId = token.item.extensions?.coingeckoId
                          return (
                            <div
                              className="default-transition flex cursor-pointer items-center justify-between px-4 py-2 hover:bg-th-bkg-4"
                              key={geckoId}
                              onClick={() =>
                                setFormValue((val) => ({
                                  ...val,
                                  inputMint: new PublicKey(token?.item.address),
                                }))
                              }
                            >
                              <div className="flex items-center">
                                {token.item.logoURI ? (
                                  <img
                                    className="rounded-full"
                                    src={token.item.logoURI}
                                    width="24"
                                    height="24"
                                    alt={token.item.symbol}
                                  />
                                ) : null}
                                <div>
                                  <div className="ml-2 text-th-fgd-1">
                                    {token.item.symbol}
                                  </div>
                                  {walletTokenPrices ? (
                                    <div className="ml-2 text-xs text-th-fgd-4">
                                      {walletTokenPrices[geckoId]
                                        ? `$${walletTokenPrices[geckoId].usd}`
                                        : t('swap:unavailable')}
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <div>
                                <div className="text-right text-th-fgd-1">
                                  {token.uiBalance.toLocaleString(undefined, {
                                    maximumSignificantDigits: 6,
                                  })}
                                </div>
                                <div className="text-right text-xs text-th-fgd-4">
                                  {walletTokenPrices[geckoId]
                                    ? `$${(
                                        token.uiBalance *
                                        walletTokenPrices[geckoId].usd
                                      ).toLocaleString(undefined, {
                                        maximumFractionDigits: 2,
                                      })}`
                                    : '?'}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </aside>
                  <button
                    className="absolute right-64 top-20 rounded-r-none bg-th-bkg-4 p-3 text-th-fgd-1 hover:text-th-primary"
                    onClick={() => setShowWalletDraw(!showWalletDraw)}
                  >
                    <WalletIcon className="h-5 w-5" />
                  </button>
                </div>
              ) : null}
              <div className="rounded-lg bg-th-bkg-2 p-6">
                <div className="flex justify-between">
                  <label
                    htmlFor="inputMint"
                    className="block text-sm font-semibold"
                  >
                    {t('swap:pay')}
                  </label>
                  <div className="space-x-3">
                    <label htmlFor="amount" className="text-xs text-th-fgd-3">
                      {t('swap:bal')} {inputWalletBalance()}
                    </label>
                    {connected ? (
                      <>
                        <LinkButton
                          className="text-xs text-th-primary"
                          onClick={() => {
                            setFormValue((val) => ({
                              ...val,
                              amount: inputWalletBalance(),
                            }))
                          }}
                        >
                          {t('max')}
                        </LinkButton>
                      </>
                    ) : null}
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-2">
                  <div className="col-span-1">
                    <button
                      className="-ml-2 p-2 hover:bg-th-bkg-3"
                      onClick={() => setShowInputTokenSelect(true)}
                    >
                      <div className="flex h-8 items-center">
                        {inputTokenInfo?.logoURI ? (
                          <img
                            className="rounded-full"
                            src={inputTokenInfo?.logoURI}
                            width="24"
                            height="24"
                            alt={inputTokenInfo?.symbol}
                          />
                        ) : null}
                        <div className="ml-2 text-base xl:text-lg">
                          {inputTokenInfo?.symbol}
                        </div>
                        <ChevronDownIcon className="ml-1 h-5 w-5 flex-shrink-0 text-th-fgd-3" />
                      </div>
                    </button>
                  </div>
                  <div className="col-span-1">
                    <input
                      name="amount"
                      id="amount"
                      className="default-transition h-12 w-full rounded-md border border-th-bkg-4 bg-th-bkg-1 pr-4 text-right text-base font-bold tracking-wide hover:border-th-fgd-4 focus:border-th-fgd-4 focus:outline-none"
                      value={formValue.amount || ''}
                      placeholder="0.00"
                      type="number"
                      pattern="[0-9]*"
                      onInput={(e: any) => {
                        let newValue = e.target?.value || 0
                        newValue = Number.isNaN(newValue) ? 0 : newValue

                        setFormValue((val) => ({
                          ...val,
                          amount: newValue,
                        }))
                      }}
                    />
                  </div>
                </div>

                <div className="my-4 flex justify-center">
                  <button onClick={handleSwitchMints}>
                    <SwitchVerticalIcon className="default-transition h-8 w-8 rounded-full bg-th-bkg-4 p-1.5 text-th-fgd-1 hover:text-th-primary" />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label htmlFor="outputMint" className="font-semibold">
                    {t('swap:receive')}
                  </label>
                  <span className="text-xs text-th-fgd-3">
                    {t('swap:bal')} {outputWalletBalance()}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2">
                  <div className="col-span-1">
                    <button
                      className="-ml-2 flex h-12 items-center p-2 hover:bg-th-bkg-3"
                      onClick={() => setShowOutputTokenSelect(true)}
                    >
                      {outputTokenInfo?.logoURI ? (
                        <img
                          className="rounded-full"
                          src={outputTokenInfo?.logoURI}
                          width="24"
                          height="24"
                          alt={outputTokenInfo?.symbol}
                        />
                      ) : null}
                      <div className="ml-2 text-base xl:text-lg">
                        {outputTokenInfo?.symbol}
                      </div>
                      <ChevronDownIcon className="ml-1 h-5 w-5 flex-shrink-0 text-th-fgd-3" />
                    </button>
                  </div>
                  <div className="relative col-span-1">
                    <input
                      name="amount"
                      id="amount"
                      className="h-12 w-full cursor-not-allowed rounded-md border border-th-bkg-4 bg-th-bkg-3 pr-4 text-right text-lg font-bold tracking-wide focus:outline-none"
                      disabled
                      placeholder="0.00"
                      value={
                        selectedRoute?.outAmount && formValue.amount
                          ? Intl.NumberFormat('en', {
                              minimumSignificantDigits: 1,
                              maximumSignificantDigits: 6,
                            }).format(
                              selectedRoute?.outAmount /
                                10 ** (outputTokenInfo?.decimals || 1)
                            )
                          : ''
                      }
                    />
                    {selectedRoute?.outAmount &&
                    formValue.amount &&
                    tokenPrices?.outputTokenPrice ? (
                      <div className="absolute right-0 mt-1 text-xs text-th-fgd-3">
                        ≈ $
                        {(
                          (selectedRoute?.outAmount /
                            10 ** (outputTokenInfo?.decimals || 1)) *
                          tokenPrices?.outputTokenPrice
                        ).toFixed(2)}
                      </div>
                    ) : null}
                  </div>
                </div>

                {routes?.length && selectedRoute ? (
                  <div className="mt-8 text-xs text-th-fgd-3">
                    <div className="relative mb-4 rounded-md border border-th-bkg-4 px-3 pb-4 pt-4">
                      {selectedRoute === routes[0] ? (
                        <div className="absolute -top-2 rounded-sm bg-th-primary px-1 text-xs font-bold text-th-bkg-1">
                          {t('swap:best-swap')}
                        </div>
                      ) : null}
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="overflow-ellipsis whitespace-nowrap text-sm font-bold text-th-fgd-1">
                            {selectedRoute?.marketInfos.map((info, index) => {
                              let includeSeparator = false
                              if (
                                selectedRoute?.marketInfos.length > 1 &&
                                index !== selectedRoute?.marketInfos.length - 1
                              ) {
                                includeSeparator = true
                              }
                              return (
                                <span key={index}>{`${
                                  info.marketMeta.amm.label
                                } ${includeSeparator ? 'x ' : ''}`}</span>
                              )
                            })}
                          </span>
                          <div className="mr-2 mt-0.5 text-xs font-normal text-th-fgd-3">
                            {inputTokenInfo?.symbol} →{' '}
                            {selectedRoute?.marketInfos.map((r, index) => {
                              const showArrow =
                                index !== selectedRoute?.marketInfos.length - 1
                                  ? true
                                  : false
                              return (
                                <span key={index}>
                                  <span>
                                    {
                                      tokens.find(
                                        (item) =>
                                          item?.address ===
                                          r?.outputMint?.toString()
                                      )?.symbol
                                    }
                                  </span>
                                  {showArrow ? ' → ' : ''}
                                </span>
                              )
                            })}
                          </div>
                        </div>
                        <Button
                          className="rounded-md border border-th-fgd-4 bg-transparent px-2 pb-1 pt-1 text-center text-xs font-normal text-th-fgd-3"
                          disabled={routes?.length === 1}
                          onClick={() => setShowRoutesModal(true)}
                        >
                          {t('swap:routes-found', {
                            numberOfRoutes: routes?.length,
                          })}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2 px-3">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="text-sm font-bold text-th-fgd-1">
                          {t('swap:swap-details')}
                        </div>
                        <div className="flex items-center space-x-2">
                          <IconButton onClick={() => refresh()}>
                            <RefreshClockwiseIcon
                              className={`h-4 w-4 ${
                                loading ? 'animate-spin' : ''
                              }`}
                            />
                          </IconButton>
                          <IconButton onClick={() => setShowSettings(true)}>
                            <CogIcon className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </div>
                      {outAmountUi && formValue?.amount ? (
                        <div className="flex justify-between">
                          <span>{t('swap:rate')}</span>
                          <div>
                            <div className="flex items-center justify-end">
                              <div className="text-right text-th-fgd-1">
                                {swapRate ? (
                                  <>
                                    1 {inputTokenInfo?.symbol} ≈{' '}
                                    {numberFormatter.format(
                                      outAmountUi / formValue?.amount
                                    )}{' '}
                                    {outputTokenInfo?.symbol}
                                  </>
                                ) : (
                                  <>
                                    1 {outputTokenInfo?.symbol} ≈{' '}
                                    {numberFormatter.format(
                                      formValue?.amount / outAmountUi
                                    )}{' '}
                                    {inputTokenInfo?.symbol}
                                  </>
                                )}
                              </div>
                              <SwitchHorizontalIcon
                                className="default-transition ml-1 h-4 w-4 cursor-pointer text-th-fgd-3 hover:text-th-fgd-2"
                                onClick={() => setSwapRate(!swapRate)}
                              />
                            </div>
                            {tokenPrices?.outputTokenPrice &&
                            tokenPrices?.inputTokenPrice ? (
                              <div
                                className={`text-right ${
                                  ((formValue?.amount / outAmountUi -
                                    tokenPrices?.outputTokenPrice /
                                      tokenPrices?.inputTokenPrice) /
                                    (formValue?.amount / outAmountUi)) *
                                    100 <=
                                  0
                                    ? 'text-th-green'
                                    : 'text-th-red'
                                }`}
                              >
                                {Math.abs(
                                  ((formValue?.amount / outAmountUi -
                                    tokenPrices?.outputTokenPrice /
                                      tokenPrices?.inputTokenPrice) /
                                    (formValue?.amount / outAmountUi)) *
                                    100
                                ).toFixed(1)}
                                %{' '}
                                <span className="text-th-fgd-4">{`${
                                  ((formValue?.amount / outAmountUi -
                                    tokenPrices?.outputTokenPrice /
                                      tokenPrices?.inputTokenPrice) /
                                    (formValue?.amount / outAmountUi)) *
                                    100 <=
                                  0
                                    ? t('swap:cheaper')
                                    : t('swap:more-expensive')
                                } CoinGecko`}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                      <div className="flex justify-between">
                        <span>{t('swap:price-impact')}</span>
                        <div className="text-right text-th-fgd-1">
                          {selectedRoute?.priceImpactPct * 100 < 0.1
                            ? '< 0.1%'
                            : `~ ${(
                                selectedRoute?.priceImpactPct * 100
                              ).toFixed(4)}%`}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('swap:minimum-received')}</span>
                        {outputTokenInfo?.decimals ? (
                          <div className="text-right text-th-fgd-1">
                            {numberFormatter.format(
                              selectedRoute?.outAmountWithSlippage /
                                10 ** outputTokenInfo.decimals || 1
                            )}{' '}
                            {outputTokenInfo?.symbol}
                          </div>
                        ) : null}
                      </div>
                      {typeof feeValue === 'number' ? (
                        <div className="flex justify-between">
                          <span>{t('swap:swap-fee')}</span>
                          <div className="flex items-center">
                            <div className="text-right text-th-fgd-1">
                              ≈ ${feeValue?.toFixed(2)}
                            </div>
                            <Tooltip
                              content={
                                <div className="space-y-2.5">
                                  {selectedRoute?.marketInfos.map(
                                    (info, index) => {
                                      const feeToken = tokens.find(
                                        (item) =>
                                          item?.address === info.lpFee?.mint
                                      )
                                      return (
                                        <div key={index}>
                                          <span>
                                            {t('swap:fees-paid-to', {
                                              feeRecipient:
                                                info.marketMeta?.amm?.label,
                                            })}
                                          </span>
                                          {feeToken?.decimals && (
                                            <div className="text-th-fgd-1">
                                              {(
                                                info.lpFee?.amount /
                                                Math.pow(10, feeToken?.decimals)
                                              ).toFixed(6)}{' '}
                                              {feeToken?.symbol} (
                                              {info.lpFee?.pct * 100}
                                              %)
                                            </div>
                                          )}
                                        </div>
                                      )
                                    }
                                  )}
                                </div>
                              }
                              placement={'left'}
                            >
                              <InformationCircleIcon className="ml-1.5 h-3.5 w-3.5 cursor-help text-th-primary" />
                            </Tooltip>
                          </div>
                        </div>
                      ) : (
                        selectedRoute?.marketInfos.map((info, index) => {
                          const feeToken = tokens.find(
                            (item) => item?.address === info.lpFee?.mint
                          )
                          return (
                            <div className="flex justify-between" key={index}>
                              <span>
                                {t('swap:fees-paid-to', {
                                  feeRecipient: info.marketMeta?.amm?.label,
                                })}
                              </span>
                              {feeToken?.decimals && (
                                <div className="text-right text-th-fgd-1">
                                  {(
                                    info.lpFee?.amount /
                                    Math.pow(10, feeToken.decimals)
                                  ).toFixed(6)}{' '}
                                  {feeToken?.symbol} ({info.lpFee?.pct * 100}%)
                                </div>
                              )}
                            </div>
                          )
                        })
                      )}
                      {connected ? (
                        <>
                          <div className="flex justify-between">
                            <span>{t('swap:transaction-fee')}</span>
                            <div className="text-right text-th-fgd-1">
                              {depositAndFee
                                ? depositAndFee?.signatureFee / Math.pow(10, 9)
                                : '-'}{' '}
                              SOL
                            </div>
                          </div>
                          {depositAndFee?.ataDepositLength ||
                          depositAndFee?.openOrdersDeposits?.length ? (
                            <div className="flex justify-between">
                              <div className="flex items-center">
                                <span>{t('deposit')}</span>
                                <Tooltip
                                  content={
                                    <>
                                      {depositAndFee?.ataDepositLength ? (
                                        <div>{t('need-ata-account')}</div>
                                      ) : null}
                                      {depositAndFee?.openOrdersDeposits
                                        ?.length ? (
                                        <div className="mt-2">
                                          {t('swap:serum-requires-openorders')}{' '}
                                          <a
                                            href="https://docs.google.com/document/d/1qEWc_Bmc1aAxyCUcilKB4ZYpOu3B0BxIbe__dRYmVns/"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            {t('swap:heres-how')}
                                          </a>
                                        </div>
                                      ) : null}
                                    </>
                                  }
                                  placement={'left'}
                                >
                                  <InformationCircleIcon className="ml-1.5 h-3.5 w-3.5 cursor-help text-th-primary" />
                                </Tooltip>
                              </div>
                              <div>
                                {depositAndFee?.ataDepositLength ? (
                                  <div className="text-right text-th-fgd-1">
                                    {depositAndFee?.ataDepositLength === 1
                                      ? t('swap:ata-deposit-details', {
                                          cost: (
                                            depositAndFee?.ataDeposit /
                                            Math.pow(10, 9)
                                          ).toFixed(5),
                                          count:
                                            depositAndFee?.ataDepositLength,
                                        })
                                      : t('swap:ata-deposit-details_plural', {
                                          cost: (
                                            depositAndFee?.ataDeposit /
                                            Math.pow(10, 9)
                                          ).toFixed(5),
                                          count:
                                            depositAndFee?.ataDepositLength,
                                        })}
                                  </div>
                                ) : null}
                                {depositAndFee?.openOrdersDeposits?.length ? (
                                  <div className="text-right text-th-fgd-1">
                                    {depositAndFee?.openOrdersDeposits.length >
                                    1
                                      ? t('swap:serum-details_plural', {
                                          cost: (
                                            sum(
                                              depositAndFee?.openOrdersDeposits
                                            ) / Math.pow(10, 9)
                                          ).toFixed(5),
                                          count:
                                            depositAndFee?.openOrdersDeposits
                                              .length,
                                        })
                                      : t('swap:serum-details', {
                                          cost: (
                                            sum(
                                              depositAndFee?.openOrdersDeposits
                                            ) / Math.pow(10, 9)
                                          ).toFixed(5),
                                          count:
                                            depositAndFee?.openOrdersDeposits
                                              .length,
                                        })}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {error && (
                  <div className="mt-2 flex items-center justify-center text-th-red">
                    <ExclamationCircleIcon className="mr-1.5 h-5 w-5" />
                    {t('swap:jupiter-error')}
                  </div>
                )}
                <Button
                  disabled={swapDisabled}
                  onClick={async () => {
                    if (!connected && zeroKey !== publicKey) {
                      handleConnect()
                    } else if (
                      !loading &&
                      selectedRoute &&
                      connected &&
                      wallet &&
                      signAllTransactions &&
                      signTransaction
                    ) {
                      setSwapping(true)
                      let txCount = 1
                      let errorTxid
                      const swapResult = await exchange({
                        wallet: {
                          sendTransaction: wallet?.adapter?.sendTransaction,
                          publicKey: wallet?.adapter?.publicKey,
                          signAllTransactions,
                          signTransaction,
                        },
                        routeInfo: selectedRoute,
                        onTransaction: async (txid, totalTxs) => {
                          console.log('txid, totalTxs', txid, totalTxs)
                          if (txCount === totalTxs) {
                            errorTxid = txid
                            notify({
                              type: 'confirm',
                              title: 'Confirming Transaction',
                              txid,
                            })
                          }
                          await connection.confirmTransaction(txid, 'confirmed')

                          txCount++
                          return await connection.getTransaction(txid, {
                            commitment: 'confirmed',
                          })
                        },
                      })
                      console.log('swapResult', swapResult)

                      setSwapping(false)
                      fetchWalletTokens()
                      if ('error' in swapResult) {
                        console.log('Error:', swapResult.error)
                        notify({
                          type: 'error',
                          title: swapResult?.error?.name
                            ? swapResult.error.name
                            : '',
                          description: swapResult?.error?.message,
                          txid: errorTxid,
                        })
                      } else if ('txid' in swapResult) {
                        const description =
                          swapResult?.inputAmount && swapResult.outputAmount
                            ? `Swapped ${
                                swapResult.inputAmount /
                                10 ** (inputTokenInfo?.decimals || 1)
                              } ${inputTokenInfo?.symbol} to ${
                                swapResult.outputAmount /
                                10 ** (outputTokenInfo?.decimals || 1)
                              } ${outputTokenInfo?.symbol}`
                            : ''
                        notify({
                          type: 'success',
                          title: 'Swap Successful',
                          description,
                          txid: swapResult.txid,
                        })
                        setFormValue((val) => ({
                          ...val,
                          amount: null,
                        }))
                      }
                    }
                  }}
                  className="mt-6 h-12 w-full text-base"
                >
                  {connected
                    ? swapping
                      ? t('swap:swapping')
                      : t('swap')
                    : t('connect-wallet')}
                </Button>
              </div>

              {showRoutesModal ? (
                <Modal
                  isOpen={showRoutesModal}
                  onClose={() => setShowRoutesModal(false)}
                >
                  <div className="mb-4 text-center text-lg font-bold text-th-fgd-1">
                    {t('swap:routes-found', {
                      numberOfRoutes: routes?.length,
                    })}
                  </div>
                  <div className="thin-scroll max-h-96 overflow-y-auto overflow-x-hidden pr-1">
                    {routes?.map((route, index) => {
                      const selected = selectedRoute === route
                      return (
                        <div
                          key={index}
                          className={`default-transition mb-2 rounded border bg-th-bkg-3 hover:bg-th-bkg-4 ${
                            selected
                              ? 'border-th-primary text-th-primary hover:border-th-primary'
                              : 'border-transparent text-th-fgd-1'
                          }`}
                        >
                          <button
                            className="w-full p-4"
                            onClick={() => handleSelectRoute(route)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col text-left">
                                <div className="overflow-ellipsis whitespace-nowrap">
                                  {route.marketInfos.map((info, index) => {
                                    let includeSeparator = false
                                    if (
                                      route.marketInfos.length > 1 &&
                                      index !== route.marketInfos.length - 1
                                    ) {
                                      includeSeparator = true
                                    }
                                    return (
                                      <span key={index}>{`${
                                        info.marketMeta.amm.label
                                      } ${includeSeparator ? 'x ' : ''}`}</span>
                                    )
                                  })}
                                </div>
                                <div className="text-xs font-normal text-th-fgd-4">
                                  {inputTokenInfo?.symbol} →{' '}
                                  {route.marketInfos.map((r, index) => {
                                    const showArrow =
                                      index !== route.marketInfos.length - 1
                                        ? true
                                        : false
                                    return (
                                      <span key={index}>
                                        <span>
                                          {
                                            tokens.find(
                                              (item) =>
                                                item?.address ===
                                                r?.outputMint?.toString()
                                            )?.symbol
                                          }
                                        </span>
                                        {showArrow ? ' → ' : ''}
                                      </span>
                                    )
                                  })}
                                </div>
                              </div>
                              <div className="text-lg">
                                {numberFormatter.format(
                                  route.outAmount /
                                    10 ** (outputTokenInfo?.decimals || 1)
                                )}
                              </div>
                            </div>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </Modal>
              ) : null}
              {showInputTokenSelect ? (
                <SwapTokenSelect
                  isOpen={showInputTokenSelect}
                  onClose={() => setShowInputTokenSelect(false)}
                  sortedTokenMints={sortedTokenMints}
                  onTokenSelect={(token) => {
                    setShowInputTokenSelect(false)
                    setFormValue((val) => ({
                      ...val,
                      inputMint: new PublicKey(token?.address),
                    }))
                  }}
                />
              ) : null}
              {showOutputTokenSelect ? (
                <SwapTokenSelect
                  isOpen={showOutputTokenSelect}
                  onClose={() => setShowOutputTokenSelect(false)}
                  sortedTokenMints={outputTokenMints}
                  onTokenSelect={(token) => {
                    setShowOutputTokenSelect(false)
                    setFormValue((val) => ({
                      ...val,
                      outputMint: new PublicKey(token?.address),
                    }))
                  }}
                />
              ) : null}
              {showSettings ? (
                <SwapSettingsModal
                  isOpen={showSettings}
                  onClose={() => setShowSettings(false)}
                  slippage={slippage}
                  setSlippage={setSlippage}
                />
              ) : null}
              {connected && !hasSwapped ? (
                <Modal isOpen={!hasSwapped} onClose={() => setHasSwapped(true)}>
                  <ElementTitle>{t('swap:get-started')}</ElementTitle>
                  <div className="flex flex-col justify-center">
                    <div className="text-center text-th-fgd-3">
                      {t('swap-in-wallet')}
                    </div>
                  </div>
                </Modal>
              ) : null}
              {showInputTokenSelect ? (
                <SwapTokenSelect
                  isOpen={showInputTokenSelect}
                  onClose={() => setShowInputTokenSelect(false)}
                  sortedTokenMints={sortedTokenMints}
                  onTokenSelect={(token) => {
                    setShowInputTokenSelect(false)
                    setFormValue((val) => ({
                      ...val,
                      inputMint: new PublicKey(token?.address),
                    }))
                  }}
                />
              ) : null}
              {showOutputTokenSelect ? (
                <SwapTokenSelect
                  isOpen={showOutputTokenSelect}
                  onClose={() => setShowOutputTokenSelect(false)}
                  sortedTokenMints={outputTokenMints}
                  onTokenSelect={(token) => {
                    setShowOutputTokenSelect(false)
                    setFormValue((val) => ({
                      ...val,
                      outputMint: new PublicKey(token?.address),
                    }))
                  }}
                />
              ) : null}
            </div>
          </div>
          <div className="w-full py-4 md:w-1/2 md:py-0 lg:w-2/3">
            <Tabs
              activeTab={activeTab}
              onChange={handleTabChange}
              tabs={TABS}
            />
            {inputTokenInfo &&
            outputTokenInfo &&
            activeTab === 'Market Data' ? (
              <SwapTokenInfo
                inputTokenId={inputTokenInfos?.extensions?.coingeckoId}
                outputTokenId={outputTokenInfos?.extensions?.coingeckoId}
              />
            ) : null}
            {activeTab === 'Performance Insights' ? (
              <SwapTokenInsights
                formState={formValue}
                jupiterTokens={tokens}
                setOutputToken={setFormValue}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default JupiterForm
