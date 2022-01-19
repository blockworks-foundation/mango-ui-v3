import { ChevronUpIcon, RefreshIcon } from '@heroicons/react/outline'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import { Disclosure } from '@headlessui/react'
import useMangoStore, { serumProgramId } from '../stores/useMangoStore'
import PageBodyContainer from '../components/PageBodyContainer'
import TopBar from '../components/TopBar'
import Button, { LinkButton } from '../components/Button'
import Input from '../components/Input'
import { useState, useEffect } from 'react'
import Tooltip from '../components/Tooltip'
import {
  floorToDecimal,
  tokenPrecision,
  perpContractPrecision,
  roundToDecimal,
} from '../utils/index'
import { formatUsdValue, usdFormatter } from '../utils'
import {
  getMarketIndexBySymbol,
  getTokenBySymbol,
  getMarketByPublicKey,
  QUOTE_INDEX,
} from '@blockworks-foundation/mango-client'
import Switch from '../components/Switch'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'
import { AnchorIcon } from '../components/icons'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { PublicKey } from '@solana/web3.js'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'calculator'])),
    },
  }
}

interface CalculatorRow {
  symbolName: string
  oracleIndex: number
  hasMarketSpot: boolean
  hasMarketPerp: boolean
  price: number
  spotNet: number
  spotDeposit: number
  spotBorrow: number
  spotInOrders: number
  spotBaseTokenFree: number
  spotBaseTokenLocked: number
  spotQuoteTokenFree: number
  spotQuoteTokenLocked: number
  spotMarketIndex: number
  spotPublicKey: number
  perpBasePosition: number
  perpInOrders: number
  perpBids: number
  perpAsks: number
  perpAvgEntryPrice: number
  perpScenarioPnL: number
  perpPositionPnL: number
  perpUnsettledFunding: number
  perpPositionSide: string
  perpBaseLotSize: number
  perpQuoteLotSize: number
  perpMarketIndex: number
  perpPublicKey: number
  initAssetWeightSpot: number
  initLiabWeightSpot: number
  maintAssetWeightSpot: number
  maintLiabWeightSpot: number
  initAssetWeightPerp: number
  initLiabWeightPerp: number
  maintAssetWeightPerp: number
  maintLiabWeightPerp: number
  precision: number
  priceDisabled: boolean
}

interface ScenarioCalculator {
  rowData: CalculatorRow[]
}

