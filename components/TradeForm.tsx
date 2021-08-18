import { useState, useEffect, useRef, useMemo } from 'react'
import styled from '@emotion/styled'
import useIpAddress from '../hooks/useIpAddress'
import {
  getTokenBySymbol,
  PerpMarket,
  I80F48,
  ZERO_I80F48,
  ONE_I80F48,
  nativeI80F48ToUi,
  QUOTE_INDEX,
  MangoAccount,
  getMarketIndexBySymbol
} from '@blockworks-foundation/mango-client'
import { useBalances } from '../hooks/useBalances'
import useSrmAccount from '../hooks/useSrmAccount'
import { notify } from '../utils/notifications'
import { calculateMarketPrice, getDecimalCount, sleep } from '../utils'
import FloatingElement from './FloatingElement'
import { floorToDecimal } from '../utils/index'
import useMangoStore, { mangoClient } from '../stores/useMangoStore'
import Button from './Button'
import TradeType from './TradeType'
import Input from './Input'
import Switch from './Switch'
import LeverageSlider from './LeverageSlider'
import { Market } from '@project-serum/serum'
import Big from 'big.js'
import { InformationCircleIcon } from '@heroicons/react/outline'
import Tooltip from './Tooltip'
import MarketFee from './MarketFee'

const StyledRightInput = styled(Input)`
  border-left: 1px solid transparent;
`

