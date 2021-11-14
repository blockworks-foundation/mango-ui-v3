import { ChevronUpIcon, RefreshIcon } from '@heroicons/react/outline'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import { Disclosure } from '@headlessui/react'
import useMangoStore from '../stores/useMangoStore'
import PageBodyContainer from '../components/PageBodyContainer'
import TopBar from '../components/TopBar'
import Button, { LinkButton } from '../components/Button'
import Input from '../components/Input'
import { useState, useEffect } from 'react'
import Tooltip from '../components/Tooltip'
import { floorToDecimal, ceilToDecimal, tokenPrecision } from '../utils/index'
import { useBalances } from '../hooks/useBalances'
import usePerpPositions from '../hooks/usePerpPositions'
import { formatUsdValue } from '../utils'
import {
  getMarketIndexBySymbol,
  getTokenBySymbol,
  getAllMarkets,
} from '@blockworks-foundation/mango-client'
import Slider from 'rc-slider'
import 'rc-slider/assets/index.css'

interface AssetBar {
  assetName: string
  symbolName: string
  net: number
  deposit: number
  borrow: number
  price: number
  inOrders: number
  marketIndex: number
  publicKey: string
  initAssetWeight: number
  initLiabWeight: number
  maintAssetWeight: number
  maintLiabWeight: number
  precision: number
  priceDisabled: boolean
}

interface PerpsBar {
  perpsName: string
  symbolName: string
  basePosition: number
  avgEntryPrice: number
  price: number
  pnL: number
  positionSide: string
  inOrders: number
  marketIndex: number
  publicKey: string
  unsettledPnL: number
  unrealizedPnl: number
  initAssetWeight: number
  initLiabWeight: number
  maintAssetWeight: number
  maintLiabWeight: number
  precision: number
  priceDisabled: boolean
}

interface ScenarioDetailCalculator {
  balancesData: AssetBar[]
  perpsData: PerpsBar[]
}

