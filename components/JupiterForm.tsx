import {
  useEffect,
  useMemo,
  useState,
  FunctionComponent,
  useCallback,
} from 'react'
// import dayjs from 'dayjs'
import { useJupiter, RouteInfo } from '@jup-ag/react-hook'
import { TOKEN_LIST_URL } from '@jup-ag/core'
import { PublicKey } from '@solana/web3.js'
// import Image from 'next/image'
import useMangoStore from '../stores/useMangoStore'
import {
  connectionSelector,
  walletConnectedSelector,
  walletSelector,
} from '../stores/selectors'
import { sortBy, sum } from 'lodash'
import {
  ExclamationCircleIcon,
  ExternalLinkIcon,
  InformationCircleIcon,
  SwitchVerticalIcon,
} from '@heroicons/react/outline'
import { ChevronDownIcon, CogIcon } from '@heroicons/react/solid'
import { abbreviateAddress } from '../utils'
import SwapTokenSelect from './SwapTokenSelect'
import { notify } from '../utils/notifications'
import { Token } from '../@types/types'
import {
  getTokenAccountsByOwnerWithWrappedSol,
  nativeToUi,
  zeroKey,
} from '@blockworks-foundation/mango-client'
import Button, { LinkButton } from './Button'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import useLocalStorageState from '../hooks/useLocalStorageState'
import Modal from './Modal'
import { ElementTitle } from './styles'
import { RefreshClockwiseIcon, WalletIcon } from './icons'
import Tooltip from './Tooltip'
import SwapSettingsModal from './SwapSettingsModal'
import SwapTokenInfo from './SwapTokenInfo'

type UseJupiterProps = Parameters<typeof useJupiter>[0]