export default function TradeForm() {
  const set = useMangoStore((s) => s.set)
  const connected = useMangoStore((s) => s.wallet.connected)
  const actions = useMangoStore((s) => s.actions)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const market = useMangoStore((s) => s.selectedMarket.current)
  const { side, baseSize, quoteSize, price, tradeType } = useMangoStore(
    (s) => s.tradeForm
  )
  const balances = useBalances()
  const tokens = useMemo(() => groupConfig.tokens, [groupConfig])
  const token = useMemo(
    () => tokens.find((t) => t.symbol === marketConfig.baseSymbol),
    [marketConfig.baseSymbol, tokens]
  )

  let { ipAllowed } = useIpAddress()
  ipAllowed = true

  const [postOnly, setPostOnly] = useState(false)
  const [ioc, setIoc] = useState(false)
  const [leveragePct, setLeveragePct] = useState(0)
  const [maxLeveragePct, setMaxLeveragePct] = useState(100)
  const [leverageNotification, setLeverageNotification] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [maxAmount, setMaxAmount] = useState(ZERO_I80F48)
  // const [simulation, setSimulation] = useState(null)

  const orderBookRef = useRef(useMangoStore.getState().selectedMarket.orderBook)
  const orderbook = orderBookRef.current

  const { rates } = useSrmAccount()
  const marketIndex = getMarketIndexBySymbol(
    groupConfig,
    marketConfig.baseSymbol
  )
  let takerFee, makerFee
  if (market instanceof PerpMarket) {
    takerFee =
      parseFloat(mangoGroup.perpMarkets[marketIndex].takerFee.toFixed()) * 100
    makerFee =
      parseFloat(mangoGroup.perpMarkets[marketIndex].makerFee.toFixed()) * 100
  } else {
    takerFee = rates.taker * 100
    makerFee = rates.maker * 100
  }

  useEffect(
    () =>
      useMangoStore.subscribe(
        // @ts-ignore
        (orderBook) => (orderBookRef.current = orderBook),
        (state) => state.selectedMarket.orderBook
      ),
    []
  )

  const [tokenIndex, setTokenIndex] = useState(0)
  const [tokenBorrows, setTokenBorrows] = useState(ZERO_I80F48)
  const [tokenDeposits, setTokenDeposits] = useState(ZERO_I80F48)
  const [tokenPerpPosition, setTokenPerpPosition] = useState(ZERO_I80F48)
  const [usdcDeposits, setUSDCDeposits] = useState(ZERO_I80F48)
  useEffect(() => {
    if (!token || !mangoGroup || !mangoAccount || !mangoCache) return
    const {spot, perps, quote} = mangoAccount.
      getHealthComponents(
        mangoGroup,
        mangoCache
      )
    const spotUi= spot.map((x, index) => nativeI80F48ToUi(x, mangoGroup.tokens[index].decimals))
    const perpsUi= perps.map((x, index) => nativeI80F48ToUi(x, mangoGroup.tokens[index].decimals))
    const spotNums = spotUi.map((x) => x.toNumber()) //TODO remove
    const perpsNums = perpsUi.map((x) => x.toNumber()) //TODO remove
    setTokenIndex(mangoGroup.getTokenIndex(token.mintKey))
    setTokenBorrows(mangoAccount.getUiBorrow(
      mangoCache.rootBankCache[tokenIndex],
      mangoGroup,
      tokenIndex
    ))
    setTokenDeposits(mangoAccount.getUiDeposit(
      mangoCache.rootBankCache[tokenIndex],
      mangoGroup,
      tokenIndex
    ))
    setUSDCDeposits(mangoAccount.getUiDeposit(
      mangoCache.rootBankCache[QUOTE_INDEX],
      mangoGroup,
      QUOTE_INDEX
    ))
    setTokenPerpPosition(perps[tokenIndex])
  }, [mangoGroup, mangoAccount, mangoCache, token])

  const extendLeverageTradeCalc = () => {      
      let health = mangoAccount.getHealth(mangoGroup, mangoCache, 'Init')
      health = nativeI80F48ToUi(health, mangoGroup.tokens[QUOTE_INDEX].decimals)
      const healthNum = health.toNumber() //TODO remove
      // if (side === "buy") {// max borrow: inithealth / 1-assetweight
      let weight = ONE_I80F48
      if (market instanceof PerpMarket) {
        weight = mangoGroup.perpMarkets[tokenIndex].initAssetWeight
      } else {
        weight = mangoGroup.spotMarkets[tokenIndex].initAssetWeight
      }
      const maxTrade = health.div(
        ONE_I80F48.sub(weight)
      )
      //TODO will any asset ever have a weight of 1? will cause div by 0 error, infinite leverage}
        // } else {
        //   remainingLeverage = health.div(
        //     ONE_I80F48.sub(mangoGroup.spotMarkets[tokenIndex].initLiabWeight)
        //   ) 
        // }
      return maxTrade
  }
  const crossBookPerpsTradeCalc = () => {
    const {spot, perps: simPerps, quote} = mangoAccount.
      getHealthComponents(
        mangoGroup,
        mangoCache
      )
    simPerps[tokenIndex] = ZERO_I80F48
    // const simulation = new MangoAccount(null, mangoAccount)
    // // simulation.deposits = [...mangoAccount.deposits]
    // // simulation.borrows = [...mangoAccount.borrows]
    let simHealth = mangoAccount.getHealthFromComponents(mangoGroup, mangoCache, spot, simPerps, quote, 'Init')
    simHealth = nativeI80F48ToUi(
      simHealth,
      mangoGroup.tokens[QUOTE_INDEX].decimals
    )

    const simHealthNum = simHealth.toNumber() //TODO remove
    const simRemainingLeverage = simHealth.div( //current settings allow for 10x init leverage on perps?? is this intentional?
      ONE_I80F48.sub(mangoGroup.perpMarkets[tokenIndex].initAssetWeight)
    )
    const simRemainingLeverageNum = simRemainingLeverage.toNumber() //TODO remove
    // let maxTrade
    // if (side === 'buy') {
    //   // these bits I'm still not sure about
    //   maxTrade = simRemainingLeverage.add(
    //     usdcDeposits.isPos() ? usdcDeposits : ZERO_I80F48
    //   )
    // } else {
    //   maxTrade = simRemainingLeverage.add(
    //     tokenDeposits.isPos()
    //       ? tokenDeposits.mul(mangoGroup.getPrice(tokenIndex, mangoCache))
    //       : ZERO_I80F48
    //   )
    // }
    // return maxTrade
    return simRemainingLeverage
  }

  const crossBookSpotTradeCalc = () => { 
    let newTokenDeposit = ZERO_I80F48
    let newUSDCDeposit = ZERO_I80F48
    const tokenPrice = mangoGroup.getPrice(tokenIndex, mangoCache)
    const tokenPriceNum = tokenPrice.toNumber() //TODO remove
    if (side == 'sell') {
      newUSDCDeposit = tokenDeposits.mul(tokenPrice).add(usdcDeposits)
    } else {
      newTokenDeposit = usdcDeposits.div(tokenPrice).add(tokenDeposits)
    }
    const newTokenDepositsNum = newTokenDeposit.toNumber() //TODO remove
    const newUSDCDepositsNum = newUSDCDeposit.toNumber() //TODO remove
    // let newDeposit = tokenDeposits.sub(parsedInputAmount)
    // newDeposit = newDeposit.gt(ZERO_I80F48) ? newDeposit : ZERO_I80F48

    // let newBorrow = parsedInputAmount.sub(tokenDeposits)
    // newBorrow = newBorrow.gt(ZERO_I80F48) ? newBorrow : ZERO_I80F48
    // newBorrow = newBorrow.add(tokenBorrows)

    // clone MangoAccount and arrays to not modify selectedMangoAccount
    const simulation = new MangoAccount(null, mangoAccount)
    simulation.deposits = [...mangoAccount.deposits]
    simulation.borrows = [...mangoAccount.borrows]

    const tokenDecimals = mangoGroup.tokens[tokenIndex].decimals
    const usdcDecimals = mangoGroup.tokens[QUOTE_INDEX].decimals
    // update with simulated values
    simulation.deposits[tokenIndex] = newTokenDeposit
      .mul(I80F48.fromNumber(Math.pow(10, tokenDecimals)))
      .div(mangoCache.rootBankCache[tokenIndex].depositIndex)
    simulation.deposits[QUOTE_INDEX] = newUSDCDeposit
      .mul(I80F48.fromNumber(Math.pow(10, usdcDecimals)))
      .div(mangoCache.rootBankCache[QUOTE_INDEX].borrowIndex)

    const simTokDepNum = simulation.deposits[tokenIndex].toNumber() //TODO remove
    const simUSDCDepNum = simulation.deposits[QUOTE_INDEX].toNumber() //TODO remove
    // const liabsVal = simulation
    //   .getLiabsVal(mangoGroup, mangoCache, 'Init')
    //   .toNumber()
    const leverage = simulation.getLeverage(mangoGroup, mangoCache).toNumber()
    // const equity = simulation.computeValue(mangoGroup, mangoCache).toNumber()
    // const initHealthRatio = simulation
    //   .getHealthRatio(mangoGroup, mangoCache, 'Init')
    //   .toNumber()

    // setSimulation({
    //   initHealthRatio,
    //   liabsVal,
    //   leverage,
    //   equity,
    // })

    // let simHealth = simulation.getHealthFromComponents(mangoGroup, mangoCache, simSpot, simPerps, simQuote, 'Init')
    let simHealth = simulation.getHealth(mangoGroup, mangoCache, 'Init')
    simHealth = nativeI80F48ToUi(
      simHealth,
      mangoGroup.tokens[QUOTE_INDEX].decimals
    )

    const simHealthNum = simHealth.toNumber() //TODO remove
    const simRemainingLeverage = simHealth.div(
      ONE_I80F48.sub(mangoGroup.spotMarkets[tokenIndex].initAssetWeight)
    )
    // max borrow: inithealth / 1-assetweight
    const simRemainingLeverageNum = simRemainingLeverage.toNumber() //TODO remove
    let maxTrade
    if (side === 'buy') {
      // these bits I'm still not sure about
      maxTrade = simRemainingLeverage.add(
        usdcDeposits.isPos() ? usdcDeposits : ZERO_I80F48
      )
    } else {
      maxTrade = simRemainingLeverage.add(
        tokenDeposits.isPos()
          ? tokenDeposits.mul(mangoGroup.getPrice(tokenIndex, mangoCache))
          : ZERO_I80F48
      )
    }
    return maxTrade
  }
  useEffect(() => {
    // GET MAX MARGIN VAL
    if (!connected || !mangoGroup || !mangoAccount || !market) return

    const tokenBorrowsNum = tokenBorrows.toNumber() //TODO remove
    const tokenDepositsNum = tokenDeposits.toNumber() //TODO remove
    const usdcDepositsNum = usdcDeposits.toNumber() //TODO remove

    let maxLeverageAmount: I80F48
    // if has net borrows and selling OR has net deposits and buying, use remainingLeverage below as max trade
    // else simulate closing current position, then calculate remaining leverage and add new token or usdc deposits to get max trade
    if (market instanceof PerpMarket) {
      if (
        (side == 'sell' && tokenPerpPosition.lte(ZERO_I80F48)) ||
        (side == 'buy' && tokenPerpPosition.gte(ZERO_I80F48))
      ) {
        maxLeverageAmount = extendLeverageTradeCalc()
      } else {
        maxLeverageAmount = crossBookPerpsTradeCalc()
      }
    } else { 
      if (
        (side == 'sell' && tokenBorrows.gte(tokenDeposits)) ||
        (side == 'buy' && tokenDeposits.gte(tokenBorrows))
      ) {
        maxLeverageAmount = extendLeverageTradeCalc()
      } else {
        maxLeverageAmount = crossBookSpotTradeCalc()
      }
    }

    const maxLeverageAmountNum = maxLeverageAmount.toNumber() // TODO remove
    if (maxLeverageAmount.gt(ZERO_I80F48)) {
      setMaxAmount(maxLeverageAmount)
      setLeverageNotification('')
      debugger // TODO remove
    } else {
      setMaxAmount(ZERO_I80F48)
      setLeverageNotification(
        `Leverage limit exceeded.
        Please reduce account leverage before ${side}ing`
      )
      debugger // TODO remove
    }
  }, [connected, mangoAccount, market, side])

  useEffect(() => {
    if (tradeType === 'Limit') {
      setMaxLeveragePct(100 - makerFee)
    } else {
      setMaxLeveragePct(100 - takerFee)
    }
  }, [tradeType, market])
  // const accountAssetsVal = //TODO remove
  // //unweighted
  // //if Init: account value * 0.8 (max withdraw amount)
  //   mangoAccount.getAssetsVal(
  //     mangoGroup,
  //     mangoCache,
  //     // 'Init'
  //   )
  // const accountAssetsValNum = accountAssetsVal.toNumber()// TODO remove

  // const currentLiabsVal = mangoAccount.getLiabsVal( //TODO remove
  //   //unweighted
  //   mangoGroup,
  //   mangoCache,
  //   // 'Init'
  // )
  // const currentLiabsValNum = currentLiabsVal.toNumber()// TODO remove

  // // const liabsAvail = currentAssetsVal
  // //   .sub(currentLiabsVal)
  // //   .sub(I80F48.fromNumber(0.01))

  // const maxLiabsNum = maxLiabs.toNumber()

  async function handleSettleAll() {
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const markets = useMangoStore.getState().selectedMangoGroup.markets
    const wallet = useMangoStore.getState().wallet.current

    try {
      const spotMarkets = Object.values(markets).filter(
        (mkt) => mkt instanceof Market
      ) as Market[]
      await mangoClient.settleAll(mangoGroup, mangoAccount, spotMarkets, wallet)
      notify({ title: 'Successfully settled funds' })
      await sleep(250)
      actions.fetchMangoAccounts()
    } catch (e) {
      console.warn('Error settling all:', e)
      if (e.message === 'No unsettled funds') {
        notify({
          title: 'There are no unsettled funds',
          type: 'error',
        })
      } else {
        notify({
          title: 'Error settling funds',
          description: e.message,
          txid: e.txid,
          type: 'error',
        })
      }
    }
  }

  useEffect(() => {
    if (!connected || !mangoGroup || !mangoAccount || !market) return
    setLeveragePct(0)
  }, [token, side]) //TODO how to reset to 0 only when user manually changes mangoAccount??

  useEffect(() => {
    if (!connected || !mangoGroup || !mangoAccount || !market) return
      const newQuoteSize = maxAmount.mul(I80F48.fromNumber(leveragePct / 100))
      onSetQuoteSize(floorToDecimal(newQuoteSize.toNumber(), sizeDecimalCount))
  }, [leveragePct, side])

  const setSide = (side) =>
    set((s) => {
      s.tradeForm.side = side
    })

  const setBaseSize = (baseSize) =>
    set((s) => {
      if (!Number.isNaN(parseFloat(baseSize))) {
        s.tradeForm.baseSize = parseFloat(baseSize)
      } else {
        s.tradeForm.baseSize = baseSize
      }
    })

  const setQuoteSize = (quoteSize) =>
    set((s) => {
      if (!Number.isNaN(parseFloat(quoteSize))) {
        s.tradeForm.quoteSize = parseFloat(quoteSize)
      } else {
        s.tradeForm.quoteSize = quoteSize
      }
    })

  const setPrice = (price) =>
    set((s) => {
      if (!Number.isNaN(parseFloat(price))) {
        s.tradeForm.price = parseFloat(price)
      } else {
        s.tradeForm.price = price
      }
    })

  const setTradeType = (type) =>
    set((s) => {
      s.tradeForm.tradeType = type
    })

  const markPriceRef = useRef(useMangoStore.getState().selectedMarket.markPrice)
  const markPrice = markPriceRef.current
  useEffect(
    () =>
      useMangoStore.subscribe(
        (markPrice) => (markPriceRef.current = markPrice as number),
        (state) => state.selectedMarket.markPrice
      ),
    []
  )
  let minOrderSize = '0'
  if (market instanceof Market && market.minOrderSize) {
    minOrderSize = market.minOrderSize.toString()
  } else if (market instanceof PerpMarket) {
    const baseDecimals = getTokenBySymbol(
      groupConfig,
      marketConfig.baseSymbol
    ).decimals
    minOrderSize = new Big(market.baseLotSize)
      .div(new Big(10).pow(baseDecimals))
      .toString()
  }
  const sizeDecimalCount = getDecimalCount(minOrderSize)

  let tickSize = 1
  if (market instanceof Market) {
    tickSize = market.tickSize
  } else if (market instanceof PerpMarket) {
    const baseDecimals = getTokenBySymbol(
      groupConfig,
      marketConfig.baseSymbol
    ).decimals
    const quoteDecimals = getTokenBySymbol(
      groupConfig,
      groupConfig.quoteSymbol
    ).decimals

    const nativeToUi = new Big(10).pow(baseDecimals - quoteDecimals)
    const lotsToNative = new Big(market.quoteLotSize).div(
      new Big(market.baseLotSize)
    )
    tickSize = lotsToNative.mul(nativeToUi).toNumber()
  }

  const onSetPrice = (price: number | '') => {
    setPrice(price)
    if (!price) return
    if (baseSize) {
      onSetBaseSize(baseSize)
    }
  }

  const onSetBaseSize = (baseSize: number | '') => {
    const { price } = useMangoStore.getState().tradeForm
    setBaseSize(baseSize)
    if (!baseSize) {
      setQuoteSize('')
      return
    }
    const usePrice = Number(price) || markPrice
    if (!usePrice) {
      setQuoteSize('')
      return
    }
    const rawQuoteSize = baseSize * usePrice
    const quoteSize = baseSize && floorToDecimal(rawQuoteSize, sizeDecimalCount)
    setQuoteSize(quoteSize)
  }

  const onSetQuoteSize = (quoteSize: number | '') => {
    setQuoteSize(quoteSize)
    if (!quoteSize) {
      setBaseSize('')
      return
    }

    if (!Number(price) && tradeType === 'Limit') {
      setBaseSize('')
      return
    }
    const usePrice = Number(price) || markPrice
    const rawBaseSize = quoteSize / usePrice
    const baseSize = quoteSize && floorToDecimal(rawBaseSize, sizeDecimalCount)
    setBaseSize(baseSize)
    debugger
  }

  const onChangeSlider = (leveragePct: number) => {
    setLeveragePct(leveragePct)
    debugger
  }

  const postOnChange = (checked) => {
    if (checked) {
      setIoc(false)
    }
    setPostOnly(checked)
  }
  const iocOnChange = (checked) => {
    if (checked) {
      setPostOnly(false)
    }
    setIoc(checked)
  }

  async function onSubmit() {
    if (!price && tradeType === 'Limit') {
      notify({
        title: 'Missing price',
        type: 'error',
      })
      return
    } else if (!baseSize) {
      notify({
        title: 'Missing size',
        type: 'error',
      })
      return
    }

    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const { askInfo, bidInfo } = useMangoStore.getState().selectedMarket
    const wallet = useMangoStore.getState().wallet.current

    if (!wallet || !mangoGroup || !mangoAccount || !market) return
    setSubmitting(true)

    try {
      let orderPrice = Number(price)
      if (tradeType === 'Market') {
        orderPrice = calculateMarketPrice(orderbook, baseSize, side)
      }

      const orderType = ioc ? 'ioc' : postOnly ? 'postOnly' : 'limit'
      let txid
      if (market instanceof Market) {
        txid = await mangoClient.placeSpotOrder(
          mangoGroup,
          mangoAccount,
          mangoGroup.mangoCache,
          market,
          wallet,
          side,
          orderPrice,
          baseSize,
          orderType
        )
      } else {
        txid = await mangoClient.placePerpOrder(
          mangoGroup,
          mangoAccount,
          mangoGroup.mangoCache,
          market,
          wallet,
          side,
          orderPrice,
          baseSize,
          orderType,
          0,
          side === 'buy' ? askInfo : bidInfo
        )
      }

      notify({ title: 'Successfully placed trade', txid })
      setPrice('')
      onSetBaseSize('')
    } catch (e) {
      notify({
        title: 'Error placing order',
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
      debugger
    } finally {
      sleep(2000).then(() => {
        actions.fetchMangoAccounts()
      })
      setSubmitting(false)
    }
  }

  const handleTradeTypeChange = (tradeType) => {
    setTradeType(tradeType)
    if (tradeType === 'Market') {
      setIoc(true)
      setPrice('')
    } else {
      const priceOnBook = side === 'buy' ? orderbook?.asks : orderbook?.bids
      if (priceOnBook && priceOnBook.length > 0 && priceOnBook[0].length > 0) {
        setPrice(priceOnBook[0][0])
      }
      setIoc(false)
    }
  }

  const disabledTradeButton =
    (!price && tradeType === 'Limit') || !baseSize || !connected || submitting

  return (
    <FloatingElement showConnect>
      <div className={!connected ? 'filter blur-sm' : 'flex flex-col h-full'}>
        <div>
          <div className={`flex text-base text-th-fgd-4`}>
            <button
              onClick={() => setSide('buy')}
              className={`flex-1 outline-none focus:outline-none`}
            >
              <div
                className={`hover:text-th-green pb-1 transition-colors duration-500
                ${
                  side === 'buy'
                    ? `text-th-green hover:text-th-green border-b-2 border-th-green`
                    : undefined
                }`}
              >
                Buy
              </div>
            </button>
            <button
              onClick={() => setSide('sell')}
              className={`flex-1 outline-none focus:outline-none`}
            >
              <div
                className={`hover:text-th-red pb-1 transition-colors duration-500
                ${
                  side === 'sell'
                    ? `text-th-red hover:text-th-red border-b-2 border-th-red`
                    : undefined
                }
              `}
              >
                Sell
              </div>
            </button>
          </div>
          <Input.Group className="mt-4">
            <Input
              type="number"
              min="0"
              step={tickSize}
              onChange={(e) => onSetPrice(e.target.value)}
              value={price}
              disabled={tradeType === 'Market'}
              prefix={'Price'}
              suffix={groupConfig.quoteSymbol}
              className="rounded-r-none"
              wrapperClassName="w-3/5"
            />
            <TradeType
              onChange={handleTradeTypeChange}
              value={tradeType}
              className="hover:border-th-primary flex-grow"
            />
          </Input.Group>

          <Input.Group className="mt-4">
            <Input
              type="number"
              min="0"
              step={minOrderSize}
              onChange={(e) => onSetBaseSize(e.target.value)}
              value={baseSize}
              className="rounded-r-none"
              wrapperClassName="w-3/5"
              prefix={'Size'}
              suffix={marketConfig.baseSymbol}
            />
            <StyledRightInput
              type="number"
              min="0"
              step={minOrderSize}
              onChange={(e) => onSetQuoteSize(e.target.value)}
              value={quoteSize}
              className="rounded-l-none"
              wrapperClassName="w-2/5"
              suffix={groupConfig.quoteSymbol}
            />
          </Input.Group>
          {tradeType !== 'Market' ? (
            <div className="flex mt-4">
              <Switch checked={postOnly} onChange={postOnChange}>
                POST
              </Switch>
              <div className="ml-4">
                <Switch checked={ioc} onChange={iocOnChange}>
                  IOC
                </Switch>
              </div>
            </div>
          ) : null}
          <div className={'pt-4 mx-2'}>
            <LeverageSlider
              value={leveragePct}
              onChange={(v) => onChangeSlider(v)}
              step={1}
              max={maxLeveragePct}
            />
          </div>
          {leverageNotification ? (
            <div
              className={`flex flex-col items-center justify-between px-3 py-2 mt-4 rounded-md bg-th-bkg-1`}
            >
              {balances.find(({ unsettled }) => unsettled > 0) ||
              balances.find(
                ({ borrows, marginDeposits }) =>
                  borrows.gt(ZERO_I80F48) && marginDeposits.gt(ZERO_I80F48)
              ) ? (
                <div className="flex flex-wrap items-center text-fgd-1">
                  Please
                  <Button onClick={handleSettleAll} className="py-0 px-2 mx-1">
                    Settle All
                  </Button>
                  funds before placing this order
                  <Tooltip content="Use the Settle All button to move unsettled funds to your deposits. If you have borrows, settling will use deposits for that asset to reduce your borrows.">
                    <div>
                      <InformationCircleIcon
                        className={`h-5 w-5 ml-1 text-th-primary cursor-help`}
                      />
                    </div>
                  </Tooltip>
                </div>
              ) : leverageNotification ? (
                <div className={`text-th-primary`}>{leverageNotification}</div>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className={`flex pt-6`}>
          {ipAllowed ? (
            side === 'buy' ? (
              <Button
                disabled={disabledTradeButton}
                onClick={onSubmit}
                className={`${
                  !disabledTradeButton
                    ? 'bg-th-bkg-2 border border-th-green hover:border-th-green-dark'
                    : 'border border-th-bkg-4'
                } text-th-green hover:text-th-fgd-1 hover:bg-th-green-dark flex-grow`}
              >
                {`${baseSize > 0 ? 'Buy ' + baseSize : 'Buy '} ${
                  marketConfig.name.includes('PERP')
                    ? marketConfig.name
                    : marketConfig.baseSymbol
                }`}
              </Button>
            ) : (
              <Button
                disabled={disabledTradeButton}
                onClick={onSubmit}
                className={`${
                  !disabledTradeButton
                    ? 'bg-th-bkg-2 border border-th-red hover:border-th-red-dark'
                    : 'border border-th-bkg-4'
                } text-th-red hover:text-th-fgd-1 hover:bg-th-red-dark flex-grow`}
              >
                {`${baseSize > 0 ? 'Sell ' + baseSize : 'Sell '} ${
                  marketConfig.name.includes('PERP')
                    ? marketConfig.name
                    : marketConfig.baseSymbol
                }`}
              </Button>
            )
          ) : (
            <Button disabled className="flex-grow">
              <span className="text-lg font-light">Country Not Allowed</span>
            </Button>
          )}
        </div>
        <div className="flex text-xs text-th-fgd-4 px-6 mt-6">
          <MarketFee />
        </div>
      </div>
    </FloatingElement>
  )
}