export default function LiquidationCalculator() {
  //Get spot balances and perp positions
  const balances = useBalances()
  const { openPositions } = usePerpPositions()

  // Get mango account data
  const selectedMarginAccount =
    useMangoStore.getState().selectedMangoAccount.current
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const connected = useMangoStore((s) => s.wallet.connected)

  // Set default state variables
  const [calculatorBars, setCalculatorBars] =
    useState<ScenarioDetailCalculator>()
  const [sliderPercentage, setSliderPercentage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editing, toggleEditing] = useState(false)
  const [scenarioInitialized, setScenarioInitialized] = useState(false)

  // Should this be on a timer or be set to a manual reset once initial load is done?
  useEffect(() => {
    if (!scenarioInitialized) {
      if (balances.length > 0 && connected) {
        setLoading(true)
        setSliderPercentage(50)
        initilizeScenario()
        setScenarioInitialized(true)
      }
    }
  }, [connected, selectedMarginAccount, scenarioInitialized])

  // Retrieve the default scenario based on current account spot and perp market positions
  const initilizeScenario = () => {
    // Set spot bars
    const assetBarData = Object.entries(balances).map((asset) => {
      const m = asset[1]
      const marketIndex = getMarketIndexBySymbol(mangoConfig, m.symbol)
      const token = getTokenBySymbol(mangoConfig, m.symbol)
      const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)

      return {
        assetName: m.symbol,
        symbolName: m.symbol,
        net: floorToDecimal(
          Number(m.deposits) - Number(m.borrows) + Number(m.orders),
          token.decimals
        ),
        price:
          m.symbol === 'USDC'
            ? floorToDecimal(
                Number(mangoGroup.getPrice(tokenIndex, mangoCache)),
                4
              )
            : floorToDecimal(
                Number(mangoGroup.getPrice(marketIndex, mangoCache)),
                4
              ),
        deposit: floorToDecimal(Number(m.deposits), token.decimals),
        borrow: floorToDecimal(Number(m.borrows), token.decimals),
        inOrders: Number(m.orders),
        marketIndex: marketIndex,
        publicKey: m.key,
        initAssetWeight:
          m.symbol === 'USDC'
            ? 1
            : mangoGroup.spotMarkets[marketIndex].initAssetWeight.toNumber(),
        initLiabWeight:
          m.symbol === 'USDC'
            ? 1
            : mangoGroup.spotMarkets[marketIndex].initLiabWeight.toNumber(),
        maintAssetWeight:
          m.symbol === 'USDC'
            ? 1
            : mangoGroup.spotMarkets[marketIndex].maintAssetWeight.toNumber(),
        maintLiabWeight:
          m.symbol === 'USDC'
            ? 1
            : mangoGroup.spotMarkets[marketIndex].maintLiabWeight.toNumber(),
        precision: token.decimals ? token.decimals : 6,
        priceDisabled:
          m.symbol === 'USDC' || m.symbol === 'USDT' ? true : false,
      }
    })

    // Set perp bars
    const perpsBarData = mangoConfig.perpMarkets.map((m) => {
      const openPosition = openPositions.filter(
        (oP) => oP.marketConfig.baseSymbol === m.baseSymbol
      )

      return {
        perpsName: m.name,
        symbolName: m.baseSymbol,
        basePosition: openPosition[0]
          ? floorToDecimal(
              Number(openPosition[0].basePosition),
              tokenPrecision[m.baseSymbol] ? tokenPrecision[m.baseSymbol] : 6
            )
          : 0,
        avgEntryPrice: floorToDecimal(
          Number(mangoGroup.getPrice(m.marketIndex, mangoCache)),
          4
        ),
        price: floorToDecimal(
          Number(mangoGroup.getPrice(m.marketIndex, mangoCache)),
          4
        ),
        pnL: openPosition[0]
          ? floorToDecimal(Number(openPosition[0].unsettledPnl), 4)
          : 0,
        positionSide: openPosition[0]
          ? openPosition[0].basePosition < 0
            ? 'short'
            : 'long'
          : 'long',
        inOrders: 0,
        marketIndex: m.marketIndex,
        publicKey: m.publicKey.toString(),
        unsettledPnL: openPosition[0] ? openPosition[0].unsettledPnl : 0,
        unrealizedPnl: openPosition[0] ? openPosition[0].unrealizedPnl : 0,
        initAssetWeight:
          mangoGroup.perpMarkets[m.marketIndex].initAssetWeight.toNumber(),
        initLiabWeight:
          mangoGroup.perpMarkets[m.marketIndex].initLiabWeight.toNumber(),
        maintAssetWeight:
          mangoGroup.perpMarkets[m.marketIndex].maintAssetWeight.toNumber(),
        maintLiabWeight:
          mangoGroup.perpMarkets[m.marketIndex].maintLiabWeight.toNumber(),
        precision: m.baseDecimals > 0 ? m.baseDecimals : 6,
        priceDisabled: false,
      }
    })

    // Update Scenario Calculator
    const initScenarioData = updateScenario(assetBarData, perpsBarData)
    setCalculatorBars(initScenarioData)
    setLoading(false)
  }

  // Update the scenario details
  const updateScenario = (balancesData: AssetBar[], perpsData: PerpsBar[]) => {
    return {
      balancesData: balancesData,
      perpsData: perpsData,
    } as ScenarioDetailCalculator
  }

  // Update scenario values
  const updateScenarioValue = (name, type, field, val) => {
    if (!Number.isNaN(val)) {
      let updatedAssetData
      let updatedPerpData

      switch (type) {
        case 'spot':
          updatedAssetData = calculatorBars.balancesData.map((asset) => {
            if (asset.assetName == name) {
              if (field === 'net') {
                return {
                  ...asset,
                  [field]: val,
                  ['deposit']: val > 0 ? val : 0,
                  ['borrow']: val < 0 ? val : 0,
                }
              } else {
                return { ...asset, [field]: val }
              }
            } else {
              return asset
            }
          })
          updatedPerpData = calculatorBars.perpsData
          break
        case 'perp':
          updatedPerpData = calculatorBars.perpsData.map((perp) => {
            if (perp.symbolName == name) {
              let updatedSide: string
              let updatedPnL: number
              switch (field) {
                case 'basePosition':
                  updatedSide = val < 0 ? 'short' : 'long'
                  updatedPnL =
                    (perp.price - perp.avgEntryPrice) * perp.basePosition
                  break
                case 'avgEntryPrice':
                  updatedSide = perp.positionSide
                  updatedPnL = (perp.price - val) * perp.basePosition
                  break
                case 'price':
                  updatedSide = perp.positionSide
                  updatedPnL =
                    perp.positionSide === 'long'
                      ? (perp.price - perp.avgEntryPrice) * perp.basePosition
                      : (perp.avgEntryPrice - perp.price) * perp.basePosition
                  break
              }
              return {
                ...perp,
                [field]: val,
                positionSide: updatedSide,
                pnL: updatedPnL,
              }
            } else {
              return perp
            }
          })
          updatedAssetData = calculatorBars.balancesData
          break
      }

      const updatedScenarioData = updateScenario(
        updatedAssetData,
        updatedPerpData
      )
      setCalculatorBars(updatedScenarioData)
    }
  }

  // Update price details
  const updatePriceValues = (name, price) => {
    const updatedAssetData = calculatorBars.balancesData.map((asset) => {
      let val
      asset.assetName === name
        ? (val = price)
        : (val = asset.priceDisabled
            ? Math.abs(asset.price)
            : Math.abs(asset.price) * ((sliderPercentage * 2) / 100))
      return { ...asset, ['price']: Math.abs(val) }
    })
    const updatedPerpData = calculatorBars.perpsData.map((perp) => {
      let val = 0
      let updatedUnsettledPnL = 0
      if (perp.priceDisabled || perp.symbolName != name) {
        val = Math.abs(perp.price)
        updatedUnsettledPnL = perp.unsettledPnL
      } else {
        val = Math.abs(price)
        updatedUnsettledPnL = perp.unsettledPnL
      }
      return { ...perp, ['price']: val, ['unsettledPnL']: updatedUnsettledPnL }
    })

    // Update scenario details
    const updatedScenarioData = updateScenario(
      updatedAssetData,
      updatedPerpData
    )
    setCalculatorBars(updatedScenarioData)
  }

  // Reset column details
  const resetScenarioColumn = (type, column) => {
    let resetAssetData
    let resetPerpData

    switch (type) {
      case 'spot':
        resetAssetData = calculatorBars.balancesData.map((asset) => {
          let resetValue: number
          let resetDeposit: number
          let resetBorrow: number

          const token = getTokenBySymbol(mangoConfig, asset.assetName)
          const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)

          switch (column) {
            case 'deposit':
              resetValue = connected
                ? selectedMarginAccount
                  ? floorToDecimal(
                      Number(
                        mangoAccount.getUiDeposit(
                          mangoCache.rootBankCache[tokenIndex],
                          mangoGroup,
                          tokenIndex
                        )
                      ),
                      tokenPrecision[asset.assetName]
                        ? tokenPrecision[asset.assetName]
                        : 6
                    )
                  : 0
                : 0
              break
            case 'borrow':
              resetValue = connected
                ? selectedMarginAccount
                  ? floorToDecimal(
                      Number(
                        mangoAccount.getUiBorrow(
                          mangoCache.rootBankCache[tokenIndex],
                          mangoGroup,
                          tokenIndex
                        )
                      ),
                      tokenPrecision[asset.assetName]
                        ? tokenPrecision[asset.assetName]
                        : 6
                    )
                  : 0
                : 0
              break
            case 'net':
              resetValue = connected
                ? selectedMarginAccount
                  ? floorToDecimal(
                      Number(
                        mangoAccount.getUiDeposit(
                          mangoCache.rootBankCache[tokenIndex],
                          mangoGroup,
                          tokenIndex
                        )
                      ) -
                        Number(
                          mangoAccount.getUiBorrow(
                            mangoCache.rootBankCache[tokenIndex],
                            mangoGroup,
                            tokenIndex
                          )
                        ),
                      tokenPrecision[asset.assetName]
                        ? tokenPrecision[asset.assetName]
                        : 6
                    )
                  : 0
                : 0
              break
            case 'price':
              setSliderPercentage(50)
              resetValue = Number(mangoGroup.getPrice(tokenIndex, mangoCache))
              break
          }

          if (column === 'net') {
            resetDeposit = connected
              ? selectedMarginAccount
                ? floorToDecimal(
                    Number(
                      mangoAccount.getUiDeposit(
                        mangoCache.rootBankCache[tokenIndex],
                        mangoGroup,
                        tokenIndex
                      )
                    ),
                    tokenPrecision[asset.assetName]
                      ? tokenPrecision[asset.assetName]
                      : 6
                  )
                : 0
              : 0
            resetBorrow = connected
              ? selectedMarginAccount
                ? floorToDecimal(
                    Number(
                      mangoAccount.getUiBorrow(
                        mangoCache.rootBankCache[tokenIndex],
                        mangoGroup,
                        tokenIndex
                      )
                    ),
                    tokenPrecision[asset.assetName]
                      ? tokenPrecision[asset.assetName]
                      : 6
                  )
                : 0
              : 0

            return {
              ...asset,
              [column]: resetValue,
              ['deposit']: resetDeposit,
              ['borrow']: resetBorrow,
            }
          } else {
            return { ...asset, [column]: resetValue }
          }
        })
        resetPerpData = calculatorBars.perpsData
        break
      case 'perp':
        resetPerpData = calculatorBars.perpsData.map((perp) => {
          let resetValue: number

          const openPosition = openPositions.filter(
            (oP) => oP.marketConfig.baseSymbol === perp.symbolName
          )

          switch (column) {
            case 'basePosition':
              resetValue = connected
                ? selectedMarginAccount
                  ? floorToDecimal(
                      Number(
                        openPosition[0] ? openPosition[0].basePosition : 0
                      ),
                      tokenPrecision[perp.symbolName]
                        ? tokenPrecision[perp.symbolName]
                        : 6
                    )
                  : 0
                : 0
              break
            case 'price':
              setSliderPercentage(50)
              resetValue = Number(
                mangoGroup.getPrice(perp.marketIndex, mangoCache)
              )
              break
            case 'avgEntryPrice':
              setSliderPercentage(50)
              resetValue = Number(
                mangoGroup.getPrice(perp.marketIndex, mangoCache)
              )
              break
            case 'unsettledPnL':
              resetValue = Number(0)
          }
          return { ...perp, [column]: resetValue }
        })
        resetAssetData = calculatorBars.balancesData
        break
    }

    const updatedScenarioData = updateScenario(resetAssetData, resetPerpData)
    setCalculatorBars(updatedScenarioData)
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
    let percentToLiquidation: any
    let posPercentToLiquidation: any

    // Spot Assets and Liabilities variables
    let quote = 0
    let spotAssets = 0
    let spotLiabilities = 0

    // Perps Assets and Liabilities variables
    let perpsAssets = 0
    let perpsLiabilities = 0

    // Detailed health scenario variables
    let weightedAssets = 0
    let weightedLiabilities = 0
    let equity = 0
    let leverage = 0
    let initHealth = 0
    let maintHealth = 0
    let riskRanking = 'Not Set'

    // Calculate health scenario
    if (calculatorBars && balances.length > 0) {
      // Calculate spot assets and liabilities
      calculatorBars.balancesData.map((asset) => {
        if (asset.assetName === 'USDC' && asset.net > 0) {
          quote += asset.net
        } else if (asset.assetName === 'USDC' && asset.net < 0) {
          quote -= Math.abs(asset.net)
        }

        spotAssets +=
          asset.net > 0
            ? asset.net * ((asset.price * sliderPercentage * 2) / 100)
            : 0
        spotLiabilities +=
          asset.net < 0
            ? Math.abs(asset.net) * ((asset.price * sliderPercentage * 2) / 100)
            : 0
      })

      // Calculate perp assets, liabilities, and unsettled PnL
      calculatorBars.perpsData.map((perp) => {
        quote -= perp.basePosition * ((perp.price * sliderPercentage * 2) / 100)

        // Calculate change to unsettledPnL where price changes occur
        let perpsUnsettledPnL = perp.unsettledPnL
        if (perp.positionSide === 'long') {
          perpsUnsettledPnL +=
            perp.basePosition *
            ((perp.price * sliderPercentage * 2) / 100 - perp.avgEntryPrice)
        } else {
          perpsUnsettledPnL -=
            perp.basePosition *
            (perp.avgEntryPrice - (perp.price * sliderPercentage * 2) / 100)
        }

        quote += perpsUnsettledPnL
        perpsAssets +=
          (perp.basePosition > 0
            ? perp.basePosition * ((perp.price * sliderPercentage * 2) / 100)
            : 0) +
          (perp.positionSide === 'short' && perp.unsettledPnL > 0
            ? perp.unsettledPnL
            : 0)
        perpsLiabilities +=
          Math.abs(
            perp.basePosition * ((perp.price * sliderPercentage * 2) / 100)
          ) -
          (perp.positionSide === 'long' && perp.unsettledPnL > 0
            ? perp.unsettledPnL
            : 0)
      })

      // Basic Scenario Overview
      assets = spotAssets + perpsAssets + (quote > 0 ? quote : 0)

      liabilities = spotLiabilities + perpsLiabilities
      equity = assets - liabilities
      if (equity > 0 && liabilities != 0) {
        leverage = Math.abs(liabilities / equity)
      }

      // Detailed Health Scenario
      if (quote >= 0) {
        weightedAssets += quote
      } else {
        weightedLiabilities += Math.abs(quote)
      }

      initAssets = weightedAssets
      maintAssets = weightedAssets
      initLiabilities = weightedLiabilities
      maintLiabilities = weightedLiabilities

      // Add spot market assets and liabilities with asset weighting
      calculatorBars.balancesData.map((spot) => {
        if (spot.assetName != 'USDC') {
          if (spot.net > 0) {
            initAssets +=
              spot.net *
              ((spot.price * sliderPercentage * 2) / 100) *
              spot.initAssetWeight
            maintAssets +=
              spot.net *
              ((spot.price * sliderPercentage * 2) / 100) *
              spot.maintAssetWeight
          }
          if (spot.net < 0) {
            initLiabilities +=
              Math.abs(spot.net) *
              ((spot.price * sliderPercentage * 2) / 100) *
              spot.initLiabWeight
            maintLiabilities +=
              Math.abs(spot.net) *
              ((spot.price * sliderPercentage * 2) / 100) *
              spot.maintLiabWeight
          }
        }
      })

      // Add perp market assets and liabilities with asset weighting
      calculatorBars.perpsData.map((perp) => {
        if (perp.basePosition > 0) {
          initAssets +=
            perp.basePosition *
            ((perp.price * sliderPercentage * 2) / 100) *
            perp.initAssetWeight
          maintAssets +=
            perp.basePosition *
            ((perp.price * sliderPercentage * 2) / 100) *
            perp.maintAssetWeight
        } else {
          initLiabilities +=
            Math.abs(perp.basePosition) *
            ((perp.price * sliderPercentage * 2) / 100) *
            perp.initLiabWeight
          maintLiabilities +=
            Math.abs(perp.basePosition) *
            ((perp.price * sliderPercentage * 2) / 100) *
            perp.maintLiabWeight
        }
      })

      // Calculate health ratios and risk ranking
      initHealth = initAssets / initLiabilities - 1
      maintHealth = maintAssets / maintLiabilities - 1
      riskRanking =
        maintHealth > 0.4
          ? 'Great'
          : maintHealth > 0.3
          ? 'OK'
          : initHealth > 0
          ? 'Poor'
          : maintHealth > 0
          ? 'Very Poor'
          : 'Rekt'

      // Goal seek the percent price move required to liquidate the current account
      percentToLiquidation =
        getPriceMoveToLiquidation(quote, 0, 100) == 404
          ? '>99'
          : getPriceMoveToLiquidation(quote, 0, 100) -
            (sliderPercentage * 2 - 100)
      posPercentToLiquidation =
        getPriceMoveToLiquidation(quote, 100, 200) == 404
          ? '>99'
          : getPriceMoveToLiquidation(quote, 100, 200) -
            (sliderPercentage * 2 - 100)
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
      percentToLiquidation == '>99'
        ? '>99'
        : percentToLiquidation >= 0
        ? 0
        : Math.abs(percentToLiquidation)
    )
    scenarioHashMap.set(
      'posPercentToLiquidation',
      posPercentToLiquidation == '>99'
        ? '>99'
        : posPercentToLiquidation <= 0
        ? 0
        : Math.abs(posPercentToLiquidation)
    )

    return scenarioHashMap
  }

  // Function to goal seek the required percentage price change for maintenance health to fall below 0
  function getPriceMoveToLiquidation(quote, boundLower, boundUpper) {
    let priceMoveRequired = boundUpper
    let endLoop = false
    let i = 0
    let iterations = 0
    let weightedAssets = 0
    let weightedLiabilities = 0
    let lowerBound = boundLower
    let upperBound = boundUpper
    while (endLoop === false) {
      // Set loop's priceMove test
      i = Math.round(lowerBound + (upperBound - lowerBound) / 2)

      // Add initial quote to assets or liabilities
      if (quote >= 0) {
        weightedAssets = quote
      } else {
        weightedLiabilities = Math.abs(quote)
      }
      let maintAssets = weightedAssets
      let maintLiabilities = weightedLiabilities

      // Calculate spot market assets and liabilities with asset weighting
      calculatorBars.balancesData.map((spot) => {
        if (spot.assetName != 'USDC') {
          if (spot.net > 0) {
            maintAssets +=
              spot.net *
              (spot.price * (spot.assetName === 'USDT' ? 1 : i / 100)) *
              spot.maintAssetWeight
          }
          if (spot.net < 0) {
            maintLiabilities +=
              Math.abs(spot.net) *
              (spot.price * (spot.assetName === 'USDT' ? 1 : i / 100)) *
              spot.maintLiabWeight
          }
        }
      })

      // Calculate perp market assets and liabilities with asset weighting
      calculatorBars.perpsData.map((perp) => {
        if (perp.basePosition > 0) {
          maintAssets +=
            perp.basePosition * ((perp.price * i) / 100) * perp.maintAssetWeight
        } else {
          maintLiabilities +=
            Math.abs(perp.basePosition) *
            ((perp.price * i) / 100) *
            perp.maintLiabWeight
        }
      })

      // Calculate heath ratio and set boundaries for the next loop
      const liquidationHealth = maintAssets / maintLiabilities - 1
      if (liquidationHealth > 0) {
        upperBound = upperBound <= 100 ? i : upperBound
        lowerBound = upperBound <= 100 ? lowerBound : i
      } else {
        upperBound = upperBound <= 100 ? upperBound : i
        lowerBound = upperBound <= 100 ? i : lowerBound
      }

      // When loop has reached it's logical conclusion, calculate priceMoveRequired and end loop
      // Or if a weird bug breaks maths as we know it, end loop after 9 iterations (Range of 100 = max 8 iterations required)
      iterations++
      if (lowerBound == upperBound || upperBound - lowerBound == 1) {
        priceMoveRequired =
          upperBound <= 100 ? lowerBound - 100 : upperBound - 100
        if (Math.abs(priceMoveRequired) == 100) {
          priceMoveRequired = 404
        }
        endLoop = true
      } else if (iterations > 9) {
        priceMoveRequired = 404
        endLoop = true
      }
    }

    return priceMoveRequired
  }

  function getLiquidationPrices() {
    const liquidationHashMap = new Map()
    if (calculatorBars) {
      const marketSymbols = []
      const allMarketConfigs = getAllMarkets(mangoConfig)
      allMarketConfigs.map((m) => {
        if (marketSymbols.indexOf(m.baseSymbol) === -1) {
          marketSymbols.push(m.baseSymbol)
        }
      })
      marketSymbols.push('USDC')

      marketSymbols.map((symbol) => {
        const max = 131072
        const discretion = 1000
        let liqPriceMod = max
        let upperBound = max
        let lowerBound = 0
        let iterations = 0
        let priceMod = 0
        let endLoop = false
        let reverse = false

        while (endLoop === false) {
          let quote = 0
          let maintAssets = 0
          let maintLiabilities = 0

          // Set loop price modification factor
          // If reverse = true, the priceMod will trend upward, if false (default) priceMod will trend downward
          priceMod = reverse
            ? ceilToDecimal(upperBound - (upperBound - lowerBound) / 2, 0)
            : floorToDecimal(lowerBound + (upperBound - lowerBound) / 2, 0)

          // Calculate quote
          calculatorBars.balancesData.map((asset) => {
            if (asset.assetName === 'USDC' && asset.net > 0) {
              quote += asset.net
            } else if (asset.assetName === 'USDC' && asset.net < 0) {
              quote -= Math.abs(asset.net)
            }
          })
          calculatorBars.perpsData.map((perp) => {
            quote -=
              perp.basePosition *
              (perp.price *
                ((sliderPercentage * 2) / 100) *
                (priceMod / discretion))

            let perpsUnsettledPnL = perp.unsettledPnL
            if (perp.positionSide === 'long') {
              perpsUnsettledPnL +=
                perp.basePosition *
                (perp.price *
                  ((sliderPercentage * 2) / 100) *
                  (priceMod / discretion) -
                  perp.avgEntryPrice)
            } else {
              perpsUnsettledPnL -=
                perp.basePosition *
                (perp.avgEntryPrice -
                  perp.price *
                    ((sliderPercentage * 2) / 100) *
                    (priceMod / discretion))
            }

            quote += perpsUnsettledPnL
          })

          // Set quote to assets or liabilities depending on value
          if (quote >= 0) {
            maintAssets = quote
          } else {
            maintLiabilities = Math.abs(quote)
          }

          // Calculate spot and perps assets and liabilities with weighting, modifying the price if it matches the symbol passed in
          calculatorBars.balancesData.map((spot) => {
            const sPrice =
              spot.price *
              (spot.priceDisabled ? 1 : (sliderPercentage * 2) / 100) *
              (spot.symbolName.toLowerCase() === symbol.toLowerCase()
                ? priceMod / discretion
                : 1)
            if (spot.assetName != 'USDC') {
              if (spot.net > 0) {
                maintAssets += spot.net * sPrice * spot.maintAssetWeight
              }
              if (spot.net < 0) {
                maintLiabilities +=
                  Math.abs(spot.net) * sPrice * spot.maintLiabWeight
              }
            }
          })
          calculatorBars.perpsData.map((perp) => {
            const pPrice =
              perp.price *
              ((sliderPercentage * 2) / 100) *
              (perp.symbolName.toLowerCase() === symbol.toLowerCase()
                ? priceMod / discretion
                : 1)
            if (perp.basePosition > 0) {
              maintAssets += perp.basePosition * pPrice * perp.maintAssetWeight
            } else {
              maintLiabilities +=
                Math.abs(perp.basePosition) * pPrice * perp.maintLiabWeight
            }
          })

          // Check liquidation health
          let liqHealth = maintAssets / maintLiabilities - 1

          // If health < 0 and the upper/lower boundary are within 1 step, a liquidation price is considered found
          // Else if iterations are exceeded, if a negative spot or perp balance is present, reverse the search
          // and see if a positive price move will liquidate the position
          if (Math.abs(upperBound - lowerBound) == 1 && liqHealth < 0) {
            liqPriceMod = priceMod / discretion
            if (liqPriceMod == (max - 1) / discretion && reverse == false) {
              reverse = true
              iterations = -1
              upperBound = max
              lowerBound = 0
              priceMod = 0
              liqHealth = 100
            } else {
              endLoop = true
            }
          } else if (iterations > 18) {
            liqPriceMod = 0
            endLoop = true
          }

          // If liquidation health is still above 0, reset the boundaries of the next test and iterate the iterator
          iterations++
          if (reverse == false) {
            if (liqHealth > 0) {
              upperBound = upperBound <= max ? priceMod : upperBound
              lowerBound = upperBound <= max ? lowerBound : priceMod
            } else {
              upperBound = upperBound <= max ? upperBound : priceMod
              lowerBound = upperBound <= max ? priceMod : lowerBound
            }
          } else {
            if (liqHealth > 0) {
              upperBound = upperBound <= max ? upperBound : priceMod
              lowerBound = upperBound <= max ? priceMod : lowerBound
            } else {
              upperBound = upperBound <= max ? priceMod : upperBound
              lowerBound = upperBound <= max ? lowerBound : priceMod
            }
          }
        }

        // Set liquidation price or null
        if (liqPriceMod == 0 || liqPriceMod == (max - 1) / discretion) {
          liquidationHashMap.set(symbol.toString(), '-')
        } else {
          const liqPrice = calculatorBars.balancesData.filter(
            (m) => m.symbolName.toLowerCase() === symbol.toLowerCase()
          )[0]?.publicKey
            ? calculatorBars.balancesData.filter(
                (m) => m.symbolName.toLowerCase() === symbol.toLowerCase()
              )[0]?.price *
              liqPriceMod *
              ((sliderPercentage * 2) / 100)
            : calculatorBars.perpsData.filter(
                (m) => m.symbolName.toLowerCase() === symbol.toLowerCase()
              )[0]?.price *
              liqPriceMod *
              ((sliderPercentage * 2) / 100)
          liquidationHashMap.set(symbol.toString(), liqPrice)
        }
      })
    }

    return liquidationHashMap
  }

  const scenarioDetails = getScenarioDetails()
  const liquidationPrices = getLiquidationPrices()

  // Retrieve scenario table row
  function getScenarioTableRow(asset, perp, i, liquidationPrice) {
    return (
      <Tr
        className={`${
          i % 2 === 0 ? `bg-th-bkg-3 md:bg-th-bkg-2` : `bg-th-bkg-2`
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
              src={`/assets/icons/${
                asset?.assetName
                  ? asset.symbolName.toLowerCase()
                  : perp.symbolName.toLowerCase()
              }.svg`}
              className={`mr-2.5`}
            />
            <div>{asset?.assetName ? asset.assetName : perp.symbolName}</div>
          </div>
        </Td>
        <Td className={`px-1 lg:px-3 py-2 text-sm text-th-fgd-1`}>
          {editing ? (
            <Input
              type="number"
              onFocus={() => {
                toggleEditing(true)
              }}
              onChange={(e) =>
                updateScenarioValue(
                  asset?.assetName,
                  'spot',
                  'net',
                  e.target.value
                )
              }
              value={asset?.net}
              onBlur={() => {
                toggleEditing(false)
              }}
              disabled={asset?.assetName ? false : true}
            />
          ) : (
            <Input
              type="number"
              onFocus={() => {
                toggleEditing(true)
              }}
              readyOnly={true}
              onChange={() => null}
              value={
                asset?.assetName
                  ? Number(asset?.net).toFixed(asset?.precision)
                  : 0
              }
              disabled={asset?.assetName ? false : true}
            />
          )}
        </Td>
        <Td className={`px-1 lg:px-3 py-2 text-sm text-th-fgd-1`}>
          {editing ? (
            <Input
              type="number"
              onFocus={() => {
                toggleEditing(true)
              }}
              onChange={(e) =>
                updateScenarioValue(
                  perp?.symbolName,
                  'perp',
                  'basePosition',
                  e.target.value
                )
              }
              value={perp?.publicKey ? perp?.basePosition : 0.0}
              onBlur={() => {
                toggleEditing(false)
              }}
              disabled={perp?.publicKey ? false : true}
            />
          ) : (
            <Input
              type="number"
              onFocus={() => {
                toggleEditing(true)
              }}
              readyOnly={true}
              onChange={() => null}
              value={
                perp?.publicKey
                  ? Number(perp?.basePosition).toFixed(perp?.precision)
                  : Number(0).toFixed(perp?.precision)
              }
              disabled={perp?.publicKey ? false : true}
            />
          )}
        </Td>
        <Td className={`px-1 lg:px-3 py-2 text-sm text-th-fgd-1`}>
          {editing ? (
            <Input
              type="number"
              onFocus={() => {
                toggleEditing(true)
              }}
              onChange={(e) =>
                updateScenarioValue(
                  perp?.symbolName,
                  'perp',
                  'avgEntryPrice',
                  e.target.value
                )
              }
              value={perp?.publicKey ? perp?.avgEntryPrice : 0.0}
              onBlur={() => {
                toggleEditing(false)
              }}
              disabled={perp?.publicKey ? false : true}
            />
          ) : (
            <Input
              type="number"
              onFocus={() => {
                toggleEditing(true)
              }}
              readyOnly={true}
              onChange={() => null}
              value={
                perp?.publicKey
                  ? Number(perp?.avgEntryPrice).toFixed(perp?.precision)
                  : Number(0).toFixed(perp?.precision)
              }
              disabled={perp?.publicKey ? false : true}
            />
          )}
        </Td>
        <Td
          className={`px-1 lg:px-3 py-2 whitespace-nowrap text-sm text-th-fgd-1`}
        >
          {editing ? (
            <Input
              type="number"
              onFocus={() => {
                toggleEditing(true)
              }}
              onChange={(e) => {
                updatePriceValues(
                  asset?.assetName ? asset?.assetName : perp.symbolName,
                  e.target.value
                )
                setSliderPercentage(50)
              }}
              value={
                asset?.assetName
                  ? asset?.priceDisabled
                    ? asset?.price || 0
                    : (asset?.price * sliderPercentage * 2) / 100
                  : (perp?.price * sliderPercentage * 2) / 100
              }
              onBlur={() => {
                toggleEditing(false)
              }}
              disabled={asset?.assetName ? asset?.priceDisabled : false}
            />
          ) : (
            <Input
              type="number"
              onFocus={() => {
                toggleEditing(true)
              }}
              readyOnly={true}
              onChange={() => null}
              value={
                asset?.assetName
                  ? asset?.priceDisabled
                    ? Number(asset?.price || 0).toFixed(4)
                    : Number(
                        (asset?.price * sliderPercentage * 2) / 100
                      ).toFixed(4)
                  : Number((perp?.price * sliderPercentage * 2) / 100).toFixed(
                      4
                    )
              }
              disabled={asset?.assetName ? asset?.priceDisabled : false}
            />
          )}
        </Td>
        <Td
          className={`px-1 lg:px-3 py-2 whitespace-nowrap text-sm text-th-fgd-1`}
        >
          <Input
            type="number"
            value={
              asset && perp
                ? asset?.net *
                    asset?.price *
                    (asset?.priceDisabled ? 1 : (sliderPercentage * 2) / 100) +
                  (perp?.positionSide == 'long'
                    ? perp?.unsettledPnL +
                      perp?.basePosition *
                        ((perp?.price * sliderPercentage * 2) / 100 -
                          perp?.avgEntryPrice)
                    : perp?.unsettledPnL -
                      perp?.basePosition *
                        (perp?.avgEntryPrice -
                          (perp?.price * sliderPercentage * 2) / 100))
                : asset && !perp
                ? asset?.net *
                  asset?.price *
                  (asset?.priceDisabled ? 1 : (sliderPercentage * 2) / 100)
                : perp?.positionSide == 'long'
                ? perp?.unsettledPnL +
                  perp?.basePosition *
                    ((perp?.price * sliderPercentage * 2) / 100 -
                      perp?.avgEntryPrice)
                : perp?.unsettledPnL -
                  perp?.basePosition *
                    (perp?.avgEntryPrice -
                      (perp?.price * sliderPercentage * 2) / 100)
            }
            onChange={null}
            disabled
          />
        </Td>
        <Td
          className={`px-1 lg:px-3 py-2 whitespace-nowrap text-sm text-th-fgd-1`}
        >
          <Input
            type="text"
            value={liquidationPrice}
            onChange={null}
            disabled
          />
        </Td>
      </Tr>
    )
  }

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col pt-8 pb-3 sm:pb-6 md:pt-10">
          <h1 className={`mb-2 text-th-fgd-1 text-2xl font-semibold`}>
            Risk Calculator
          </h1>
          <p className="mb-0">
            IN TESTING (Use at your own risk): Please report any bugs or
            comments in our #dev-ui discord channel.
          </p>
          {/* <p className="mb-0">
                            Stay healthy to keep the dream alive. We hear that one mango smoothie a day keeps the liquidators away!
                        </p> */}
        </div>
        {!loading &&
        calculatorBars &&
        balances.length > 0 &&
        calculatorBars.balancesData?.length > 0 &&
        calculatorBars.perpsData?.length > 0 ? (
          <div className="rounded-lg bg-th-bkg-2">
            <div className="grid grid-cols-12">
              <div className="col-span-12 md:col-span-8 p-4">
                <div className="flex justify-between pb-2 lg:pb-3 px-0 lg:px-3">
                  <div className="pb-4 lg:pb-0 text-th-fgd-1 text-lg">
                    Scenario Balances
                  </div>
                  <div className="flex justify-between lg:justify-start">
                    <Button
                      className={`text-xs flex items-center justify-center sm:ml-3 pt-0 pb-0 h-8 pl-3 pr-3 rounded`}
                      onClick={() => {
                        setSliderPercentage(50)
                        initilizeScenario()
                      }}
                    >
                      <div className="flex items-center">
                        <RefreshIcon className="h-5 w-5 mr-1.5" />
                        Reset
                      </div>
                    </Button>
                  </div>
                </div>
                <div className="bg-th-bkg-1 border border-th-fgd-4 flex items-center mb-6 lg:mx-3 px-3 h-8 rounded">
                  <div className="pr-5 text-th-fgd-3 text-xs whitespace-nowrap">
                    Edit All Prices
                  </div>
                  <div className="w-full">
                    <Slider
                      onChange={(e) => {
                        onChangeSlider(e)
                      }}
                      step={0.5}
                      value={sliderPercentage}
                      defaultValue={50}
                      trackStyle={{ backgroundColor: '#F2C94C' }}
                      handleStyle={{
                        borderColor: '#F2C94C',
                        backgroundColor: '#f7f7f7',
                      }}
                      railStyle={{ backgroundColor: '#F2C94C' }}
                    />
                  </div>
                  <div className="pl-4 text-th-fgd-1 text-xs w-16">
                    {`${sliderPercentage * 2 - 100}%`}
                  </div>
                  <div className="pl-4 text-th-fgd-1 text-xs w-16">
                    <LinkButton onClick={() => setSliderPercentage(50)}>
                      Reset
                    </LinkButton>
                  </div>
                </div>
                {/*Balances (Spot Markets) */}
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
                              Asset
                            </Th>
                            <Th
                              scope="col"
                              className={`px-1 lg:px-3 py-1 text-left font-normal`}
                            >
                              <div className="flex justify-start md:justify-between">
                                <div className="pr-2">Spot</div>
                                <LinkButton
                                  onClick={() =>
                                    resetScenarioColumn('spot', 'net')
                                  }
                                >
                                  Reset
                                </LinkButton>
                              </div>
                            </Th>
                            <Th
                              scope="col"
                              className={`px-1 lg:px-3 py-1 text-left font-normal`}
                            >
                              <div className="flex justify-start md:justify-between">
                                <div className="pr-2">Perp</div>
                                <LinkButton
                                  onClick={() =>
                                    resetScenarioColumn('perp', 'basePosition')
                                  }
                                >
                                  Reset
                                </LinkButton>
                              </div>
                            </Th>
                            <Th
                              scope="col"
                              className={`px-1 lg:px-3 py-1 text-left font-normal`}
                            >
                              <div className="flex justify-start md:justify-between">
                                <div className="pr-2">Perp Entry</div>
                                <LinkButton
                                  onClick={() =>
                                    resetScenarioColumn('perp', 'avgEntryPrice')
                                  }
                                >
                                  Reset
                                </LinkButton>
                              </div>
                            </Th>
                            <Th
                              scope="col"
                              className={`px-1 lg:px-3 py-1 font-normal`}
                            >
                              <div className="flex justify-start md:justify-between">
                                <div className="pr-2">Price</div>
                                <LinkButton
                                  onClick={() =>
                                    resetScenarioColumn('spot', 'price')
                                  }
                                >
                                  Reset
                                </LinkButton>
                              </div>
                            </Th>
                            <Th
                              scope="col"
                              className={`px-1 lg:px-3 py-1 text-left font-normal`}
                            >
                              <div className="flex justify-start md:justify-between">
                                <Tooltip content="Spot Value + Perp Balance">
                                  <div className="pr-2">Value</div>
                                </Tooltip>
                                {/* <Tooltip content="Zero out unsettled Perp PnL from the scenario">
                                                                    <LinkButton
                                                                        onClick={() => resetScenarioColumn('perp', 'unsettledPnL')}
                                                                    >
                                                                        Zero Out
                                                                    </LinkButton>
                                                                </Tooltip> */}
                              </div>
                            </Th>
                            <Th
                              scope="col"
                              className={`px-1 lg:px-3 py-1 text-left font-normal`}
                            >
                              <div className="flex justify-start md:justify-between">
                                <Tooltip content="Single asset liquidation price (within 0.1%) assuming all other asset prices remain constant if liquidation is within 100x of scenario price">
                                  <div className="pr-2">Liq. Price</div>
                                </Tooltip>
                              </div>
                            </Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {/* Display spot markets with perps */}
                          {calculatorBars.balancesData.map((asset, i) =>
                            calculatorBars.perpsData.filter(
                              (m) => m.symbolName === asset.assetName
                            )[0]?.publicKey
                              ? getScenarioTableRow(
                                  asset,
                                  calculatorBars.perpsData.filter(
                                    (m) => m.symbolName === asset.assetName
                                  )[0],
                                  i,
                                  liquidationPrices.get(asset.assetName)
                                )
                              : null
                          )}
                          {/* Display spot markets without perps */}
                          {calculatorBars.balancesData.map((asset, i) =>
                            !calculatorBars.perpsData.filter(
                              (m) => m.symbolName === asset.assetName
                            )[0]?.publicKey
                              ? getScenarioTableRow(
                                  asset,
                                  null,
                                  i,
                                  liquidationPrices.get(asset.assetName)
                                )
                              : null
                          )}
                          {/* Display perp markets without spot */}
                          {calculatorBars.perpsData.map((perp, i) =>
                            !calculatorBars.balancesData.filter(
                              (m) => m.symbolName === perp.symbolName
                            )[0]?.publicKey
                              ? getScenarioTableRow(
                                  null,
                                  perp,
                                  calculatorBars.balancesData?.length - 1 + i,
                                  liquidationPrices.get(perp.symbolName)
                                )
                              : null
                          )}
                        </Tbody>
                      </Table>
                    </div>
                  </div>
                </div>
              </div>
              {!loading && calculatorBars && balances.length > 0 ? (
                <div className="bg-th-bkg-3 col-span-4 hidden md:block p-4 relative rounded-r-lg">
                  <div className="pb-4 text-th-fgd-1 text-lg">
                    Scenario Details
                  </div>
                  <div className="absolute bottom-0 mt-4 w-full">
                    {scenarioDetails.get('liabilities') === 0 &&
                    scenarioDetails.get('equity') > 0 ? (
                      <div className="border border-th-green flex flex-col items-center mb-6 p-3 rounded text-center text-th-fgd-1">
                        <div className="pb-0.5 text-th-fgd-1">
                          0 Borrows = 0 Risk
                        </div>
                        <div className="text-th-fgd-3 text-xs">
                          Come on, live a little...
                        </div>
                      </div>
                    ) : null}
                    {scenarioDetails.get('riskRanking') === 'Great' &&
                    scenarioDetails.get('leverage') !== 0 ? (
                      <div className="border border-th-green flex flex-col items-center mb-6 p-3 rounded text-center text-th-fgd-1">
                        <div className="pb-0.5 text-th-fgd-1">Looking good</div>
                        <div className="text-th-fgd-3 text-xs">
                          The sun is shining and the mangoes are ripe, yeah
                        </div>
                      </div>
                    ) : null}
                    {scenarioDetails.get('riskRanking') === 'OK' ? (
                      <div className="border border-th-orange flex flex-col items-center mb-6 p-3 rounded text-center text-th-fgd-1">
                        <div className="pb-0.5 text-th-fgd-1">
                          Liquidator activity is increasing
                        </div>
                        <div className="text-th-fgd-3 text-xs">
                          It might be time to re-think your positions
                        </div>
                      </div>
                    ) : null}
                    {scenarioDetails.get('riskRanking') === 'Poor' ? (
                      <div className="border border-th-red flex flex-col items-center mb-6 p-3 rounded text-center text-th-fgd-1">
                        <div className="pb-0.5 text-th-fgd-1">
                          Liquidators are closing in
                        </div>
                        <div className="text-th-fgd-3 text-xs">
                          Hit &apos;em with everything you&apos;ve got...
                        </div>
                      </div>
                    ) : null}
                    {scenarioDetails.get('riskRanking') === 'Very Poor' ? (
                      <div className="border border-th-red flex flex-col items-center mb-6 p-3 rounded text-center text-th-fgd-1">
                        <div className="pb-0.5 text-th-fgd-1">
                          Liquidators have spotted you
                        </div>
                        <div className="text-th-fgd-3 text-xs">
                          Throw some money at them to make them go away...
                        </div>
                      </div>
                    ) : null}
                    {scenarioDetails.get('riskRanking') === 'Rekt' ? (
                      <div className="bg-th-red border border-th-red flex flex-col items-center mb-6 p-3 rounded text-center text-th-fgd-1">
                        <div className="pb-0.5 text-th-fgd-1">Liquidated!</div>
                        <div className="text-th-fgd-1 text-xs">
                          Insert coin to continue...
                        </div>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <Tooltip content="Maintenance health must be above 0% to avoid liquidation.">
                      <div className="text-th-fgd-3">Maintenance Health</div>
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
                    <Tooltip content="Initial health must be above 0% to open new positions.">
                      <div className="text-th-fgd-3">Initial Health</div>
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
                      New Positions Can Be Opened
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
                    <div className="text-th-fgd-3">Account Health</div>
                    {
                      <div
                        className={`font-bold ${
                          scenarioDetails.get('maintHealth') * 100 < 0
                            ? 'text-th-red'
                            : scenarioDetails.get('riskRanking') === 'Very Poor'
                            ? 'text-th-red'
                            : scenarioDetails.get('riskRanking') === 'Poor'
                            ? 'text-th-orange'
                            : scenarioDetails.get('riskRanking') === 'OK'
                            ? 'text-th-primary'
                            : 'text-th-green'
                        }`}
                      >
                        {scenarioDetails.get('maintHealth') * 100 < 0
                          ? 'Rekt'
                          : scenarioDetails.get('riskRanking')}
                      </div>
                    }
                  </div>
                  <div className="h-8" />
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">Account Value</div>
                    <div className="font-bold">
                      {formatUsdValue(scenarioDetails.get('equity'))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">Assets</div>
                    <div className="font-bold">
                      {formatUsdValue(scenarioDetails.get('assets'))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">Liabilities</div>
                    <div className="font-bold">
                      {formatUsdValue(scenarioDetails.get('liabilities'))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">
                      Maint. Weighted Assets Value
                    </div>
                    <div className="font-bold">
                      {formatUsdValue(scenarioDetails.get('maintWeightAssets'))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">
                      Maint. Weighted Liabilities Value
                    </div>
                    <div className="font-bold">
                      {formatUsdValue(
                        scenarioDetails.get('maintWeightLiabilities')
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">
                      Init. Weighted Assets Value
                    </div>
                    <div className="font-bold">
                      {formatUsdValue(scenarioDetails.get('initWeightAssets'))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">
                      Init. Weighted Liabilities Value
                    </div>
                    <div className="font-bold">
                      {formatUsdValue(
                        scenarioDetails.get('initWeightLiabilities')
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">Leverage</div>
                    <div className="font-bold">
                      {scenarioDetails.get('leverage').toFixed(2)}x
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">
                      Negative Price Move To Liquidation
                    </div>
                    <div className="font-bold">
                      {scenarioDetails.get('percentToLiquidation')}%
                    </div>
                  </div>
                  <div className="flex items-center justify-between pb-3">
                    <div className="text-th-fgd-3">
                      Positive Price Move To Liquidation
                    </div>
                    <div className="font-bold">
                      {scenarioDetails.get('posPercentToLiquidation')}%
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
      {!loading && calculatorBars && balances.length > 0 ? (
        <div className="bg-th-bkg-3 bottom-0 md:hidden sticky w-full">
          <Disclosure>
            {({ open }) => (
              <>
                <Disclosure.Button className="bg-th-bkg-3 default-transition flex items-center justify-between p-3 w-full hover:bg-th-bkg-1 focus:outline-none">
                  Scenario Details
                  <ChevronUpIcon
                    className={`default-transition h-4 text-th-fgd-1 w-4 ${
                      open ? 'transform rotate-180' : 'transform rotate-360'
                    }`}
                  />
                </Disclosure.Button>
                <Disclosure.Panel className="p-3">
                  <div className="text-th-fgd-1">
                    <div className="flex items-center justify-between pb-3">
                      <div className="text-th-fgd-3">Maintenance Health</div>
                      <div className="font-bold">
                        {scenarioDetails.get('maintHealth') * 100 >= 9999
                          ? '>10000'
                          : scenarioDetails.get('maintHealth') * 100 < 0
                          ? '<0'
                          : (scenarioDetails.get('maintHealth') * 100).toFixed(
                              2
                            )}
                        %
                      </div>
                    </div>
                    <div className="flex items-center justify-between pb-3">
                      <div className="text-th-fgd-3">Initial Health</div>
                      {scenarioDetails.get('initHealth') * 100 >= 9999
                        ? '>10000'
                        : scenarioDetails.get('initHealth') * 100 < 0
                        ? '<0'
                        : (scenarioDetails.get('initHealth') * 100).toFixed(2)}
                      %
                    </div>
                    <div className="flex items-center justify-between pb-3">
                      <div className="text-th-fgd-3">
                        New Positions Can Be Opened
                      </div>
                      <div className="font-bold">
                        {scenarioDetails.get('initHealth') * 100 >= 0
                          ? 'Yes'
                          : 'No'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pb-3">
                      <div className="text-th-fgd-3">Account Health</div>
                      <div className="font-bold">
                        {
                          <div
                            className={`font-bold ${
                              scenarioDetails.get('maintHealth') * 100 < 0
                                ? 'text-th-red'
                                : scenarioDetails.get('riskRanking') ===
                                  'Very Poor'
                                ? 'text-th-red'
                                : scenarioDetails.get('riskRanking') === 'Poor'
                                ? 'text-th-orange'
                                : scenarioDetails.get('riskRanking') === 'OK'
                                ? 'text-th-primary'
                                : 'text-th-green'
                            }`}
                          >
                            {scenarioDetails.get('maintHealth') * 100 < 0
                              ? 'Rekt'
                              : scenarioDetails.get('riskRanking')}
                          </div>
                        }
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between pb-3">
                        <div className="text-th-fgd-3">Account Value</div>
                        <div className="font-bold">
                          {formatUsdValue(scenarioDetails.get('equity'))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Disclosure.Panel>
              </>
            )}
          </Disclosure>
        </div>
      ) : null}
    </div>
  )
}