const JupiterForm: FunctionComponent = () => {
  const wallet = useMangoStore(walletSelector)
  const connection = useMangoStore(connectionSelector)
  const connected = useMangoStore(walletConnectedSelector)

  const [showSettings, setShowSettings] = useState(false)
  const [depositAndFee, setDepositAndFee] = useState(null)
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo>(null)
  const [showInputTokenSelect, setShowInputTokenSelect] = useState(false)
  const [showOutputTokenSelect, setShowOutputTokenSelect] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const [tokens, setTokens] = useState<Token[]>([])
  const [
    ,
    // inputTokenStats
    setInputTokenStats,
  ] = useState(null)
  const [outputTokenStats, setOutputTokenStats] = useState(null)
  const [coinGeckoList, setCoinGeckoList] = useState(null)
  const [walletTokens, setWalletTokens] = useState([])
  const [slippage, setSlippage] = useState(0.5)
  const [formValue, setFormValue] = useState<UseJupiterProps>({
    amount: null,
    inputMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    outputMint: new PublicKey('MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac'),
    slippage,
  })
  const [hasSwapped, setHasSwapped] = useLocalStorageState('hasSwapped', false)
  const [showWalletDraw, setShowWalletDraw] = useState(true)
  const [walletTokenPrices, setWalletTokenPrices] = useState(null)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false
  const [feeValue, setFeeValue] = useState(null)
  const [showRoutesModal, setShowRoutesModal] = useState(false)

  const fetchWalletTokens = useCallback(async () => {
    const ownedTokens = []
    const ownedTokenAccounts = await getTokenAccountsByOwnerWithWrappedSol(
      connection,
      wallet.publicKey
    )

    ownedTokenAccounts.forEach((account) => {
      const decimals = tokens.find(
        (t) => t?.address === account.mint.toString()
      )?.decimals

      const uiBalance = nativeToUi(account.amount, decimals || 6)
      ownedTokens.push({ account, uiBalance })
    })
    console.log('ownedToknes', ownedTokens)
    setWalletTokens(ownedTokens)
  }, [wallet, connection, tokens])

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

  // const [inputChartPrices, outputChartPrices] = useMemo(() => {
  //   return [
  //     inputTokenStats && inputTokenStats.prices
  //       ? inputTokenStats.prices.reduce((a, c) => {
  //           const found = a.find((t) => {
  //             return new Date(c[0]).getHours() === new Date(t.time).getHours()
  //           })
  //           if (!found) {
  //             a.push({ time: c[0], price: c[1] })
  //           }
  //           return a
  //         }, [])
  //       : null,
  //     outputTokenStats && outputTokenStats.prices
  //       ? outputTokenStats.prices.reduce((a, c) => {
  //           const found = a.find((t) => {
  //             return new Date(c[0]).getHours() === new Date(t.time).getHours()
  //           })
  //           if (!found) {
  //             a.push({ time: c[0], price: c[1] })
  //           }
  //           return a
  //         }, [])
  //       : null,
  //   ]
  // }, [inputTokenStats, outputTokenStats])

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
  }, [connected])

  useEffect(() => {
    if (!coinGeckoList?.length) return

    const fetchInputTokenStats = async () => {
      const id = coinGeckoList.find(
        (x) =>
          x?.symbol?.toLowerCase() === inputTokenInfo?.symbol?.toLowerCase()
      )?.id
      if (id) {
        const results = await fetch(
          `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=1`
        )
        const json = await results.json()
        setInputTokenStats(json)
      }
    }

    const fetchOutputTokenStats = async () => {
      const id = coinGeckoList.find(
        (x) =>
          x?.symbol?.toLowerCase() === outputTokenInfo?.symbol?.toLowerCase()
      )?.id
      if (id) {
        const results = await fetch(
          `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=1`
        )
        const json = await results.json()
        setOutputTokenStats(json)
      }
    }

    if (inputTokenInfo) {
      fetchInputTokenStats()
    }
    if (outputTokenInfo) {
      fetchOutputTokenStats()
    }
  }, [inputTokenInfo, outputTokenInfo, coinGeckoList])

  const amountInDecimal = useMemo(() => {
    return formValue.amount * 10 ** (inputTokenInfo?.decimals || 1)
  }, [inputTokenInfo, formValue.amount])

  const { routeMap, allTokenMints, routes, loading, exchange, error, refresh } =
    useJupiter({
      ...formValue,
      amount: amountInDecimal,
      slippage: formValue.slippage,
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
      const fees = await selectedRoute.getDepositAndFee()
      setDepositAndFee(fees)
    }
    if (selectedRoute && connected) {
      getDepositAndFee()
    }
  }, [selectedRoute])

  const outputTokenMints = useMemo(() => {
    if (routeMap.size && formValue.inputMint) {
      const routeOptions = routeMap.get(formValue.inputMint.toString())

      const routeOptionTokens = routeOptions.map((address) => {
        return tokens.find((t) => {
          return t?.address === address
        })
      })

      return routeOptionTokens
    } else {
      return sortedTokenMints
    }
  }, [routeMap, tokens, formValue.inputMint])

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

  // const [inputTokenPrice, inputTokenChange] = useMemo(() => {
  //   if (inputTokenStats?.prices?.length) {
  //     const price = inputTokenStats.prices[inputTokenStats.prices.length - 1][1]
  //     const change =
  //       ((inputTokenStats.prices[0][1] -
  //         inputTokenStats.prices[inputTokenStats.prices.length - 1][1]) /
  //         inputTokenStats.prices[0][1]) *
  //       100

  //     return [price.toFixed(price < 5 ? 6 : 4), change]
  //   }
  //   return [0, 0]
  // }, [inputTokenStats])

  const [
    outputTokenPrice,
    // outputTokenChange
  ] = useMemo(() => {
    if (outputTokenStats?.prices?.length) {
      const price =
        outputTokenStats.prices[outputTokenStats.prices.length - 1][1]
      const change =
        ((outputTokenStats.prices[0][1] -
          outputTokenStats.prices[outputTokenStats.prices.length - 1][1]) /
          outputTokenStats.prices[0][1]) *
        100
      return [price.toFixed(price < 5 ? 6 : 4), change]
    }
    return [0, 0]
  }, [outputTokenStats])

  const [walletTokensWithInfos] = useMemo(() => {
    const userTokens = []
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
      (token) => token.item.extensions.coingeckoId
    )
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids.toString()}&vs_currencies=usd`
    )
    const data = await response.json()
    setWalletTokenPrices(data)
  }

  const getSwapFeeTokenValue = async () => {
    const mints = selectedRoute.marketInfos.map((info) => info.lpFee.mint)
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/token_price/solana?contract_addresses=${mints.toString()}&vs_currencies=usd`
    )
    const data = await response.json()

    const feeValue = selectedRoute.marketInfos.reduce((a, c) => {
      const feeToken = tokens.find((item) => item?.address === c.lpFee?.mint)
      const amount = c.lpFee?.amount / Math.pow(10, feeToken?.decimals)
      if (data[c.lpFee?.mint]) {
        return a + data[c.lpFee?.mint].usd * amount
      }
      if (c.lpFee?.mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') {
        return a + 1 * amount
      }
    }, 0)
    setFeeValue(feeValue)
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
    return token?.symbol?.toLowerCase()
  })

  const outAmountUi = selectedRoute
    ? selectedRoute.outAmount / 10 ** (outputTokenInfo?.decimals || 1)
    : null

  const swapDisabled = loading || !selectedRoute || routes?.length === 0

  // const tooltipContent = (tooltipProps) => {
  //   if (tooltipProps.payload.length > 0) {
  //     return (
  //       <div className="bg-th-bkg-3 flex min-w-[120px] p-2 rounded">
  //         <div>
  //           <div className="text-th-fgd-3 text-xs">Time</div>
  //           <div className="font-bold text-th-fgd-1 text-xs">
  //             {dayjs(tooltipProps.payload[0].payload.time).format('h:mma')}
  //           </div>
  //         </div>
  //         <div className="pl-3">
  //           <div className="text-th-fgd-3 text-xs">Price</div>
  //           <div className="font-bold text-th-fgd-1 text-xs">
  //             {tooltipProps.payload[0].payload.price}
  //           </div>
  //         </div>
  //       </div>
  //     )
  //   }
  //   return null
  // }

  return (
    <div className="grid grid-cols-12 lg:space-x-4 mt-8">
      <div className="col-span-12 lg:col-span-4 lg:col-start-2 relative">
        <div className="relative z-10">
          {connected &&
          walletTokensWithInfos.length &&
          walletTokenPrices &&
          !isMobile ? (
            <div
              className={`flex transform top-22 left-0 w-80 fixed overflow-hidden ease-in-out transition-all duration-700 z-30 ${
                showWalletDraw ? 'translate-x-0' : 'ml-16 -translate-x-full'
              }`}
            >
              <aside className={`bg-th-bkg-3  pb-4 pt-6 rounded-r-md w-64`}>
                <div className="max-h-[500px] overflow-auto thin-scroll">
                  <div className="flex items-center justify-between pb-2 px-4">
                    <div className="font-bold text-base text-th-fgd-1">
                      Wallet
                    </div>
                    <a
                      className="flex items-center text-th-fgd-4 text-xs hover:text-th-fgd-3"
                      href={`https://explorer.solana.com/address/${wallet?.publicKey}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div className="bg-th-green h-1.5 mr-1.5 rounded-full w-1.5" />
                      {abbreviateAddress(wallet.publicKey)}
                      <ExternalLinkIcon className="h-3.5 ml-0.5 -mt-0.5 w-3.5" />
                    </a>
                  </div>
                  {walletTokensWithInfos
                    .sort((a, b) => {
                      const aId = a.item.extensions.coingeckoId
                      const bId = b.item.extensions.coingeckoId
                      return (
                        b.uiBalance * walletTokenPrices[bId]?.usd -
                        a.uiBalance * walletTokenPrices[aId]?.usd
                      )
                    })
                    .map((token) => {
                      const geckoId = token.item.extensions.coingeckoId
                      return (
                        <div
                          className="cursor-pointer default-transition flex items-center justify-between px-4 py-2 hover:bg-th-bkg-4"
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
                                <div className="ml-2 text-th-fgd-4 text-xs">
                                  {walletTokenPrices[geckoId]
                                    ? `$${walletTokenPrices[geckoId].usd}`
                                    : 'Unavailable'}
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
                            <div className="text-th-fgd-4 text-right text-xs">
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
                className="absolute bg-th-bkg-4 p-3 left-64 rounded-l-none text-th-fgd-1 hover:text-th-primary top-8"
                onClick={() => setShowWalletDraw(!showWalletDraw)}
              >
                <WalletIcon className="h-5 w-5" />
              </button>
            </div>
          ) : null}
          <div className="bg-th-bkg-2 rounded-lg px-6 pb-6 pt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="font-bold text-lg text-th-fgd-1">Swap</div>
              <div className="flex items-center text-th-fgd-3">
                <button
                  className="rounded-full bg-th-bkg-4 p-1.5"
                  onClick={() => refresh()}
                >
                  <RefreshClockwiseIcon
                    className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                  />
                </button>
                <button
                  className="rounded-full bg-th-bkg-4 p-1.5 ml-2"
                  onClick={() => setShowSettings(true)}
                >
                  <CogIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex justify-between">
              <label
                htmlFor="inputMint"
                className="block text-sm font-semibold"
              >
                Pay
              </label>
              <div className="space-x-3">
                <label htmlFor="amount" className="text-th-fgd-3 text-xs">
                  Bal: {inputWalletBalance()}
                </label>
                {connected ? (
                  <>
                    <LinkButton
                      className="text-th-primary text-xs"
                      onClick={() => {
                        setFormValue((val) => ({
                          ...val,
                          amount: inputWalletBalance(),
                        }))
                      }}
                    >
                      Max
                    </LinkButton>
                  </>
                ) : null}
              </div>
            </div>
            <div className="grid grid-cols-2 mt-2">
              <div className="col-span-1">
                <button
                  className="hover:bg-th-bkg-3 -ml-2 p-2"
                  onClick={() => setShowInputTokenSelect(true)}
                >
                  <div className="flex h-8 items-center">
                    {inputTokenInfo?.logoURI ? (
                      <img
                        src={inputTokenInfo?.logoURI}
                        width="24"
                        height="24"
                        alt={inputTokenInfo?.symbol}
                      />
                    ) : null}
                    <div className="text-base ml-2">
                      {inputTokenInfo?.symbol}
                    </div>
                    <ChevronDownIcon className="flex-shrink-0 h-5 w-5 ml-1 text-th-fgd-3" />
                  </div>
                </button>
              </div>
              <div className="col-span-1">
                <input
                  name="amount"
                  id="amount"
                  className="bg-th-bkg-1 border border-th-fgd-4 font-bold pr-4 h-12 focus:outline-none rounded-md text-base text-right tracking-wide w-full"
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

            <div className="flex justify-center my-4">
              <button onClick={handleSwitchMints}>
                <SwitchVerticalIcon className="default-transition h-8 w-8 rounded-full p-1.5 bg-th-bkg-4 text-th-fgd-1 hover:text-th-primary" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="outputMint" className="font-semibold">
                Receive
              </label>
              <span className="text-th-fgd-3 text-xs">
                Bal: {outputWalletBalance()}
              </span>
            </div>
            <div className="grid grid-cols-2 mt-2">
              <div className="col-span-1">
                <button
                  className="flex h-12 items-center hover:bg-th-bkg-3 -ml-2 p-2"
                  onClick={() => setShowOutputTokenSelect(true)}
                >
                  {outputTokenInfo?.logoURI ? (
                    <img
                      src={outputTokenInfo?.logoURI}
                      width="24"
                      height="24"
                      alt={outputTokenInfo?.symbol}
                    />
                  ) : null}
                  <div className="text-base ml-2">
                    {outputTokenInfo?.symbol}
                  </div>
                  <ChevronDownIcon className="flex-shrink-0 h-5 w-5 ml-1 text-th-fgd-3" />
                </button>
              </div>
              <div className="col-span-1 relative">
                <input
                  name="amount"
                  id="amount"
                  className="bg-th-bkg-3 border border-th-bkg-4 cursor-not-allowed font-bold pr-4 h-12 focus:outline-none rounded-md text-lg text-right tracking-wide w-full"
                  disabled
                  value={
                    selectedRoute?.outAmount /
                      10 ** (outputTokenInfo?.decimals || 1) || ''
                  }
                />
                {selectedRoute?.outAmount ? (
                  <div className="absolute mt-1 right-0 text-th-fgd-3 text-xs">
                    ≈ $
                    {(
                      (selectedRoute?.outAmount /
                        10 ** (outputTokenInfo?.decimals || 1)) *
                      outputTokenPrice
                    ).toFixed(2)}
                  </div>
                ) : null}
              </div>
            </div>

            {routes?.length && selectedRoute ? (
              <div className="mt-8 text-th-fgd-3 text-xs">
                <div className="bg-th-bkg-1 mb-4 pb-4 px-3 pt-4 relative rounded-md">
                  {selectedRoute === routes[0] ? (
                    <div className="absolute bg-th-primary font-bold px-1 rounded-sm text-th-bkg-1 text-xs -top-2">
                      Best Swap
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold overflow-ellipsis text-sm text-th-fgd-1 whitespace-nowrap">
                        {selectedRoute?.marketInfos.map((info, index) => {
                          let includeSeparator = false
                          if (
                            selectedRoute?.marketInfos.length > 1 &&
                            index !== selectedRoute?.marketInfos.length - 1
                          ) {
                            includeSeparator = true
                          }
                          return (
                            <span key={index}>{`${info.marketMeta.amm.label} ${
                              includeSeparator ? 'x ' : ''
                            }`}</span>
                          )
                        })}
                      </span>
                      <div className="mr-2 mt-0.5 text-th-fgd-3 text-xs font-normal">
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
                      className="bg-transparent border border-th-fgd-4 font-normal pb-1 pt-1 px-2 rounded-md text-th-fgd-3 text-center text-xs"
                      disabled={routes?.length === 1}
                      onClick={() => setShowRoutesModal(true)}
                    >
                      {routes?.length - 1} other routes
                    </Button>
                  </div>
                </div>
                <div className="px-3 space-y-2">
                  <div className="flex justify-between">
                    <span>Rate</span>
                    <div className="text-th-fgd-1">
                      1 {outputTokenInfo?.symbol} ≈{' '}
                      {(formValue?.amount / outAmountUi).toFixed(6)}{' '}
                      {inputTokenInfo?.symbol}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Price Impact</span>
                    <div className="text-th-fgd-1">
                      {selectedRoute?.priceImpactPct * 100 < 0.1
                        ? '< 0.1%'
                        : `~ ${(selectedRoute?.priceImpactPct * 100).toFixed(
                            4
                          )}%`}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span>Minimum Received</span>
                    <div className="text-th-fgd-1">
                      {selectedRoute?.outAmountWithSlippage /
                        10 ** (outputTokenInfo?.decimals || 1)}{' '}
                      {outputTokenInfo?.symbol}
                    </div>
                  </div>
                  {!isNaN(feeValue) ? (
                    <div className="flex justify-between">
                      <span>Swap Fee</span>
                      <div className="flex items-center">
                        <div className="text-th-fgd-1">
                          ≈ ${feeValue?.toFixed(2)}
                        </div>
                        <Tooltip
                          content={
                            <div className="space-y-2.5">
                              {selectedRoute?.marketInfos.map((info, index) => {
                                const feeToken = tokens.find(
                                  (item) => item?.address === info.lpFee?.mint
                                )
                                return (
                                  <div key={index}>
                                    <span>
                                      Fees paid to {info.marketMeta?.amm?.label}
                                    </span>
                                    <div className="text-th-fgd-1">
                                      {(
                                        info.lpFee?.amount /
                                        Math.pow(10, feeToken?.decimals)
                                      ).toFixed(6)}{' '}
                                      {feeToken?.symbol} (
                                      {info.lpFee?.pct * 100}
                                      %)
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          }
                          placement={'left'}
                        >
                          <InformationCircleIcon className="cursor-help h-3.5 ml-1.5 w-3.5 text-th-primary" />
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
                            Fees paid to {info.marketMeta?.amm?.label}
                          </span>
                          <div className="text-th-fgd-1">
                            {(
                              info.lpFee?.amount /
                              Math.pow(10, feeToken?.decimals)
                            ).toFixed(6)}{' '}
                            {feeToken?.symbol} ({info.lpFee?.pct * 100}%)
                          </div>
                        </div>
                      )
                    })
                  )}
                  {connected ? (
                    <>
                      <div className="flex justify-between">
                        <span>Transaction Fee</span>
                        <div className="text-th-fgd-1">
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
                            <span>Deposit</span>
                            <Tooltip
                              content={
                                <>
                                  {depositAndFee?.ataDepositLength ? (
                                    <div>
                                      You need to have an Associated Token
                                      Account.
                                    </div>
                                  ) : null}
                                  {depositAndFee?.openOrdersDeposits?.length ? (
                                    <div className="mt-2">
                                      Serum requires an OpenOrders account for
                                      each token. You can close the account and
                                      recover the SOL later.{' '}
                                      <a
                                        href="https://docs.google.com/document/d/1qEWc_Bmc1aAxyCUcilKB4ZYpOu3B0BxIbe__dRYmVns/"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        Here&apos;s how
                                      </a>
                                    </div>
                                  ) : null}
                                </>
                              }
                              placement={'left'}
                            >
                              <InformationCircleIcon className="cursor-help h-3.5 ml-1.5 w-3.5 text-th-primary" />
                            </Tooltip>
                          </div>
                          <div>
                            {depositAndFee?.ataDepositLength ? (
                              <div className="text-right text-th-fgd-1">
                                {(
                                  depositAndFee?.ataDeposit / Math.pow(10, 9)
                                ).toFixed(5)}{' '}
                                SOL for {depositAndFee?.ataDepositLength} ATA
                                Account
                              </div>
                            ) : null}
                            {depositAndFee?.openOrdersDeposits?.length ? (
                              <div className="text-th-fgd-1">
                                {(
                                  sum(depositAndFee?.openOrdersDeposits) /
                                  Math.pow(10, 9)
                                ).toFixed(5)}{' '}
                                SOL for{' '}
                                {depositAndFee?.openOrdersDeposits.length} Serum
                                OpenOrders{' '}
                                {depositAndFee?.openOrdersDeposits.length > 1
                                  ? 'Accounts'
                                  : 'Account'}
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
              <div className="flex items-center justify-center mt-2 text-th-red">
                <ExclamationCircleIcon className="h-5 mr-1.5 w-5" />
                Error in Jupiter – Try changing your input
              </div>
            )}
            <Button
              disabled={swapDisabled}
              onClick={async () => {
                if (!connected && zeroKey !== wallet?.publicKey) {
                  wallet.connect()
                } else if (!loading && selectedRoute && connected) {
                  setSwapping(true)
                  let txCount = 1
                  let errorTxid
                  const swapResult = await exchange({
                    wallet: wallet,
                    route: selectedRoute,
                    confirmationWaiterFactory: async (txid, totalTxs) => {
                      console.log('txid, totalTxs', txid, totalTxs)
                      if (txCount === totalTxs) {
                        errorTxid = txid
                        notify({
                          type: 'confirm',
                          title: 'Confirming Transaction',
                          txid,
                        })
                      }
                      await connection.confirmTransaction(txid)

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
                      title: swapResult.error.name,
                      description: swapResult.error.message,
                      txid: errorTxid,
                    })
                  } else if ('txid' in swapResult) {
                    notify({
                      type: 'success',
                      title: 'Swap Successful',
                      description: `Swapped ${
                        swapResult.inputAmount /
                        10 ** (inputTokenInfo?.decimals || 1)
                      } ${inputTokenInfo?.symbol} to ${
                        swapResult.outputAmount /
                        10 ** (outputTokenInfo?.decimals || 1)
                      } ${outputTokenInfo?.symbol}`,
                      txid: swapResult.txid,
                    })
                    setFormValue((val) => ({
                      ...val,
                      amount: null,
                    }))
                  }
                }
              }}
              className="h-12 mt-6 text-base w-full"
            >
              {connected
                ? swapping
                  ? 'Swapping...'
                  : 'Swap'
                : 'Connect Wallet'}
            </Button>
          </div>

          {/* {inputTokenStats?.prices?.length &&
          outputTokenStats?.prices?.length ? (
            <>
              <div className="flex items-center justify-between mt-6">
                <div className="flex items-center">
                  {inputTokenInfo?.logoURI ? (
                    <img
                      src={inputTokenInfo?.logoURI}
                      width="32"
                      height="32"
                      alt={inputTokenInfo?.symbol}
                    />
                  ) : null}
                  <div className="ml-2">
                    <div className="font-semibold">
                      {inputTokenInfo?.symbol}
                    </div>
                    <div className="text-th-fgd-4 text-xs">
                      {inputTokenInfo?.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-end sm:flex-row sm:space-x-3">
                    <div>${inputTokenPrice}</div>
                    <div
                      className={`text-xs sm:text-sm ${
                        inputTokenChange <= 0 ? 'text-th-green' : 'text-th-red'
                      }`}
                    >
                      {(inputTokenChange * -1).toFixed(2)}%
                    </div>
                  </div>
                  <AreaChart
                    width={120}
                    height={40}
                    data={inputChartPrices || null}
                  >
                    <Area
                      isAnimationActive={false}
                      type="monotone"
                      dataKey="price"
                      stroke="#FF9C24"
                      fill="#FF9C24"
                      fillOpacity={0.1}
                    />
                    <XAxis dataKey="time" hide />
                    <YAxis
                      dataKey="price"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      hide
                    />
                    <ChartTooltip
                      content={tooltipContent}
                      position={{ x: 0, y: -50 }}
                    />
                  </AreaChart>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center">
                  {outputTokenInfo?.logoURI ? (
                    <img
                      src={outputTokenInfo?.logoURI}
                      width="32"
                      height="32"
                      alt={outputTokenInfo?.symbol}
                    />
                  ) : null}
                  <div className="ml-2">
                    <div className="font-semibold">
                      {outputTokenInfo?.symbol}
                    </div>
                    <div className="text-th-fgd-4 text-xs">
                      {outputTokenInfo?.name}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex flex-col items-end sm:flex-row sm:space-x-3">
                    <div>${outputTokenPrice}</div>
                    <div
                      className={`${
                        outputTokenChange <= 0 ? 'text-th-green' : 'text-th-red'
                      }`}
                    >
                      {(outputTokenChange * -1).toFixed(2)}%
                    </div>
                  </div>
                  <AreaChart
                    width={120}
                    height={40}
                    data={outputChartPrices || null}
                  >
                    <Area
                      isAnimationActive={false}
                      type="monotone"
                      dataKey="price"
                      stroke="#FF9C24"
                      fill="#FF9C24"
                      fillOpacity={0.1}
                    />
                    <XAxis dataKey="time" hide />
                    <YAxis
                      dataKey="price"
                      type="number"
                      domain={['dataMin', 'dataMax']}
                      hide
                    />
                    <ChartTooltip
                      content={tooltipContent}
                      position={{ x: 0, y: -50 }}
                    />
                  </AreaChart>
                </div>
              </div>
            </>
          ) : null} */}

          {showRoutesModal ? (
            <Modal
              isOpen={showRoutesModal}
              onClose={() => setShowRoutesModal(false)}
            >
              <div className="font-bold mb-4 text-th-fgd-1 text-center text-lg">
                {routes?.length} routes
              </div>
              <div className="max-h-96 overflow-x-hidden overflow-y-auto thin-scroll pr-1">
                {routes.map((route, index) => {
                  const selected = selectedRoute === route
                  return (
                    <div
                      key={index}
                      className={`bg-th-bkg-3 border default-transition rounded mb-2 hover:bg-th-bkg-4 ${
                        selected
                          ? 'border-th-primary text-th-primary hover:border-th-primary'
                          : 'border-transparent text-th-fgd-1'
                      }`}
                    >
                      <button
                        className="p-4 w-full"
                        onClick={() => handleSelectRoute(route)}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex flex-col text-left">
                            <div className="whitespace-nowrap overflow-ellipsis">
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
                            <div className="text-th-fgd-4 text-xs font-normal">
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
                            {(
                              route.outAmount /
                              10 ** (outputTokenInfo?.decimals || 1)
                            ).toLocaleString()}
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
              <ElementTitle>Before you get started...</ElementTitle>
              <div className="flex flex-col justify-center">
                <div className="text-center text-th-fgd-3">
                  Swaps interact directly with your connected wallet, not your
                  Mango Account.
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
          {connected && !hasSwapped ? (
            <Modal isOpen={!hasSwapped} onClose={() => setHasSwapped(true)}>
              <ElementTitle>Before you get started...</ElementTitle>
              <div className="flex flex-col justify-center">
                <div className="text-center text-th-fgd-3">
                  Swaps interact directly with your connected wallet, not your
                  Mango Account.
                </div>
                <Button
                  className="mt-6 mx-auto"
                  onClick={() => setHasSwapped(true)}
                >
                  Got It
                </Button>
              </div>
            </Modal>
          ) : null}
        </div>
      </div>
      <div className="col-span-12 lg:col-span-6">
        {inputTokenInfo && outputTokenInfo ? (
          <SwapTokenInfo
            inputTokenId={inputTokenInfo?.extensions.coingeckoId}
            inputTokenSymbol={inputTokenInfo?.symbol}
            outputTokenId={outputTokenInfo?.extensions.coingeckoId}
          />
        ) : null}
      </div>
    </div>
  )
}

export default JupiterForm