export default function RiskCalculator() {
  const { t } = useTranslation(['common', 'calculator'])
  const riskRanks = [
    t('calculator:great'),
    t('calculator:ok'),
    t('calculator:poor'),
    t('calculator:very-poor'),
    t('calculator:rekt'),
  ]

  // Get mango account data
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoClient = useMangoStore((s) => s.connection.client)
  const mangoConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const connected = useMangoStore((s) => s.wallet.connected)
  const setMangoStore = useMangoStore((s) => s.set)
  const router = useRouter()
  const { pubkey } = router.query

  // Set default state variables
  const [sliderPercentage, setSliderPercentage] = useState(0)
  const [scenarioInitialized, setScenarioInitialized] = useState(false)
  const [blankScenarioInitialized, setBlankScenarioInitialized] =
    useState(false)
  const [scenarioBars, setScenarioBars] = useState<ScenarioCalculator>()
  const [accountConnected, setAccountConnected] = useState(false)
  const [showZeroBalances, setShowZeroBalances] = useState(true)
  const [interimValue, setInterimValue] = useState(new Map())
  const [ordersAsBalance, toggleOrdersAsBalance] = useState(false)
  const [resetOnLeave, setResetOnLeave] = useState(false)
  const defaultSliderVal = 1

  useEffect(() => {
    if (connected) {
      router.push('/risk-calculator')
      setScenarioInitialized(false)
    }
  }, [connected])

  useEffect(() => {
    async function loadUnownedMangoAccount() {
      try {
        const unownedMangoAccountPubkey = new PublicKey(pubkey)
        if (mangoGroup) {
          const unOwnedMangoAccount = await mangoClient.getMangoAccount(
            unownedMangoAccountPubkey,
            serumProgramId
          )
          setMangoStore((state) => {
            state.selectedMangoAccount.current = unOwnedMangoAccount
          })
          setScenarioInitialized(false)
          setResetOnLeave(true)
        }
      } catch (error) {
        router.push('/risk-calculator')
      }
    }

    if (pubkey) {
      loadUnownedMangoAccount()
    }
  }, [pubkey, mangoGroup])

  useEffect(() => {
    const handleRouteChange = () => {
      if (resetOnLeave) {
        setMangoStore((state) => {
          state.selectedMangoAccount.current = undefined
        })
      }
    }
    router.events.on('routeChangeStart', handleRouteChange)
    return () => {
      router.events.off('routeChangeStart', handleRouteChange)
    }
  }, [resetOnLeave])

  // Set rules for updating the scenario
  useEffect(() => {
    if (mangoGroup && mangoCache) {
      if (mangoAccount && !scenarioInitialized) {
        setSliderPercentage(defaultSliderVal)
        createScenario('account')
        setScenarioInitialized(true)
        setAccountConnected(true)
        setBlankScenarioInitialized(false)
      } else if (
        !mangoAccount &&
        !scenarioInitialized &&
        !blankScenarioInitialized
      ) {
        setSliderPercentage(defaultSliderVal)
        createScenario('blank')
        setBlankScenarioInitialized(true)
      }
    }
  }, [connected, mangoAccount, scenarioInitialized, mangoGroup, mangoCache])

  // Handle toggling open order inclusion or order cancelling for heatlh calculation
  useEffect(() => {
    if (mangoGroup && mangoCache && mangoAccount) {
      setScenarioInitialized(!scenarioInitialized)
      createScenario('account')
    }
  }, [ordersAsBalance])

  // Retrieve the data to create the scenario table
  const createScenario = (type) => {
    const rowData = []
    let calculatorRowData
    for (let i = -1; i < mangoGroup.numOracles; i++) {
      // Get market configuration data
      const spotMarketConfig =
        i < 0
          ? null
          : getMarketByPublicKey(
              mangoConfig,
              mangoGroup.spotMarkets[i].spotMarket
            )
      const perpMarketConfig =
        i < 0
          ? null
          : getMarketByPublicKey(
              mangoConfig,
              mangoGroup.perpMarkets[i].perpMarket
            )
      const symbol =
        i < 0
          ? 'USDC'
          : spotMarketConfig?.baseSymbol
          ? spotMarketConfig?.baseSymbol
          : perpMarketConfig?.baseSymbol

      // Retrieve spot balances if present
      const spotDeposit =
        Number(
          mangoAccount && spotMarketConfig
            ? mangoAccount.getUiDeposit(
                mangoCache.rootBankCache[spotMarketConfig.marketIndex],
                mangoGroup,
                spotMarketConfig.marketIndex
              )
            : mangoAccount && symbol === 'USDC'
            ? mangoAccount.getUiDeposit(
                mangoCache.rootBankCache[QUOTE_INDEX],
                mangoGroup,
                QUOTE_INDEX
              )
            : 0
        ) || 0
      const spotBorrow =
        Number(
          mangoAccount && spotMarketConfig
            ? mangoAccount.getUiBorrow(
                mangoCache.rootBankCache[spotMarketConfig.marketIndex],
                mangoGroup,
                spotMarketConfig.marketIndex
              )
            : mangoAccount && symbol === 'USDC'
            ? mangoAccount.getUiBorrow(
                mangoCache.rootBankCache[QUOTE_INDEX],
                mangoGroup,
                QUOTE_INDEX
              )
            : 0
        ) || 0
      const spotBaseTokenLocked =
        mangoAccount && spotMarketConfig
          ? Number(
              mangoAccount.spotOpenOrdersAccounts[i]?.baseTokenTotal.sub(
                mangoAccount.spotOpenOrdersAccounts[i]?.baseTokenFree
              )
            ) / Math.pow(10, spotMarketConfig.baseDecimals) || 0
          : 0
      const spotQuoteTokenLocked =
        mangoAccount && spotMarketConfig
          ? Number(
              mangoAccount.spotOpenOrdersAccounts[i]?.quoteTokenTotal.sub(
                mangoAccount.spotOpenOrdersAccounts[i]?.quoteTokenFree
              )
            ) / Math.pow(10, 6) || 0
          : 0
      const spotBaseTokenFree =
        mangoAccount && spotMarketConfig
          ? Number(mangoAccount.spotOpenOrdersAccounts[i]?.baseTokenFree) /
              Math.pow(10, spotMarketConfig.baseDecimals) || 0
          : 0
      const spotQuoteTokenFree =
        mangoAccount && spotMarketConfig
          ? Number(mangoAccount.spotOpenOrdersAccounts[i]?.quoteTokenFree) /
              Math.pow(10, 6) || 0
          : 0
      let inOrders = 0
      if (symbol === 'USDC' && ordersAsBalance) {
        for (let j = 0; j < mangoGroup.tokens.length; j++) {
          const inOrder =
            j !== QUOTE_INDEX &&
            mangoConfig.spotMarkets[j]?.publicKey &&
            mangoAccount?.spotOpenOrdersAccounts[j]?.quoteTokenTotal
              ? mangoAccount.spotOpenOrdersAccounts[j].quoteTokenTotal
              : 0
          inOrders += Number(inOrder) / Math.pow(10, 6)
        }
      } else {
        inOrders =
          spotMarketConfig &&
          mangoAccount?.spotOpenOrdersAccounts[i]?.baseTokenTotal
            ? Number(mangoAccount.spotOpenOrdersAccounts[i].baseTokenTotal) /
              Math.pow(10, spotMarketConfig.baseDecimals)
            : 0
      }

      // Retrieve perp positions if present
      const perpPosition =
        perpMarketConfig?.publicKey && mangoAccount
          ? mangoAccount?.perpAccounts[i]
          : null
      const perpMarketIndex =
        perpMarketConfig?.publicKey && mangoAccount
          ? getMarketIndexBySymbol(mangoConfig, symbol)
          : null
      const perpAccount =
        perpMarketConfig?.publicKey && mangoAccount
          ? mangoAccount?.perpAccounts[perpMarketIndex]
          : null
      const perpMarketCache =
        perpMarketConfig?.publicKey && mangoAccount
          ? mangoCache?.perpMarketCache[perpMarketIndex]
          : null
      const perpMarketInfo =
        perpMarketConfig?.publicKey && mangoAccount
          ? mangoGroup?.perpMarkets[perpMarketIndex]
          : null
      const basePosition =
        perpMarketConfig?.publicKey && mangoAccount
          ? Number(perpAccount?.basePosition) /
              Math.pow(10, perpContractPrecision[symbol]) || 0
          : 0
      const unsettledFunding =
        perpMarketConfig?.publicKey && mangoAccount
          ? (Number(perpAccount?.getUnsettledFunding(perpMarketCache)) *
              basePosition) /
              Math.pow(10, 6) || 0
          : 0
      const positionPnL =
        perpMarketConfig?.publicKey && mangoAccount
          ? Number(
              perpAccount?.getPnl(
                perpMarketInfo,
                perpMarketCache,
                mangoCache.priceCache[perpMarketIndex].price
              )
            ) / Math.pow(10, 6) || 0
          : 0
      const perpBids =
        perpMarketConfig?.publicKey && mangoAccount
          ? Number(perpPosition?.bidsQuantity) /
              Math.pow(10, perpContractPrecision[symbol]) || 0
          : Number(0)
      const perpAsks =
        perpMarketConfig?.publicKey && mangoAccount
          ? Number(perpPosition?.asksQuantity) /
              Math.pow(10, perpContractPrecision[symbol]) || 0
          : Number(0)

      if (
        spotMarketConfig?.publicKey ||
        perpMarketConfig?.publicKey ||
        symbol === 'USDC'
      ) {
        calculatorRowData = {
          symbolName: symbol,
          oracleIndex: symbol === 'USDC' ? null : i,
          hasMarketSpot: spotMarketConfig?.publicKey ? true : false,
          hasMarketPerp: perpMarketConfig?.publicKey ? true : false,
          priceDisabled: symbol === 'USDC' || symbol === 'USDT' ? true : false,
          price: floorToDecimal(
            Number(
              mangoGroup.getPrice(
                i < 0
                  ? mangoGroup.getTokenIndex(
                      getTokenBySymbol(mangoConfig, 'USDC').mintKey
                    )
                  : i,
                mangoCache
              )
            ),
            6
          ),
          spotNet:
            type === 'account'
              ? Number(
                  floorToDecimal(
                    spotDeposit - spotBorrow + (ordersAsBalance ? inOrders : 0),
                    spotMarketConfig?.baseDecimals || 6
                  )
                )
              : Number(0),
          spotDeposit:
            type === 'account'
              ? Number(
                  floorToDecimal(
                    spotDeposit,
                    spotMarketConfig?.baseDecimals || 6
                  )
                )
              : Number(0),
          spotBorrow:
            type === 'account'
              ? Number(
                  floorToDecimal(
                    spotBorrow,
                    spotMarketConfig?.baseDecimals || 6
                  )
                )
              : Number(0),
          spotInOrders:
            type === 'account'
              ? Number(floorToDecimal(inOrders, 6))
              : Number(0),
          spotBaseTokenFree:
            type === 'account'
              ? Number(floorToDecimal(spotBaseTokenFree, 6))
              : Number(0),
          spotBaseTokenLocked:
            type === 'account'
              ? Number(floorToDecimal(spotBaseTokenLocked, 6))
              : Number(0),
          spotQuoteTokenFree:
            type === 'account'
              ? Number(floorToDecimal(spotQuoteTokenFree, 6))
              : Number(0),
          spotQuoteTokenLocked:
            type === 'account'
              ? Number(floorToDecimal(spotQuoteTokenLocked, 6))
              : Number(0),
          spotMarketIndex: mangoGroup.spotMarkets[i]?.spotMarket
            ? spotMarketConfig?.marketIndex
            : null,
          spotPublicKey: mangoGroup.spotMarkets[i]?.spotMarket
            ? mangoGroup.spotMarkets[i]?.spotMarket
            : null,
          perpAvgEntryPrice: floorToDecimal(
            Number(
              mangoGroup.getPrice(
                i < 0
                  ? mangoGroup.getTokenIndex(
                      getTokenBySymbol(mangoConfig, 'USDC').mintKey
                    )
                  : i,
                mangoCache
              )
            ),
            6
          ),
          perpBasePosition:
            type === 'account' && perpMarketConfig?.publicKey
              ? Number(basePosition)
              : Number(0),
          perpScenarioPnL: 0,
          perpPositionPnL:
            type === 'account' && perpMarketConfig?.publicKey
              ? Number(floorToDecimal(positionPnL, 6))
              : Number(0),
          perpUnsettledFunding:
            type === 'account' && perpMarketConfig?.publicKey
              ? Number(floorToDecimal(unsettledFunding, 6))
              : Number(0),
          perpInOrders:
            type === 'account' && perpMarketConfig?.publicKey
              ? perpBids > Math.abs(perpAsks)
                ? perpBids
                : perpAsks
              : Number(0),
          perpBids:
            type === 'account' && perpMarketConfig?.publicKey
              ? perpBids || 0
              : Number(0),
          perpAsks:
            type === 'account' && perpMarketConfig?.publicKey
              ? perpAsks || 0
              : Number(0),
          perpPositionSide:
            type === 'account' &&
            perpMarketConfig?.publicKey &&
            basePosition < 0
              ? 'short'
              : 'long',
          perpBaseLotSize: mangoGroup.perpMarkets[i]?.perpMarket
            ? Number(mangoGroup.perpMarkets[i]?.baseLotSize)
            : null,
          perpQuoteLotSize: mangoGroup.perpMarkets[i]?.perpMarket
            ? Number(mangoGroup.perpMarkets[i]?.quoteLotSize)
            : null,
          perpMarketIndex: mangoGroup.perpMarkets[i]?.perpMarket
            ? mangoGroup.perpMarkets[i]?.perpMarket
            : null,
          perpPublicKey: mangoGroup.perpMarkets[i]?.perpMarket
            ? mangoGroup.perpMarkets[i]?.perpMarket
            : null,
          initAssetWeightSpot:
            symbol === 'USDC'
              ? 1
              : mangoGroup.spotMarkets[i]?.spotMarket
              ? roundToDecimal(
                  Number(mangoGroup.spotMarkets[i]?.initAssetWeight),
                  2
                )
              : 1,
          initLiabWeightSpot:
            symbol === 'USDC'
              ? 1
              : mangoGroup.spotMarkets[i]?.spotMarket
              ? roundToDecimal(
                  Number(mangoGroup.spotMarkets[i]?.initLiabWeight),
                  2
                )
              : 1,
          maintAssetWeightSpot:
            symbol === 'USDC'
              ? 1
              : mangoGroup.spotMarkets[i]?.spotMarket
              ? roundToDecimal(
                  Number(mangoGroup.spotMarkets[i]?.maintAssetWeight),
                  2
                )
              : 1,
          maintLiabWeightSpot:
            symbol === 'USDC'
              ? 1
              : mangoGroup.spotMarkets[i]?.spotMarket
              ? roundToDecimal(
                  Number(mangoGroup.spotMarkets[i]?.maintLiabWeight),
                  2
                )
              : 1,
          initAssetWeightPerp:
            symbol === 'USDC'
              ? 1
              : mangoGroup.perpMarkets[i]?.perpMarket
              ? roundToDecimal(
                  Number(mangoGroup.perpMarkets[i]?.initAssetWeight),
                  2
                )
              : 1,
          initLiabWeightPerp:
            symbol === 'USDC'
              ? 1
              : mangoGroup.perpMarkets[i]?.perpMarket
              ? roundToDecimal(
                  Number(mangoGroup.perpMarkets[i]?.initLiabWeight),
                  2
                )
              : 1,
          maintAssetWeightPerp:
            symbol === 'USDC'
              ? 1
              : mangoGroup.perpMarkets[i]?.perpMarket
              ? roundToDecimal(
                  Number(mangoGroup.perpMarkets[i]?.maintAssetWeight),
                  2
                )
              : 1,
          maintLiabWeightPerp:
            symbol === 'USDC'
              ? 1
              : mangoGroup.perpMarkets[i]?.perpMarket
              ? roundToDecimal(
                  Number(mangoGroup.perpMarkets[i]?.maintLiabWeight),
                  2
                )
              : 1,
          precision:
            symbol === 'USDC'
              ? 4
              : mangoGroup.spotMarkets[i]?.spotMarket
              ? tokenPrecision[spotMarketConfig?.baseSymbol]
              : tokenPrecision[perpMarketConfig?.baseSymbol] || 6,
        }

        rowData.push(calculatorRowData)
      }
    }

    const calcData = updateCalculator(rowData)
    setScenarioBars(calcData)
  }

  // Update the rows for the scenario
  const updateCalculator = (rowData: CalculatorRow[]) => {
    return {
      rowData: rowData,
    } as ScenarioCalculator
  }

  // Reset column details
  const resetScenarioColumn = (column) => {
    let resetRowData
    mangoGroup
      ? (resetRowData = scenarioBars.rowData.map((asset) => {
          let resetValue: number
          let resetDeposit: number
          let resetBorrow: number
          let resetInOrders: number
          let resetPositionSide: string
          let resetPerpPositionPnL: number
          let resetPerpUnsettledFunding: number
          let resetPerpInOrders: number

          switch (column) {
            case 'price':
              setSliderPercentage(defaultSliderVal)
              resetValue =
                floorToDecimal(
                  Number(
                    mangoGroup?.getPrice(
                      asset.oracleIndex === null
                        ? mangoGroup.getTokenIndex(
                            getTokenBySymbol(mangoConfig, 'USDC').mintKey
                          )
                        : asset.oracleIndex,
                      mangoCache
                    )
                  ),
                  6
                ) || 0
              break
            case 'perpAvgEntryPrice':
              setSliderPercentage(defaultSliderVal)
              resetValue =
                floorToDecimal(
                  Number(
                    mangoGroup?.getPrice(
                      asset.oracleIndex === null
                        ? mangoGroup.getTokenIndex(
                            getTokenBySymbol(mangoConfig, 'USDC').mintKey
                          )
                        : asset.oracleIndex,
                      mangoCache
                    )
                  ),
                  6
                ) || 0
              break
            case 'spotNet':
              {
                // Get market configuration data if present
                const spotMarketConfig =
                  asset.oracleIndex === null
                    ? null
                    : getMarketByPublicKey(
                        mangoConfig,
                        mangoGroup.spotMarkets[asset.oracleIndex].spotMarket
                      )

                // Retrieve spot balances if present
                resetDeposit =
                  Number(
                    mangoAccount && spotMarketConfig
                      ? mangoAccount.getUiDeposit(
                          mangoCache.rootBankCache[
                            spotMarketConfig.marketIndex
                          ],
                          mangoGroup,
                          spotMarketConfig.marketIndex
                        )
                      : mangoAccount && asset.symbolName === 'USDC'
                      ? mangoAccount.getUiDeposit(
                          mangoCache.rootBankCache[QUOTE_INDEX],
                          mangoGroup,
                          QUOTE_INDEX
                        )
                      : 0
                  ) || 0
                resetBorrow =
                  Number(
                    mangoAccount && spotMarketConfig
                      ? mangoAccount.getUiBorrow(
                          mangoCache.rootBankCache[
                            spotMarketConfig.marketIndex
                          ],
                          mangoGroup,
                          spotMarketConfig.marketIndex
                        )
                      : mangoAccount && asset.symbolName === 'USDC'
                      ? mangoAccount.getUiBorrow(
                          mangoCache.rootBankCache[QUOTE_INDEX],
                          mangoGroup,
                          QUOTE_INDEX
                        )
                      : 0
                  ) || 0
                resetInOrders = 0

                if (asset.symbolName === 'USDC' && ordersAsBalance) {
                  for (let j = 0; j < mangoGroup.tokens.length; j++) {
                    const inOrder =
                      j !== QUOTE_INDEX &&
                      mangoConfig.spotMarkets[j]?.publicKey &&
                      mangoAccount?.spotOpenOrdersAccounts[j]?.quoteTokenTotal
                        ? mangoAccount.spotOpenOrdersAccounts[j].quoteTokenTotal
                        : 0
                    resetInOrders += Number(inOrder) / Math.pow(10, 6)
                  }
                } else {
                  resetInOrders =
                    spotMarketConfig &&
                    mangoAccount?.spotOpenOrdersAccounts[asset.oracleIndex]
                      ?.baseTokenTotal
                      ? Number(
                          mangoAccount.spotOpenOrdersAccounts[asset.oracleIndex]
                            .baseTokenTotal
                        ) / Math.pow(10, spotMarketConfig.baseDecimals)
                      : 0
                }
                resetValue = floorToDecimal(
                  resetDeposit -
                    resetBorrow +
                    (ordersAsBalance ? resetInOrders : 0),
                  spotMarketConfig?.baseDecimals || 6
                )
              }
              break
            case 'perpBasePosition':
              {
                // Get market configuration data
                const symbol = asset.symbolName
                const perpMarketConfig =
                  asset.oracleIndex === null
                    ? null
                    : getMarketByPublicKey(
                        mangoConfig,
                        mangoGroup.perpMarkets[asset.oracleIndex].perpMarket
                      )

                // Retrieve perp positions if present
                const perpPosition =
                  perpMarketConfig?.publicKey && mangoAccount
                    ? mangoAccount?.perpAccounts[asset.oracleIndex]
                    : null
                const perpMarketIndex =
                  perpMarketConfig?.publicKey && mangoAccount
                    ? getMarketIndexBySymbol(mangoConfig, symbol)
                    : null
                const perpAccount =
                  perpMarketConfig?.publicKey && mangoAccount
                    ? mangoAccount?.perpAccounts[perpMarketIndex]
                    : null
                const perpMarketCache =
                  perpMarketConfig?.publicKey && mangoAccount
                    ? mangoCache?.perpMarketCache[perpMarketIndex]
                    : null
                const perpMarketInfo =
                  perpMarketConfig?.publicKey && mangoAccount
                    ? mangoGroup?.perpMarkets[perpMarketIndex]
                    : null
                const basePosition =
                  perpMarketConfig?.publicKey && mangoAccount
                    ? Number(perpAccount?.basePosition) /
                      Math.pow(10, perpContractPrecision[symbol])
                    : 0
                const unsettledFunding =
                  perpMarketConfig?.publicKey && mangoAccount
                    ? (Number(
                        perpAccount?.getUnsettledFunding(perpMarketCache)
                      ) *
                        basePosition) /
                      Math.pow(10, 6)
                    : 0
                const positionPnL =
                  perpMarketConfig?.publicKey && mangoAccount
                    ? Number(
                        perpAccount?.getPnl(
                          perpMarketInfo,
                          perpMarketCache,
                          mangoCache.priceCache[perpMarketIndex].price
                        )
                      ) / Math.pow(10, 6)
                    : 0
                const perpInOrders = perpMarketConfig?.publicKey
                  ? Number(perpPosition?.bidsQuantity) >
                    Math.abs(Number(perpPosition?.asksQuantity))
                    ? floorToDecimal(
                        Number(perpPosition?.bidsQuantity),
                        tokenPrecision[perpMarketConfig?.baseSymbol] || 6
                      )
                    : floorToDecimal(
                        -1 * Number(perpPosition?.asksQuantity),
                        tokenPrecision[perpMarketConfig?.baseSymbol] || 6
                      )
                  : 0

                resetValue = basePosition
                resetPositionSide = resetValue < 0 ? 'short' : 'long'
                resetPerpPositionPnL = positionPnL
                resetPerpUnsettledFunding = unsettledFunding
                resetPerpInOrders = perpInOrders
              }
              break
          }

          if (column === 'spotNet') {
            return {
              ...asset,
              [column]: resetValue,
              ['spotDeposit']: resetDeposit,
              ['spotBorrow']: resetBorrow,
              ['spotInOrders']: resetInOrders,
            }
          } else if (column === 'perpBasePosition') {
            return {
              ...asset,
              [column]: resetValue,
              ['perpPositionSide']: resetPositionSide,
              ['perpPositionPnL']: resetPerpPositionPnL,
              ['perpUnsettledFunding']: resetPerpUnsettledFunding,
              ['perpInOrders']: resetPerpInOrders,
            }
          } else {
            return { ...asset, [column]: resetValue }
          }
        }))
      : (resetRowData = scenarioBars.rowData)

    const updatedScenarioBarData = updateCalculator(resetRowData)
    setScenarioBars(updatedScenarioBarData)
  }

  // Update values based on user input
  const updateValue = (symbol, field, val) => {
    const updateValue = Number(val)
    if (!Number.isNaN(val)) {
      const updatedRowData = scenarioBars.rowData.map((asset) => {
        if (asset.symbolName.toLowerCase() === symbol.toLowerCase()) {
          switch (field) {
            case 'spotNet':
              return {
                ...asset,
                [field]: updateValue,
                ['spotDeposit']: updateValue > 0 ? updateValue : 0,
                ['spotBorrow']: updateValue < 0 ? updateValue : 0,
              }
            case 'perpBasePosition':
              return {
                ...asset,
                [field]: updateValue,
                ['perpPositionSide']: val < 0 ? 'short' : 'long',
              }
            case 'perpAvgEntryPrice':
              return {
                ...asset,
                [field]: Math.abs(updateValue),
              }
            case 'price':
              return {
                ...asset,
                [field]: Math.abs(
                  sliderPercentage === 0
                    ? updateValue
                    : updateValue / sliderPercentage
                ),
              }
          }
        } else {
          return asset
        }
      })

      const calcData = updateCalculator(updatedRowData)
      setScenarioBars(calcData)
    }
  }

  // Anchor current displayed prices to zero
  const anchorPricing = () => {
    const updatedRowData = scenarioBars.rowData.map((asset) => {
      return {
        ...asset,
        ['price']:
          Math.abs(asset.price) * (asset.priceDisabled ? 1 : sliderPercentage),
      }
    })

    const calcData = updateCalculator(updatedRowData)
    setScenarioBars(calcData)
  }

  // Handle slider usage
  const onChangeSlider = async (percentage) => {
    setSliderPercentage(percentage)
  }

  // Calculate scenario health for display
  function getScenarioDetails() {
    const scenarioHashMap = new Map()

    // Standard scenario variables
    let assets = 0
    let liabilities = 0
    let initAssets = 0
    let maintAssets = 0
    let initLiabilities = 0
    let maintLiabilities = 0
    let percentToLiquidation = 0
    let percentToLiquidationAbsolute = 0

    // Detailed health scenario variables
    let equity = 0
    let leverage = 0
    let initHealth = 1
    let maintHealth = 1
    let riskRanking = 'Not Set'

    if (scenarioBars) {
      // Return scenario health
      const scenarioDetails = getHealthComponents(sliderPercentage)

      assets = scenarioDetails['assets']
      liabilities = scenarioDetails['liabilities']
      initAssets = scenarioDetails['initAssets']
      maintAssets = scenarioDetails['maintAssets']
      initLiabilities = scenarioDetails['initLiabilities']
      maintLiabilities = scenarioDetails['maintLiabilities']

      equity = assets - liabilities
      if (equity > 0 && liabilities != 0) {
        leverage = Math.abs(liabilities / equity)
      }

      // Calculate health ratios and risk ranking
      if (liabilities > 0) {
        initHealth = initAssets / initLiabilities - 1
        maintHealth = maintAssets / maintLiabilities - 1
      }

      riskRanking =
        maintHealth > 0.4
          ? riskRanks[0]
          : maintHealth > 0.3
          ? riskRanks[1]
          : initHealth > 0
          ? riskRanks[2]
          : maintHealth > 0
          ? riskRanks[3]
          : riskRanks[4]

      // Calculate percent to liquidation
      const scenarioBaseLine = getHealthComponents(1)
      const scenarioBaseChange = getHealthComponents(1.01)
      const maintEquity =
        scenarioBaseLine['maintAssets'] - scenarioBaseLine['maintLiabilities']
      const maintAssetsRateOfChange =
        scenarioBaseChange['maintAssets'] - scenarioBaseLine['maintAssets']
      const maintLiabsRateOfChange =
        scenarioBaseChange['maintLiabilities'] -
        scenarioBaseLine['maintLiabilities']
      const maintRateOfChange = maintLiabsRateOfChange - maintAssetsRateOfChange
      percentToLiquidation =
        maintHealth > 0
          ? roundToDecimal(
              100 + maintEquity / maintRateOfChange - sliderPercentage * 100,
              1
            )
          : 0
      percentToLiquidationAbsolute =
        maintHealth > 0
          ? roundToDecimal(1 / (sliderPercentage / percentToLiquidation), 1)
          : 0

      if (sliderPercentage * 100 + percentToLiquidation < 0) {
        percentToLiquidation = -9999
        percentToLiquidationAbsolute = -9999
      }
    }

    // Add scenario details for display
    scenarioHashMap.set('assets', assets)
    scenarioHashMap.set('liabilities', liabilities)
    scenarioHashMap.set('equity', equity)
    scenarioHashMap.set('leverage', leverage)
    scenarioHashMap.set('initWeightAssets', initAssets)
    scenarioHashMap.set('initWeightLiabilities', initLiabilities)
    scenarioHashMap.set('maintWeightAssets', maintAssets)
    scenarioHashMap.set('maintWeightLiabilities', maintLiabilities)
    scenarioHashMap.set('initHealth', initHealth)
    scenarioHashMap.set('maintHealth', maintHealth)
    scenarioHashMap.set('riskRanking', riskRanking)
    scenarioHashMap.set(
      'percentToLiquidation',
      Number.isFinite(percentToLiquidation)
        ? percentToLiquidation === -9999
          ? 'N/A'
          : percentToLiquidation
        : 'N/A'
    )
    scenarioHashMap.set(
      'percentToLiquidationAbsolute',
      Number.isFinite(percentToLiquidationAbsolute)
        ? percentToLiquidationAbsolute === -9999
          ? 'N/A'
          : percentToLiquidationAbsolute
        : 'N/A'
    )

    return scenarioHashMap
  }

  // Calculate health components
  function getHealthComponents(modPrice) {
    // Standard scenario variables
    let assets = 0
    let liabilities = 0
    let initAssets = 0
    let maintAssets = 0
    let initLiabilities = 0
    let maintLiabilities = 0

    // Spot Assets and Liabilities variables
    let quoteCalc = 0
    let spotAssets = 0
    let spotLiabilities = 0

    // Perps Assets and Liabilities variables
    let perpsAssets = 0
    let perpsLiabilities = 0

    scenarioBars.rowData.map((asset) => {
      // SPOT
      // Calculate spot quote
      if (asset.symbolName === 'USDC' && Number(asset.spotNet) > 0) {
        quoteCalc += asset.spotNet
      } else if (asset.symbolName === 'USDC' && asset.spotNet < 0) {
        quoteCalc -= Math.abs(asset.spotNet)
      }

      let spotQuote =
        asset.spotNet * asset.price * (asset.priceDisabled ? 1 : modPrice)

      // Handle spot orders if not to be included as balance
      if (
        !ordersAsBalance &&
        asset.symbolName !== 'USDC' &&
        asset.spotInOrders != 0
      ) {
        const spotBidsBaseNet =
          asset.spotNet +
          (asset.price > 0 ? asset.spotQuoteTokenLocked / asset.price : 0) +
          asset.spotBaseTokenFree +
          asset.spotBaseTokenLocked
        const spotAsksBaseNet = asset.spotNet + asset.spotBaseTokenFree
        if (spotBidsBaseNet > Math.abs(spotAsksBaseNet)) {
          spotQuote =
            spotBidsBaseNet * asset.price * (asset.priceDisabled ? 1 : modPrice)
          quoteCalc += asset.spotQuoteTokenFree
        } else {
          spotQuote =
            spotAsksBaseNet * asset.price * (asset.priceDisabled ? 1 : modPrice)
          quoteCalc +=
            (asset.price > 0 ? asset.spotBaseTokenLocked * asset.price : 0) +
            asset.spotQuoteTokenFree +
            asset.spotQuoteTokenLocked
        }
      }

      // Calculate spot assets
      spotAssets += spotQuote > 0 ? spotQuote : 0
      initAssets +=
        spotQuote > 0 && asset.symbolName !== 'USDC'
          ? spotQuote * asset.initAssetWeightSpot
          : 0
      maintAssets +=
        spotQuote > 0 && asset.symbolName !== 'USDC'
          ? spotQuote * asset.maintAssetWeightSpot
          : 0

      // Calculate spot liabilities
      spotLiabilities += spotQuote < 0 ? Math.abs(spotQuote) : 0
      initLiabilities +=
        spotQuote <= 0 && asset.symbolName !== 'USDC'
          ? Math.abs(spotQuote) * asset.initLiabWeightSpot
          : 0
      maintLiabilities +=
        spotQuote <= 0 && asset.symbolName !== 'USDC'
          ? Math.abs(spotQuote) * asset.maintLiabWeightSpot
          : 0

      // PERPS
      // Get simple perp asset and liability value
      let assetVal = 0
      let liabVal = 0
      const perpBasPosValSimple =
        asset.perpBasePosition * (asset.price * modPrice)
      liabVal = asset.perpBasePosition < 0 ? perpBasPosValSimple : 0
      assetVal = asset.perpBasePosition > 0 ? perpBasPosValSimple : 0

      // Calculate scenario profit and loss
      const scenarioPnL =
        asset.perpBasePosition > 0
          ? asset.perpBasePosition *
            (asset.price * modPrice - asset.perpAvgEntryPrice)
          : Math.abs(asset.perpBasePosition) *
            (asset.perpAvgEntryPrice - asset.price * modPrice)

      // Get base and quote position values
      let basPosVal = asset.perpBasePosition * (asset.price * modPrice)
      let perpQuotePos = -1 * basPosVal + asset.perpPositionPnL + scenarioPnL

      // Handle perp orders if not to be cancelled
      if (
        !ordersAsBalance &&
        asset.symbolName !== 'USDC' &&
        asset.perpInOrders != 0
      ) {
        const perpBidsBaseNet = asset.perpBasePosition + asset.perpBids
        const perpAsksBaseNet = asset.perpBasePosition - asset.perpAsks
        if (!ordersAsBalance && perpBidsBaseNet > Math.abs(perpAsksBaseNet)) {
          perpQuotePos =
            -1 * basPosVal +
            asset.perpPositionPnL +
            scenarioPnL -
            asset.perpBids * asset.price
          basPosVal = perpBidsBaseNet * (asset.price * modPrice)
        } else {
          perpQuotePos =
            -1 * basPosVal +
            asset.perpPositionPnL +
            scenarioPnL +
            asset.perpAsks * asset.price
          basPosVal = perpAsksBaseNet * (asset.price * modPrice)
        }
      }

      // Adjust for PnL and unsettledFunding, then add to assets or liabilities
      const realQuotePosition =
        -1 * asset.perpBasePosition * (asset.price * modPrice) +
        asset.perpPositionPnL +
        scenarioPnL -
        asset.perpUnsettledFunding
      if (realQuotePosition < 0) {
        liabVal = Math.abs(liabVal + realQuotePosition)
      } else if (realQuotePosition > 0) {
        assetVal = Math.abs(assetVal + realQuotePosition)
      }
      liabVal = Math.abs(liabVal)
      assetVal = Math.abs(assetVal)
      perpsAssets += assetVal
      perpsLiabilities += liabVal

      // Assign to quote, assets and liabilities
      quoteCalc += perpQuotePos
      initAssets += basPosVal > 0 ? basPosVal * asset.initAssetWeightPerp : 0
      initLiabilities +=
        basPosVal < 0 ? Math.abs(basPosVal) * asset.initLiabWeightPerp : 0
      maintAssets += basPosVal > 0 ? basPosVal * asset.maintAssetWeightPerp : 0
      maintLiabilities +=
        basPosVal < 0 ? Math.abs(basPosVal) * asset.maintLiabWeightPerp : 0
    })

    // Calculate basic scenario details
    assets = spotAssets + perpsAssets
    liabilities = spotLiabilities + perpsLiabilities

    // Calculate weighted assets and liabilities
    initAssets += quoteCalc > 0 ? quoteCalc : 0
    maintAssets += quoteCalc > 0 ? quoteCalc : 0
    initLiabilities += quoteCalc <= 0 ? Math.abs(quoteCalc) : 0
    maintLiabilities += quoteCalc <= 0 ? Math.abs(quoteCalc) : 0

    return {
      assets: assets,
      liabilities: liabilities,
      initAssets: initAssets,
      maintAssets: maintAssets,
      initLiabilities: initLiabilities,
      maintLiabilities: maintLiabilities,
    }
  }

  // Calculate single asset liquidation prices
  function getLiquidationPrices() {
    const liquidationHashMap = new Map()

    if (scenarioBars) {
      scenarioBars.rowData.map((assetToTest) => {
        let liqPrice = 0
        if (assetToTest.symbolName !== 'USDC') {
          let quoteCalc = 0
          let weightedAsset = 0
          let partialHealth = 0

          // Calculate quote
          scenarioBars.rowData.map((asset) => {
            if (asset.symbolName === 'USDC' && Number(asset.spotNet) > 0) {
              quoteCalc += asset.spotNet
            } else if (asset.symbolName === 'USDC' && asset.spotNet < 0) {
              quoteCalc -= Math.abs(asset.spotNet)
            }

            const scenarioPnL =
              asset.perpBasePosition > 0
                ? asset.perpBasePosition *
                  (asset.price * sliderPercentage - asset.perpAvgEntryPrice)
                : Math.abs(asset.perpBasePosition) *
                  (asset.perpAvgEntryPrice - asset.price * sliderPercentage)
            const basPosVal =
              asset.perpBasePosition * (asset.price * sliderPercentage)
            const perpQuotePos =
              -1 * basPosVal + asset.perpPositionPnL + scenarioPnL
            quoteCalc += perpQuotePos
          })

          // Calculate weighted asset and partial health to draw from
          partialHealth = quoteCalc
          scenarioBars.rowData.map((asset) => {
            if (asset.symbolName !== 'USDC') {
              if (asset.symbolName === assetToTest.symbolName) {
                const weightedSpot =
                  asset.spotNet *
                  (asset.spotNet > 0
                    ? asset.maintAssetWeightSpot
                    : asset.maintLiabWeightSpot)
                const weightedPerp =
                  asset.perpBasePosition *
                  (asset.perpBasePosition > 0
                    ? asset.maintAssetWeightPerp
                    : asset.maintLiabWeightPerp)
                weightedAsset += (weightedSpot + weightedPerp) * -1
              } else {
                const spotHealth =
                  asset.spotNet *
                  asset.price *
                  (asset.priceDisabled ? 1 : sliderPercentage) *
                  (asset.spotNet > 0
                    ? asset.maintAssetWeightSpot
                    : asset.maintLiabWeightSpot)
                const perpHealth =
                  asset.perpBasePosition *
                  asset.price *
                  (asset.priceDisabled ? 1 : sliderPercentage) *
                  (asset.perpBasePosition > 0
                    ? asset.maintAssetWeightPerp
                    : asset.maintLiabWeightPerp)
                partialHealth += spotHealth + perpHealth
              }
            }
          })

          // Calculate liquidation price
          if (weightedAsset === 0) {
            liqPrice = 0
          } else {
            liqPrice = partialHealth / weightedAsset
            if (liqPrice < 0) {
              liqPrice = 0
            }
          }

          liquidationHashMap.set(assetToTest.symbolName.toString(), liqPrice)
        } else {
          liquidationHashMap.set(assetToTest.symbolName.toString(), liqPrice)
        }
      })
    }

    return liquidationHashMap
  }

  // Get detailed scenario summary and liquidation prices
  const scenarioDetails = getScenarioDetails()
  const liquidationPrices = getLiquidationPrices()

  // Update focused input and update scanerio if input is valid
  const updateInterimValue = (symbol, field, type, identifier, val) => {
    const interimVal = val
    const interimIdentifier = identifier

    switch (type) {
      case 'focus':
        setInterimValue(interimValue.set(interimIdentifier, interimVal))
        break
      case 'change':
        if (Number(val) === 0 || Number.isNaN(val)) {
          setInterimValue(interimValue.set(interimIdentifier, interimVal))
          updateValue(symbol, field, 0)
        } else {
          updateValue(symbol, field, val)
          setInterimValue(interimValue.set(interimIdentifier, val))
        }
        break
      case 'blur':
        if (Number(val) === 0 || Number.isNaN(val)) {
          updateValue(symbol, field, 0)
          interimValue.delete(interimIdentifier)
          setInterimValue(new Map())
        } else {
          updateValue(symbol, field, val)
          interimValue.delete(interimIdentifier)
          setInterimValue(new Map())
        }
        break
    }
  }

  // Display all
  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col pt-8 pb-3 sm:pb-6 md:pt-10">
          <h1 className={`mb-2 text-th-fgd-1 text-2xl font-semibold`}>
            {t('calculator:risk-calculator')}
          </h1>
          <p className="mb-0">
            IN TESTING (Use at your own risk): Please report any bugs or
            comments in our #dev-ui discord channel.
          </p>
        </div>
        {scenarioBars?.rowData.length > 0 ? (
          <div className="rounded-lg bg-th-bkg-2">
            <div className="grid grid-cols-12">
              <div className="col-span-12 md:col-span-8 p-4">
                <div className="flex justify-between pb-2 lg:pb-3 px-0 lg:px-3">
                  <div className="pb-4 lg:pb-0 text-th-fgd-1 text-lg">
                    {t('calculator:scenario-balances')}
                  </div>
                  <div className="flex justify-between lg:justify-start">
                    <Button
                      className={`text-xs flex items-center justify-center sm:ml-3 pt-0 pb-0 h-8 pl-3 pr-3 rounded`}
                      onClick={() => {
                        setSliderPercentage(defaultSliderVal)
                        toggleOrdersAsBalance(false)
                        createScenario(accountConnected ? 'account' : 'blank')
                      }}
                    >
                      <div className="flex items-center hover:text-th-primary">
                        <RefreshIcon className="h-5 w-5 mr-1.5" />
                        {t('reset')}
                      </div>
                    </Button>
                  </div>
                </div>
                <div className="bg-th-bkg-1 border border-th-fgd-4 flex items-center mb-3 lg:mx-3 px-3 h-8 rounded">
                  <div className="pr-5 text-th-fgd-3 text-xs whitespace-nowrap">
                    {t('calculator:edit-all-prices')}
                  </div>
                  <div className="w-full">
                    <Slider
                      onChange={(e) => {
                        onChangeSlider(e)
                      }}
                      step={0.01}
                      value={sliderPercentage}
                      min={0}
                      max={3.5}
                      defaultValue={defaultSliderVal}
                      trackStyle={{ backgroundColor: '#F2C94C' }}
                      handleStyle={{
                        borderColor: '#F2C94C',
                        backgroundColor: '#f7f7f7',
                      }}
                      railStyle={{ backgroundColor: '#F2C94C' }}
                    />
                  </div>
                  <div className="pl-4 text-th-fgd-1 text-xs w-16">
                    {`${Number((sliderPercentage - 1) * 100).toFixed(0)}%`}
                  </div>
                  <div className="pl-4 text-th-fgd-1 text-xs w-16 hover:text-th-primary">
                    <LinkButton
                      onClick={() => setSliderPercentage(defaultSliderVal)}
                    >
                      {t('reset')}
                    </LinkButton>
                  </div>
                </div>
                <div className="flex justify-between wrap pb-2 lg:pb-3 px-0 lg:px-3">
                  <div className="flex items-center mb-3 lg:mx-3 px-3 h-8 rounded">
                    <Switch
                      checked={showZeroBalances}
                      className="text-xs"
                      onChange={() => setShowZeroBalances(!showZeroBalances)}
                    >
                      {t('show-zero')}
                    </Switch>
                  </div>
                  <div className="flex items-center mb-3 lg:mx-3 px-3 h-8 rounded">
                    <Switch
                      checked={ordersAsBalance}
                      className="text-xs"
                      onChange={() => toggleOrdersAsBalance(!ordersAsBalance)}
                    >
                      {t('calculator:simulate-orders-cancelled')}
                    </Switch>
                  </div>
                  <div className="flex justify-between lg:justify-start">
                    <Tooltip content={t('calculator:tooltip-anchor-slider')}>
                      <Button
                        className={`text-xs flex items-center justify-center sm:ml-3 pt-0 pb-0 h-8 pl-3 pr-3 rounded`}
                        onClick={() => {
                          anchorPricing()
                          setSliderPercentage(defaultSliderVal)
                        }}
                      >
                        <div className="flex items-center hover:text-th-primary">
                          <AnchorIcon className="h-5 w-5 mr-1.5" />
                          {t('calculator:anchor-slider')}
                        </div>
                      </Button>
                    </Tooltip>
                  </div>
                </div>
                {/*Hidden panel that displays a short scenario summary on mobile instead of the detailed one*/}
                <div className="bg-th-bkg-1 border border-th-fgd-4 md:hidden sticky w-full rounded mb-3">
                  <Disclosure>
                    {({ open }) => (
                      <>
                        <Disclosure.Button className="bg-th-bkg-1 default-transition flex items-center justify-between p-3 w-full hover:bg-th-bkg-1 focus:outline-none">
                          <div className="text-th-fgd-3">
                            {open
                              ? t('calculator:scenario-details')
                              : t('calculator:scenario-maint-health')}
                          </div>
                          {open ? null : (
                            <div className="text-th-fgd-3 text-xs">
                              {scenarioDetails.get('maintHealth') * 100 >= 9999
                                ? '>10000'
                                : scenarioDetails.get('maintHealth') * 100 < 0
                                ? '<0'
                                : (
                                    scenarioDetails.get('maintHealth') * 100
                                  ).toFixed(2)}
                              %
                            </div>
                          )}
                          <ChevronUpIcon
                            className={`default-transition h-4 text-th-fgd-1 w-4 ${
                              open
                                ? 'transform rotate-360'
                                : 'transform rotate-180'
                            }`}
                          />
                        </Disclosure.Button>
                        <Disclosure.Panel className="p-3">
                          <div className="text-th-fgd-1 text-xs">
                            <div className="flex items-center justify-between pb-3">
                              <div className="text-th-fgd-3">
                                {t('maint-health')}
                              </div>
                              {scenarioDetails.get('maintHealth') * 100 >= 9999
                                ? '>10000'
                                : scenarioDetails.get('maintHealth') * 100 < 0
                                ? '<0'
                                : (
                                    scenarioDetails.get('maintHealth') * 100
                                  ).toFixed(2)}
                              %
                            </div>
                            <div className="flex items-center justify-between pb-3">
                              <div className="text-th-fgd-3">
                                {t('init-health')}
                              </div>
                              {scenarioDetails.get('initHealth') * 100 >= 9999
                                ? '>10000'
                                : scenarioDetails.get('initHealth') * 100 < 0
                                ? '<0'
                                : (
                                    scenarioDetails.get('initHealth') * 100
                                  ).toFixed(2)}
                              %
                            </div>
                            <div className="flex items-center justify-between pb-3">
                              <div className="text-th-fgd-3">
                                {t('calculator:new-positions-openable')}
                              </div>
                              <div
                                className={`font-bold ${
                                  scenarioDetails.get('initHealth') * 100 >= 0
                                    ? 'text-th-green'
                                    : 'text-th-red'
                                }`}
                              >
                                {scenarioDetails.get('initHealth') * 100 >= 0
                                  ? 'Yes'
                                  : 'No'}
                              </div>
                            </div>
                            <div className="flex items-center justify-between pb-3">
                              <div className="text-th-fgd-3">{t('health')}</div>
                              <div className="font-bold">
                                {
                                  <div
                                    className={`font-bold ${
                                      scenarioDetails.get('maintHealth') * 100 <
                                      0
                                        ? 'text-th-red'
                                        : scenarioDetails.get('riskRanking') ===
                                          riskRanks[3]
                                        ? 'text-th-red'
                                        : scenarioDetails.get('riskRanking') ===
                                          riskRanks[2]
                                        ? 'text-th-orange'
                                        : scenarioDetails.get('riskRanking') ===
                                          riskRanks[1]
                                        ? 'text-th-primary'
                                        : 'text-th-green'
                                    }`}
                                  >
                                    {scenarioDetails.get('maintHealth') * 100 <
                                    0
                                      ? riskRanks[4]
                                      : scenarioDetails.get('riskRanking')}
                                  </div>
                                }
                              </div>
                            </div>
                            <div>
                              <div className="flex items-center justify-between pb-3">
                                <div className="text-th-fgd-3">
                                  {t('account-value')}
                                </div>
                                <div className="font-bold">
                                  {formatUsdValue(
                                    scenarioDetails.get('equity')
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between pb-3">
                              <div className="text-th-fgd-3">
                                {t('calculator:percent-move-liquidation')}
                              </div>
                              <div className="font-bold">
                                {scenarioDetails.get(
                                  'percentToLiquidationAbsolute'
                                )}
                                %
                              </div>
                            </div>
                          </div>
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                </div>
                {/*Create scenario table for display*/}
                <div className={`flex flex-col pb-2`}>
                  <div className={`-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8`}>
                    <div
                      className={`align-middle inline-block min-w-full sm:px-6 lg:px-8`}
                    >
                      <Table className="min-w-full divide-y divide-th-bkg-2">
                        <Thead>
                          <Tr className="text-th-fgd-3 text-xs">
                            <Th
                              scope="col"
                              className={`px-1 lg:px-3 py-1 text-left font-normal`}
                            >
                              {t('asset')}
                            </Th>
                            <Th
                              scope="col"
                              className={`px-1 lg:px-3 py-1 text-left font-normal`}
                            >
                              <div className="flex justify-start md:justify-between">
                                <div className="pr-2">{t('spot')}</div>
                                <LinkButton
                                  onClick={() => resetScenarioColumn('spotNet')}
                                >
                                  {t('reset')}
                                </LinkButton>
                              </div>
                            </Th>
                            <Th
                              scope="col"
                              className={`px-1 lg:px-3 py-1 text-left font-normal`}
                            >
                              <div className="flex justify-start md:justify-between">
                                <div className="pr-2">{t('perp')}</div>
                                <LinkButton
                                  onClick={() =>
                                    resetScenarioColumn('perpBasePosition')
                                  }
                                >
                                  {t('reset')}
                                </LinkButton>
                              </div>
                            </Th>
                            <Th
                              scope="col"
                              className={`px-1 lg:px-3 py-1 text-left font-normal`}
                            >
                              <div className="flex justify-start md:justify-between">
                                <div className="pr-2">
                                  {t('calculator:perp-entry')}
                                </div>
                                <LinkButton
                                  onClick={() =>
                                    resetScenarioColumn('perpAvgEntryPrice')
                                  }
                                >
                                  {t('reset')}
                                </LinkButton>
                              </div>
                            </Th>
                            <Th
                              scope="col"
                              className={`px-1 lg:px-3 py-1 font-normal`}
                            >
                              <div className="flex justify-start md:justify-between">
                                <div className="pr-2">{t('price')}</div>
                                <LinkButton
                                  onClick={() => resetScenarioColumn('price')}
                                >
                                  {t('reset')}
                                </LinkButton>
                              </div>
                            </Th>
                            <Th
                              scope="col"
                              className={`px-1 lg:px-3 py-1 text-left font-normal`}
                            >
                              <div className="flex justify-start md:justify-between">
                                <Tooltip content="Spot Value + Perp Balance">
                                  <div className="pr-2">{t('value')}</div>
                                </Tooltip>
                              </div>
                            </Th>
                            <Th
                              scope="col"
                              className={`px-1 lg:px-3 py-1 text-left font-normal`}
                            >
                              <div className="flex justify-start md:justify-between">
                                <Tooltip content="Single asset liquidation price assuming all other asset prices remain constant">
                                  <div className="pr-2">
                                    {t('calculator:liq-price')}
                                  </div>
                                </Tooltip>
                              </div>
                            </Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {/*Populate scenario table with data*/}
                          {scenarioBars.rowData.map((asset, i) =>
                            asset.symbolName === 'USDC' ||
                            (asset.spotNet != 0 && asset.hasMarketSpot) ||
                            (asset.perpBasePosition != 0 &&
                              asset.hasMarketPerp) ||
                            showZeroBalances ? (
                              <Tr
                                className={`${
                                  i % 2 === 0
                                    ? `bg-th-bkg-3 md:bg-th-bkg-2`
                                    : `bg-th-bkg-2`
                                }`}
                                key={`${i}`}
                              >
                                <Td
                                  className={`px-3 py-2 whitespace-nowrap text-sm text-th-fgd-1 w-24`}
                                >
                                  <div className="flex items-center">
                                    <img
                                      alt=""
                                      width="20"
                                      height="20"
                                      src={`/assets/icons/${asset.symbolName.toLowerCase()}.svg`}
                                      className={`mr-2.5`}
                                    />
                                    <div>{asset.symbolName}</div>
                                  </div>
                                </Td>
                                <Td
                                  className={`px-1 lg:px-3 py-2 text-sm text-th-fgd-1`}
                                >
                                  <Input
                                    id={'spotNet_' + i}
                                    type="number"
                                    onFocus={(e) =>
                                      e.target.id === e.currentTarget.id
                                        ? updateInterimValue(
                                            asset.symbolName,
                                            'spotNet',
                                            'focus',
                                            ('spotNet_' + i).toString(),
                                            asset.spotNet !== 0
                                              ? asset.spotNet
                                              : ''
                                          )
                                        : null
                                    }
                                    onChange={(e) =>
                                      updateInterimValue(
                                        asset.symbolName,
                                        'spotNet',
                                        'change',
                                        ('spotNet_' + i).toString(),
                                        e.target.value
                                      )
                                    }
                                    onBlur={(e) =>
                                      updateInterimValue(
                                        asset.symbolName,
                                        'spotNet',
                                        'blur',
                                        ('spotNet_' + i).toString(),
                                        e.target.value
                                      )
                                    }
                                    placeholder={'0.0'}
                                    value={
                                      interimValue.has(
                                        ('spotNet_' + i).toString()
                                      )
                                        ? interimValue.get(
                                            ('spotNet_' + i).toString()
                                          )
                                        : asset.spotNet !== 0
                                        ? asset.spotNet
                                        : ''
                                    }
                                    disabled={
                                      asset.hasMarketSpot ||
                                      asset.symbolName === 'USDC'
                                        ? false
                                        : true
                                    }
                                  />
                                </Td>
                                <Td
                                  className={`px-1 lg:px-3 py-2 text-sm text-th-fgd-1`}
                                >
                                  <Input
                                    id={'perpBasePosition_' + i}
                                    type="number"
                                    onFocus={(e) =>
                                      e.target.id === e.currentTarget.id
                                        ? updateInterimValue(
                                            asset.symbolName,
                                            'perpBasePosition',
                                            'focus',
                                            (
                                              'perpBasePosition_' + i
                                            ).toString(),
                                            asset.spotNet !== 0
                                              ? asset.spotNet
                                              : ''
                                          )
                                        : null
                                    }
                                    onChange={(e) =>
                                      updateInterimValue(
                                        asset.symbolName,
                                        'perpBasePosition',
                                        'change',
                                        ('perpBasePosition_' + i).toString(),
                                        e.target.value
                                      )
                                    }
                                    onBlur={(e) =>
                                      updateInterimValue(
                                        asset.symbolName,
                                        'perpBasePosition',
                                        'blur',
                                        ('perpBasePosition_' + i).toString(),
                                        e.target.value
                                      )
                                    }
                                    placeholder={'0.0'}
                                    value={
                                      interimValue.has(
                                        ('perpBasePosition_' + i).toString()
                                      )
                                        ? interimValue.get(
                                            ('perpBasePosition_' + i).toString()
                                          )
                                        : asset.perpBasePosition !== 0
                                        ? asset.perpBasePosition
                                        : ''
                                    }
                                    disabled={
                                      asset.hasMarketPerp ? false : true
                                    }
                                  />
                                </Td>
                                <Td
                                  className={`px-1 lg:px-3 py-2 text-sm text-th-fgd-1`}
                                >
                                  <Input
                                    id={'perpAvgEntryPrice_' + i}
                                    type="number"
                                    onFocus={(e) =>
                                      e.target.id === e.currentTarget.id
                                        ? updateInterimValue(
                                            asset.symbolName,
                                            'perpAvgEntryPrice',
                                            'focus',
                                            (
                                              'perpAvgEntryPrice_' + i
                                            ).toString(),
                                            asset.perpAvgEntryPrice !== 0
                                              ? asset.perpAvgEntryPrice
                                              : ''
                                          )
                                        : null
                                    }
                                    onChange={(e) =>
                                      updateInterimValue(
                                        asset.symbolName,
                                        'perpAvgEntryPrice',
                                        'change',
                                        ('perpAvgEntryPrice_' + i).toString(),
                                        e.target.value
                                      )
                                    }
                                    onBlur={(e) =>
                                      updateInterimValue(
                                        asset.symbolName,
                                        'perpAvgEntryPrice',
                                        'blur',
                                        ('perpAvgEntryPrice_' + i).toString(),
                                        e.target.value
                                      )
                                    }
                                    placeholder={'0.0'}
                                    value={
                                      interimValue.has(
                                        ('perpAvgEntryPrice_' + i).toString()
                                      )
                                        ? interimValue.get(
                                            (
                                              'perpAvgEntryPrice_' + i
                                            ).toString()
                                          )
                                        : asset.perpAvgEntryPrice !== 0
                                        ? asset.perpAvgEntryPrice
                                        : ''
                                    }
                                    disabled={
                                      asset.hasMarketPerp ? false : true
                                    }
                                  />
                                </Td>
                                <Td
                                  className={`px-1 lg:px-3 py-2 whitespace-nowrap text-sm text-th-fgd-1`}
                                >
                                  <Input
                                    id={'price_' + i}
                                    type="number"
                                    onFocus={(e) =>
                                      e.target.id === e.currentTarget.id
                                        ? updateInterimValue(
                                            asset.symbolName,
                                            'price',
                                            'focus',
                                            ('price_' + i).toString(),
                                            asset.perpAvgEntryPrice !== 0
                                              ? asset.perpAvgEntryPrice
                                              : ''
                                          )
                                        : null
                                    }
                                    onChange={(e) => {
                                      updateInterimValue(
                                        asset.symbolName,
                                        'price',
                                        'change',
                                        ('price_' + i).toString(),
                                        e.target.value
                                      )
                                    }}
                                    onBlur={(e) =>
                                      updateInterimValue(
                                        asset.symbolName,
                                        'price',
                                        'blur',
                                        ('price_' + i).toString(),
                                        e.target.value
                                      )
                                    }
                                    placeholder={'0.0'}
                                    value={
                                      asset.priceDisabled
                                        ? interimValue.has(
                                            ('price_' + i).toString()
                                          )
                                          ? interimValue.get(
                                              ('price_' + i).toString()
                                            )
                                          : asset.price !== 0
                                          ? asset.price
                                          : ''
                                        : interimValue.has(
                                            ('price_' + i).toString()
                                          )
                                        ? interimValue.get(
                                            ('price_' + i).toString()
                                          )
                                        : asset.price !== 0
                                        ? asset.price * sliderPercentage
                                        : ''
                                    }
                                    disabled={asset.priceDisabled}
                                  />
                                </Td>
                                <Td
                                  className={`px-1 lg:px-3 py-2 whitespace-nowrap text-sm text-th-fgd-1`}
                                >
                                  <Input
                                    type="text"
                                    value={usdFormatter(
                                      Number(
                                        asset.spotNet *
                                          asset.price *
                                          (asset.priceDisabled
                                            ? 1
                                            : sliderPercentage)
                                      ) +
                                        Number(
                                          asset.perpPositionSide === 'long'
                                            ? asset.perpPositionPnL +
                                                asset.perpBasePosition *
                                                  (asset.price *
                                                    sliderPercentage -
                                                    asset.perpAvgEntryPrice)
                                            : asset.perpPositionPnL -
                                                asset.perpBasePosition *
                                                  (asset.perpAvgEntryPrice -
                                                    asset.price *
                                                      sliderPercentage)
                                        )
                                    )}
                                    onChange={null}
                                    disabled
                                  />
                                </Td>
                                <Td
                                  className={`px-1 lg:px-3 py-2 whitespace-nowrap text-sm text-th-fgd-1`}
                                >
                                  <Input
                                    type="text"
                                    value={usdFormatter(
                                      liquidationPrices.get(asset.symbolName)
                                    )}
                                    onChange={null}
                                    disabled
                                  />
                                </Td>
                              </Tr>
                            ) : null
                          )}
                        </Tbody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
              {/*Populate detailed scenario summary*/}
              {scenarioBars?.rowData.length > 0 ? (
                <div className="bg-th-bkg-3 col-span-4 hidden md:block p-4 relative rounded-r-lg">
                  <div className="pb-4 text-th-fgd-1 text-lg">
                    {t('calculator:scenario-details')}
                  </div>
                  {/* Joke Wrapper */}
                  <div className="relative col-span-4">
                    {scenarioDetails.get('liabilities') === 0 &&
                    scenarioDetails.get('equity') === 0 ? (
                      <div className="bg-th-green-dark border border-th-green-dark flex flex-col items-center mb-6 p-3 rounded text-center text-th-fgd-1">
                        <div className="pb-0.5 text-th-fgd-1">
                          {t('calculator:joke-get-party-started')}
                        </div>
                        <div className="text-th-fgd-1 text-xs">
                          {t('calculator:joke-mangoes-are-ripe')}
                        </div>
                      </div>
                    ) : null}
                    {scenarioDetails.get('liabilities') === 0 &&
                    scenarioDetails.get('equity') > 0 ? (
                      <div className="border border-th-green flex flex-col items-center mb-6 p-3 rounded text-center text-th-fgd-1">
                        <div className="pb-0.5 text-th-fgd-1">
                          {t('calculator:joke-zero-borrows-risk')}
                        </div>
                        <div className="text-th-fgd-3 text-xs">
                          {t('calculator:joke-live-a-little')}
                        </div>
                      </div>
                    ) : null}
                    {scenarioDetails.get('riskRanking') === riskRanks[0] &&
                    scenarioDetails.get('leverage') !== 0 ? (
                      <div className="border border-th-green flex flex-col items-center mb-6 p-3 rounded text-center text-th-fgd-1">
                        <div className="pb-0.5 text-th-fgd-1">
                          {t('calculator:joke-looking-good')}
                        </div>
                        <div className="text-th-fgd-3 text-xs">
                          {t('calculator:joke-sun-shining')}
                        </div>
                      </div>
                    ) : null}
                    {scenarioDetails.get('riskRanking') === riskRanks[1] ? (
                      <div className="border border-th-orange flex flex-col items-center mb-6 p-3 rounded text-center text-th-fgd-1">
                        <div className="pb-0.5 text-th-fgd-1">
                          {t('calculator:joke-liquidator-activity')}
                        </div>
                        <div className="text-th-fgd-3 text-xs">
                          {t('calculator:joke-rethink-positions')}
                        </div>
                      </div>
                    ) : null}
                    {scenarioDetails.get('riskRanking') === riskRanks[2] ? (
                      <div className="border border-th-red flex flex-col items-center mb-6 p-3 rounded text-center text-th-fgd-1">
                        <div className="pb-0.5 text-th-fgd-1">
                          {t('calculator:joke-liquidators-closing')}
                        </div>
                        <div className="text-th-fgd-3 text-xs">
                          {t('calculator:joke-hit-em-with')}
                        </div>
                      </div>
                    ) : null}
                    {scenarioDetails.get('riskRanking') === riskRanks[3] ? (
                      <div className="border border-th-red flex flex-col items-center mb-6 p-3 rounded text-center text-th-fgd-1">
                        <div className="pb-0.5 text-th-fgd-1">
                          {t('calculator:joke-liquidators-spotted-you')}
                        </div>
                        <div className="text-th-fgd-3 text-xs">
                          {t('calculator:joke-throw-some-money')}
                        </div>
                      </div>
                    ) : null}
                    {scenarioDetails.get('riskRanking') === riskRanks[4] ? (
                      <div className="bg-th-red border border-th-red flex flex-col items-center mb-6 p-3 rounded text-center text-th-fgd-1">
                        <div className="pb-0.5 text-th-fgd-1">
                          {t('calculator:joke-liquidated')}
                        </div>
                        <div className="text-th-fgd-1 text-xs">
                          {t('calculator:joke-insert-coin')}
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <Tooltip content={t('calculator:tooltip-maint-health')}>
                      <div className="text-th-fgd-3">
                        {t('calculator:maintenance-health')}
                      </div>
                    </Tooltip>
                    <div className="font-bold">
                      {scenarioDetails.get('maintHealth') * 100 >= 9999
                        ? '>10000'
                        : scenarioDetails.get('maintHealth') * 100 < 0
                        ? '<0'
                        : (scenarioDetails.get('maintHealth') * 100).toFixed(2)}
                      %
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <Tooltip content={t('calculator:tooltip-init-health')}>
                      <div className="text-th-fgd-3">
                        {t('calculator:initial-health')}
                      </div>
                    </Tooltip>
                    <div className="font-bold">
                      {scenarioDetails.get('initHealth') * 100 >= 9999
                        ? '>10000'
                        : scenarioDetails.get('initHealth') * 100 < 0
                        ? '<0'
                        : (scenarioDetails.get('initHealth') * 100).toFixed(2)}
                      %
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">
                      {t('calculator:new-positions-openable')}
                    </div>
                    <div
                      className={`font-bold ${
                        scenarioDetails.get('initHealth') * 100 >= 0
                          ? 'text-th-green'
                          : 'text-th-red'
                      }`}
                    >
                      {scenarioDetails.get('initHealth') * 100 >= 0
                        ? 'Yes'
                        : 'No'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3 mb-6">
                    <div className="text-th-fgd-3">{t('account-health')}</div>
                    {
                      <div
                        className={`font-bold ${
                          scenarioDetails.get('maintHealth') * 100 < 0
                            ? 'text-th-red'
                            : scenarioDetails.get('riskRanking') ===
                              riskRanks[3]
                            ? 'text-th-red'
                            : scenarioDetails.get('riskRanking') ===
                              riskRanks[2]
                            ? 'text-th-orange'
                            : scenarioDetails.get('riskRanking') ===
                              riskRanks[1]
                            ? 'text-th-primary'
                            : 'text-th-green'
                        }`}
                      >
                        {scenarioDetails.get('maintHealth') * 100 < 0
                          ? riskRanks[4]
                          : scenarioDetails.get('riskRanking')}
                      </div>
                    }
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">{t('account-value')}</div>
                    <div className="font-bold">
                      {formatUsdValue(scenarioDetails.get('equity'))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">{t('assets')}</div>
                    <div className="font-bold">
                      {formatUsdValue(scenarioDetails.get('assets'))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3 mb-6">
                    <div className="text-th-fgd-3">{t('liabilities')}</div>
                    <div className="font-bold">
                      {formatUsdValue(scenarioDetails.get('liabilities'))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">
                      {t('calculator:maint-weighted-assets')}
                    </div>
                    <div className="font-bold">
                      {formatUsdValue(scenarioDetails.get('maintWeightAssets'))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">
                      {t('calculator:maint-weighted-liabilities')}
                    </div>
                    <div className="font-bold">
                      {formatUsdValue(
                        scenarioDetails.get('maintWeightLiabilities')
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">
                      {t('calculator:init-weighted-assets')}
                    </div>
                    <div className="font-bold">
                      {formatUsdValue(scenarioDetails.get('initWeightAssets'))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3 mb-6">
                    <div className="text-th-fgd-3">
                      {t('calculator:init-weighted-assets')}
                    </div>
                    <div className="font-bold">
                      {formatUsdValue(
                        scenarioDetails.get('initWeightLiabilities')
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">{t('leverage')}</div>
                    <div className="font-bold">
                      {scenarioDetails.get('leverage').toFixed(2)}x
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">
                      {t('calculator:percent-move-liquidation')}
                    </div>
                    <div className="font-bold">
                      {scenarioDetails.get('percentToLiquidationAbsolute')}%
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="animate-pulse bg-th-bkg-3 h-64 rounded-lg w-full" />
        )}
      </PageBodyContainer>
    </div>
  )
}
