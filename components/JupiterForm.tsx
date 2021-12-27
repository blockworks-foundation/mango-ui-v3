import {
  useEffect,
  useMemo,
  useState,
  FunctionComponent,
  useCallback,
} from 'react'
import dayjs from 'dayjs'
import { useJupiter, RouteInfo } from '@jup-ag/react-hook'
import { AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts'
import { TOKEN_LIST_URL } from '@jup-ag/core'
import { PublicKey } from '@solana/web3.js'
import useMangoStore from '../stores/useMangoStore'
import {
  connectionSelector,
  walletConnectedSelector,
  walletSelector,
} from '../stores/selectors'
import { sortBy, sum } from 'lodash'
import {
  ExclamationCircleIcon,
  SwitchVerticalIcon,
} from '@heroicons/react/outline'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid'
import { sleep } from '../utils'
import SwapTokenSelect from './SwapTokenSelect'
import { notify } from '../utils/notifications'
import { Token } from '../@types/types'
import {
  getTokenAccountsByOwnerWithWrappedSol,
  nativeToUi,
  zeroKey,
} from '@blockworks-foundation/mango-client'
import Button, { LinkButton } from './Button'
import { usdFormatter } from '../utils'

type UseJupiterProps = Parameters<typeof useJupiter>[0]

const JupiterForm: FunctionComponent = () => {
  const wallet = useMangoStore(walletSelector)
  const connection = useMangoStore(connectionSelector)
  const connected = useMangoStore(walletConnectedSelector)

  const [routesToShow, setRoutesToShow] = useState<number>(2)
  const [maxHeight, setMaxHeight] = useState<string>('170px')
  const [depositAndFee, setDepositAndFee] = useState(null)
  const [selectedRoute, setSelectedRoute] = useState<RouteInfo>(null)
  const [showInputTokenSelect, setShowInputTokenSelect] = useState(false)
  const [showOutputTokenSelect, setShowOutputTokenSelect] = useState(false)
  const [swapping, setSwapping] = useState(false)
  const [tokens, setTokens] = useState<Token[]>([])
  const [inputTokenStats, setInputTokenStats] = useState(null)
  const [outputTokenStats, setOutputTokenStats] = useState(null)
  const [coinGeckoList, setCoinGeckoList] = useState(null)
  const [walletTokens, setWalletTokens] = useState([])
  const [formValue, setFormValue] = useState<UseJupiterProps>({
    amount: null,
    inputMint: new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'),
    outputMint: new PublicKey('MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac'),
    slippage: 0.5,
  })

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

  const [inputChartPrices, outputChartPrices] = useMemo(() => {
    return [
      inputTokenStats && inputTokenStats.prices
        ? inputTokenStats.prices.reduce((a, c) => {
            const found = a.find((t) => {
              return new Date(c[0]).getHours() === new Date(t.time).getHours()
            })
            if (!found) {
              a.push({ time: c[0], price: c[1] })
            }
            return a
          }, [])
        : null,
      outputTokenStats && outputTokenStats.prices
        ? outputTokenStats.prices.reduce((a, c) => {
            const found = a.find((t) => {
              return new Date(c[0]).getHours() === new Date(t.time).getHours()
            })
            if (!found) {
              a.push({ time: c[0], price: c[1] })
            }
            return a
          }, [])
        : null,
    ]
  }, [inputTokenStats, outputTokenStats])

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

  const { routeMap, allTokenMints, routes, loading, exchange, error } =
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

  const [inputTokenPrice, inputTokenChange] = useMemo(() => {
    if (inputTokenStats?.prices?.length) {
      const price = inputTokenStats.prices[inputTokenStats.prices.length - 1][1]
      const change =
        ((inputTokenStats.prices[0][1] -
          inputTokenStats.prices[inputTokenStats.prices.length - 1][1]) /
          inputTokenStats.prices[0][1]) *
        100

      return [price.toFixed(price < 5 ? 6 : 4), change]
    }
    return [0, 0]
  }, [inputTokenStats])

  const [outputTokenPrice, outputTokenChange] = useMemo(() => {
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

  const handleSelectRoute = (route) => {
    setSelectedRoute(route)
  }

  const handleSwitchMints = () => {
    setFormValue((val) => ({
      ...val,
      inputMint: formValue.outputMint,
      outputMint: formValue.inputMint,
    }))
  }

  const handleShowMore = () => {
    setRoutesToShow(routes.length)
    setMaxHeight('340px')
  }

  const handleShowLess = () => {
    setMaxHeight('160px')
    sleep(700).then(() => {
      setRoutesToShow(2)
    })
  }

  const sortedTokenMints = sortBy(tokens, (token) => {
    return token?.symbol?.toLowerCase()
  })

  const displayedRoutes = routes ? routes.slice(0, routesToShow) : []

  const outAmountUi = selectedRoute
    ? selectedRoute.outAmount / 10 ** (outputTokenInfo?.decimals || 1)
    : null

  const swapDisabled = loading || !selectedRoute || routes?.length === 0

  const tooltipContent = (tooltipProps) => {
    if (tooltipProps.payload.length > 0) {
      return (
        <div className="bg-th-bkg-1 flex p-2 rounded">
          <div>
            <div className="text-th-fgd-3 text-xs">Time</div>
            <div className="font-bold text-th-fgd-1 text-xs">
              {dayjs(tooltipProps.payload[0].payload.time).format('h:mma')}
            </div>
          </div>
          <div className="pl-3">
            <div className="text-th-fgd-3 text-xs">Price</div>
            <div className="font-bold text-th-fgd-1 text-xs">
              {usdFormatter(tooltipProps.payload[0].payload.price)}
            </div>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="max-w-md mx-auto">
      {connected ? (
        <div className="mt-8 bg-th-bkg-2 rounded-lg p-4 text-th-fgd-4 -mb-2">
          Swaps occur in your connected wallet. After swapping, you may then
          deposit swapped tokens into your mango account.
        </div>
      ) : null}
      <div className="mt-8 bg-th-bkg-2 rounded-lg px-6 py-8">
        <div className="flex justify-between">
          <label htmlFor="inputMint" className="block text-sm font-semibold">
            You Pay
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

        <div className="bg-th-bkg-2 flex justify-between items-center mt-2 rounded-md">
          <button
            className="hover:bg-th-bkg-3 -ml-2 p-2"
            onClick={() => setShowInputTokenSelect(true)}
          >
            <div className="flex items-center">
              {inputTokenInfo?.logoURI ? (
                <img
                  src={inputTokenInfo?.logoURI}
                  width="24"
                  height="24"
                  alt={inputTokenInfo?.symbol}
                />
              ) : null}
              <div className="text-lg ml-3">{inputTokenInfo?.symbol}</div>
              <ChevronDownIcon className="h-5 w-5 ml-1 text-th-fgd-3" />
            </div>
          </button>
          <div>
            <input
              name="amount"
              id="amount"
              className="bg-th-bkg-1 font-bold pr-4 py-3 focus:outline-none rounded-md text-lg text-right tracking-wide"
              value={formValue.amount || ''}
              placeholder="0.00"
              type="text"
              pattern="[0-9]*"
              onInput={(e: any) => {
                let newValue = Number(e.target?.value || 0)
                newValue = Number.isNaN(newValue) ? 0 : newValue
                setFormValue((val) => ({
                  ...val,
                  amount: newValue ? Math.max(newValue, 0) : null,
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

        <div className="flex justify-between">
          <label htmlFor="outputMint" className="font-semibold">
            You Receive
          </label>
          <span className="text-th-fgd-3 text-xs">
            Bal: {outputWalletBalance()}
          </span>
        </div>
        <div className="flex items-center mt-3">
          <button
            className="flex items-center hover:bg-th-bkg-3 -ml-2 p-2"
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
            <div className="text-lg ml-3">{outputTokenInfo?.symbol}</div>
            <ChevronDownIcon className="h-5 w-5 ml-1 text-th-fgd-3" />
          </button>
        </div>

        {routes ? (
          <div>
            <div className="text-th-fgd-4 text-center text-xs">
              {routes?.length} routes found!
            </div>
            <div
              className="transition-all duration-700 mt-3 max-h-80 overflow-x-hidden overflow-y-auto thin-scroll pr-1"
              style={{ maxHeight: maxHeight }}
            >
              {displayedRoutes.map((route, index) => {
                const selected = selectedRoute === route
                return (
                  <div
                    key={index}
                    className={`bg-th-bkg-3 border default-transition rounded mb-2 hover:bg-th-bkg-4 ${
                      selected
                        ? 'border-th-primary text-th-primary hover:border-th-primary'
                        : 'border-transparent'
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
                          {route.outAmount /
                            10 ** (outputTokenInfo?.decimals || 1)}
                        </div>
                      </div>
                    </button>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-th-fgd-3 mx-1 mt-1">
              {routes.length ? (
                <div>
                  {routes.length > displayedRoutes.length ? (
                    <button
                      className="flex items-center text-xs hover:text-th-fgd-1"
                      onClick={handleShowMore}
                    >
                      <ChevronDownIcon className="h-5 mr-1 w-5" />
                      Show more
                    </button>
                  ) : (
                    <button
                      className="flex items-center text-xs hover:text-th-fgd-1"
                      onClick={handleShowLess}
                    >
                      <ChevronUpIcon className="h-5 mr-1 w-5" />
                      Show less
                    </button>
                  )}
                </div>
              ) : null}
              {routes.length ? (
                <div className="text-xs">
                  from{' '}
                  {routes[routes.length - 1].outAmount /
                    10 ** (outputTokenInfo?.decimals || 1)}{' '}
                  to{' '}
                  {routes[0].outAmount / 10 ** (outputTokenInfo?.decimals || 1)}
                </div>
              ) : null}
            </div>
            <div className="flex justify-center text-xs text-th-fgd-4 mt-4 -mb-4">
              <a
                href="https://jup.ag/swap/USDC-MNGO"
                target="_blank"
                rel="noopener noreferrer"
                className="text-th-fgd-4"
              >
                Powered by Jupiter
              </a>
            </div>
          </div>
        ) : null}

        {error && (
          <div className="flex items-center justify-center mt-2 text-th-red">
            <ExclamationCircleIcon className="h-5 mr-1.5 w-5" />
            Error in Jupiter – Try changing your input
          </div>
        )}
      </div>
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
                  swapResult.inputAmount / 10 ** (inputTokenInfo?.decimals || 1)
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
        {connected ? (swapping ? 'Swapping...' : 'Swap') : 'Connect Wallet'}
      </Button>

      {selectedRoute ? (
        <div className="border-b border-th-bkg-4 flex flex-col space-y-2.5 mt-6 pb-6 text-th-fgd-3 text-xs">
          <div className="flex justify-between">
            <span>Rate</span>
            <span className="text-th-fgd-1">
              1 {outputTokenInfo?.symbol} ≈{' '}
              {(formValue?.amount / outAmountUi).toFixed(6)}{' '}
              {inputTokenInfo?.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Price Impact</span>
            <span className="text-th-fgd-1">
              {selectedRoute.priceImpactPct * 100 < 0.1
                ? '< 0.1%'
                : `~ ${(selectedRoute.priceImpactPct * 100).toFixed(4)}%`}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Minimum Received</span>
            <span className="text-th-fgd-1">
              {(
                selectedRoute.outAmountWithSlippage /
                10 ** (outputTokenInfo?.decimals || 1)
              ).toFixed(6)}{' '}
              {outputTokenInfo?.symbol}
            </span>
          </div>
          {selectedRoute.marketInfos.map((info, index) => {
            const feeToken = tokens.find(
              (item) => item?.address === info.lpFee?.mint
            )
            return (
              <div className="flex justify-between" key={index}>
                <span>Fees paid to {info.marketMeta?.amm?.label}</span>
                <span className="text-th-fgd-1">
                  {(
                    info.lpFee?.amount / Math.pow(10, feeToken?.decimals)
                  ).toFixed(6)}{' '}
                  {feeToken?.symbol} ({info.lpFee?.pct * 100}%)
                </span>
              </div>
            )
          })}
          {connected ? (
            <>
              <div className="flex justify-between">
                <span>Transaction Fee</span>
                <span className="text-th-fgd-1">
                  {depositAndFee
                    ? depositAndFee?.signatureFee / Math.pow(10, 9)
                    : '-'}{' '}
                  SOL
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Deposit</span>
                <div className="flex flex-col text-right">
                  <span className="text-th-fgd-1">
                    {depositAndFee?.ataDeposit / Math.pow(10, 9)} SOL for{' '}
                    {depositAndFee?.ataDepositLength} ATA Account
                  </span>
                  {depositAndFee?.openOrdersDeposits?.length ? (
                    <span className="text-th-fgd-1">
                      {sum(depositAndFee?.openOrdersDeposits) / Math.pow(10, 9)}{' '}
                      SOL for {depositAndFee?.openOrdersDeposits.length} Serum
                      OpenOrders Account
                    </span>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
      {inputTokenStats?.prices?.length && outputTokenStats?.prices?.length ? (
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
                <div className="font-semibold">{inputTokenInfo?.symbol}</div>
                <div className="text-th-fgd-4 text-xs">
                  {inputTokenInfo?.name}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="">${inputTokenPrice}</div>
              <div
                className={`${
                  inputTokenChange <= 0 ? 'text-th-green' : 'text-th-red'
                }`}
              >
                {(inputTokenChange * -1).toFixed(2)}%
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
                <Tooltip content={tooltipContent} position={{ x: 0, y: -50 }} />
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
                <div className="font-semibold">{outputTokenInfo?.symbol}</div>
                <div className="text-th-fgd-4 text-xs">
                  {outputTokenInfo?.name}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="">${outputTokenPrice}</div>
              <div
                className={`${
                  outputTokenChange <= 0 ? 'text-th-green' : 'text-th-red'
                }`}
              >
                {(outputTokenChange * -1).toFixed(2)}%
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
                <Tooltip content={tooltipContent} position={{ x: 0, y: -50 }} />
              </AreaChart>
            </div>
          </div>
        </>
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
  )
}

export default JupiterForm
