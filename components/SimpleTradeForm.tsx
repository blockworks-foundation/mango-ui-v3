import { useState, useEffect, useRef, useMemo } from 'react'
import useIpAddress from '../hooks/useIpAddress'
import {
  getTokenBySymbol,
  getMarketIndexBySymbol,
  getWeights,
  I80F48,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import { notify } from '../utils/notifications'
import { calculateTradePrice, getDecimalCount, sleep } from '../utils'
import { floorToDecimal } from '../utils/index'
import useMangoStore from '../stores/useMangoStore'
import Button from './Button'
import TradeType from './TradeType'
import Input from './Input'
import Switch from './Switch'
import { Market } from '@project-serum/serum'
import Big from 'big.js'
import MarketFee from './MarketFee'
import LeverageSlider from './LeverageSlider'
import Loading from './Loading'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { ElementTitle } from './styles'
import ButtonGroup from './ButtonGroup'
import Checkbox from './Checkbox'

export default function SimpleTradeForm() {
  const set = useMangoStore((s) => s.set)
  const { ipAllowed } = useIpAddress()
  const connected = useMangoStore((s) => s.wallet.connected)
  const actions = useMangoStore((s) => s.actions)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoClient = useMangoStore((s) => s.connection.client)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const marketIndex = getMarketIndexBySymbol(
    groupConfig,
    marketConfig.baseSymbol
  )
  const market = useMangoStore((s) => s.selectedMarket.current)
  const { side, baseSize, quoteSize, price, stopPrice, tradeType } =
    useMangoStore((s) => s.tradeForm)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const [postOnly, setPostOnly] = useState(false)
  const [ioc, setIoc] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [positionSizePercent, setPositionSizePercent] = useState('')
  const [showStopForm, setShowStopForm] = useState(false)
  const [stopSizePercent, setStopSizePercent] = useState('5%')

  const orderBookRef = useRef(useMangoStore.getState().selectedMarket.orderBook)
  const orderbook = orderBookRef.current
  useEffect(
    () =>
      useMangoStore.subscribe(
        // @ts-ignore
        (orderBook) => (orderBookRef.current = orderBook),
        (state) => state.selectedMarket.orderBook
      ),
    []
  )

  useEffect(() => {
    if (tradeType === 'Market') {
      set((s) => {
        s.tradeForm.price = ''
      })
    }
  }, [tradeType, set])

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

  const setStopPrice = (price) =>
    set((s) => {
      if (!Number.isNaN(parseFloat(price))) {
        s.tradeForm.stopPrice = parseFloat(price)
      } else {
        s.tradeForm.stopPrice = price
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
    setPositionSizePercent('')
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
    setQuoteSize(rawQuoteSize.toFixed(6))
  }

  const onSetQuoteSize = (quoteSize: number | '') => {
    setPositionSizePercent('')
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
  }

  const onTradeTypeChange = (tradeType) => {
    setTradeType(tradeType)
    setPositionSizePercent('')
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
      const orderPrice = calculateTradePrice(
        tradeType,
        orderbook,
        baseSize,
        side,
        price
      )

      if (!orderPrice) {
        notify({
          title: 'Price not available',
          description: 'Please try again',
          type: 'error',
        })
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
    } finally {
      await sleep(600)
      actions.reloadMangoAccount()
      actions.updateOpenOrders()
      actions.loadMarketFills()
      setSubmitting(false)
    }
  }

  const initLeverage = useMemo(() => {
    if (!mangoGroup || !marketConfig) return 1

    const ws = getWeights(mangoGroup, marketConfig.marketIndex, 'Init')
    const w =
      marketConfig.kind === 'perp' ? ws.perpAssetWeight : ws.spotAssetWeight
    return Math.round((100 * -1) / (w.toNumber() - 1)) / 100
  }, [mangoGroup, marketConfig])

  const { max, deposits, borrows } = useMemo(() => {
    if (!mangoAccount) return { max: 0 }
    const priceOrDefault = price
      ? I80F48.fromNumber(price)
      : mangoGroup.getPrice(marketIndex, mangoCache)

    const {
      max: maxQuote,
      deposits,
      borrows,
    } = mangoAccount.getMaxLeverageForMarket(
      mangoGroup,
      mangoCache,
      marketIndex,
      market,
      side,
      priceOrDefault
    )

    if (maxQuote.toNumber() <= 0) return { max: 0 }
    // multiply the maxQuote by a scaler value to account for
    // srm fees or rounding issues in getMaxLeverageForMarket
    const maxScaler = market instanceof PerpMarket ? 0.99 : 0.95
    const scaledMax = price
      ? (maxQuote.toNumber() * maxScaler) / price
      : (maxQuote.toNumber() * maxScaler) /
        mangoGroup.getPrice(marketIndex, mangoCache).toNumber()

    return { max: scaledMax, deposits, borrows }
  }, [mangoAccount, mangoGroup, mangoCache, marketIndex, market, side, price])

  const handleSetPositionSize = (percent) => {
    setPositionSizePercent(percent)
    const baseSize = max * (parseInt(percent) / 100)
    const step = parseFloat(minOrderSize)
    const roundedSize = (Math.round(baseSize / step) * step).toFixed(
      sizeDecimalCount
    )
    setBaseSize(parseFloat(roundedSize))
    const usePrice = Number(price) || markPrice
    if (!usePrice) {
      setQuoteSize('')
    }
    const rawQuoteSize = parseFloat(roundedSize) * usePrice
    setQuoteSize(rawQuoteSize.toFixed(6))
  }

  const percentToClose = (size, total) => {
    return (size / total) * 100
  }

  const roundedDeposits = parseFloat(deposits?.toFixed(sizeDecimalCount))
  const roundedBorrows = parseFloat(borrows?.toFixed(sizeDecimalCount))

  const closeDepositString =
    percentToClose(baseSize, roundedDeposits) > 100
      ? `100% close position and open a ${(+baseSize - roundedDeposits).toFixed(
          sizeDecimalCount
        )} ${marketConfig.baseSymbol} short`
      : `${percentToClose(baseSize, roundedDeposits).toFixed(
          0
        )}% close position`

  const closeBorrowString =
    percentToClose(baseSize, roundedBorrows) > 100
      ? `100% close position and open a ${(+baseSize - roundedBorrows).toFixed(
          sizeDecimalCount
        )} ${marketConfig.baseSymbol} short`
      : `${percentToClose(baseSize, roundedBorrows).toFixed(0)}% close position`

  const disabledTradeButton =
    (!price && tradeType === 'Limit') ||
    !baseSize ||
    !connected ||
    submitting ||
    !mangoAccount

  const hideStopLoss =
    (side === 'sell' && baseSize === roundedDeposits) ||
    (side === 'buy' && baseSize === roundedBorrows)

  return !isMobile ? (
    <div className={!connected ? 'fliter blur-sm' : 'flex flex-col h-full'}>
      <ElementTitle>
        Trade {marketConfig.name}
        <span className="border border-th-primary ml-2 px-1 py-0.5 rounded text-xs text-th-primary">
          {initLeverage}x
        </span>
      </ElementTitle>
      <div className={`border-b border-th-fgd-4 mb-4 relative`}>
        <div
          className={`absolute ${
            side === 'buy'
              ? 'bg-th-green translate-x-0'
              : 'bg-th-red translate-x-full'
          } bottom-[-1px] default-transition left-0 h-0.5 transform w-1/2`}
        />
        <nav className="-mb-px flex" aria-label="Tabs">
          <button
            onClick={() => setSide('buy')}
            className={`cursor-pointer default-transition flex font-semibold items-center justify-center p-2 relative text-base w-1/2 whitespace-nowrap hover:opacity-100
                    ${
                      side === 'buy'
                        ? `text-th-green`
                        : `text-th-fgd-4 hover:text-th-green`
                    }
                  `}
          >
            {market instanceof PerpMarket ? 'Long' : 'Buy'}
          </button>
          <button
            onClick={() => setSide('sell')}
            className={`cursor-pointer default-transition flex font-semibold items-center justify-center p-2 relative text-base w-1/2 whitespace-nowrap hover:opacity-100
                    ${
                      side === 'sell'
                        ? `text-th-red`
                        : `text-th-fgd-4 hover:text-th-red`
                    }
                  `}
          >
            {market instanceof PerpMarket ? 'Short' : 'Sell'}
          </button>
        </nav>
      </div>
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-2 flex items-center">
          <label className="text-xs text-th-fgd-3">Type</label>
        </div>
        <div className="col-span-10">
          <ButtonGroup
            activeValue={tradeType}
            onChange={(p) => onTradeTypeChange(p)}
            values={['Limit', 'Market']}
          />
        </div>
        <div className="col-span-2 flex items-center">
          <label className="text-xs text-th-fgd-3">Price</label>
        </div>
        <div className="col-span-10">
          <Input
            type="number"
            min="0"
            step={tickSize}
            onChange={(e) => onSetPrice(e.target.value)}
            value={price}
            disabled={tradeType === 'Market'}
            placeholder={tradeType === 'Market' ? 'Market Price' : null}
            prefix={
              <img
                src={`/assets/icons/${groupConfig.quoteSymbol.toLowerCase()}.svg`}
                width="16"
                height="16"
              />
            }
          />
        </div>
        <div className="col-span-2 flex items-center">
          <label className="text-xs text-th-fgd-3">Size</label>
        </div>
        <div className="col-span-10">
          <Input.Group className="-mb-1">
            <Input
              type="number"
              min="0"
              step={minOrderSize}
              onChange={(e) => onSetBaseSize(e.target.value)}
              value={baseSize}
              wrapperClassName="mr-0.5 w-1/2"
              prefix={
                <img
                  src={`/assets/icons/${marketConfig.baseSymbol.toLowerCase()}.svg`}
                  width="16"
                  height="16"
                />
              }
            />
            <Input
              type="number"
              min="0"
              step={minOrderSize}
              onChange={(e) => onSetQuoteSize(e.target.value)}
              value={quoteSize}
              wrapperClassName="ml-0.5 w-1/2"
              prefix={
                <img
                  src={`/assets/icons/${groupConfig.quoteSymbol.toLowerCase()}.svg`}
                  width="16"
                  height="16"
                />
              }
            />
          </Input.Group>
        </div>
        <div className="col-span-10 col-start-3">
          <ButtonGroup
            activeValue={positionSizePercent}
            onChange={(p) => handleSetPositionSize(p)}
            unit="%"
            values={['10', '25', '50', '75', '100']}
          />
          {side === 'sell' ? (
            <div className="text-th-fgd-3 text-xs tracking-normal mt-2">
              <span>{roundedDeposits > 0 ? closeDepositString : null}</span>
            </div>
          ) : (
            <div className="text-th-fgd-3 text-xs tracking-normal mt-2">
              <span>{roundedBorrows > 0 ? closeBorrowString : null}</span>
            </div>
          )}
          {hideStopLoss ? null : (
            <div className="pt-3">
              <label className="cursor-pointer flex items-center">
                <Checkbox
                  checked={showStopForm}
                  onChange={(e) => setShowStopForm(e.target.checked)}
                />
                <span className="ml-2 text-xs text-th-fgd-3">
                  Set Stop Loss
                </span>
              </label>
            </div>
          )}
        </div>
        {showStopForm && !hideStopLoss ? (
          <>
            <div className="col-span-2 flex items-center">
              <label className="text-xs text-th-fgd-3">Stop Price</label>
            </div>
            <div className="col-span-10 -mb-1">
              <Input
                type="number"
                min="0"
                step={tickSize}
                onChange={(e) => setStopPrice(e.target.value)}
                value={stopPrice}
                prefix={
                  <img
                    src={`/assets/icons/${groupConfig.quoteSymbol.toLowerCase()}.svg`}
                    width="16"
                    height="16"
                  />
                }
              />
            </div>
            <div className="col-span-10 col-start-3">
              <ButtonGroup
                activeValue={stopSizePercent}
                onChange={(p) => setStopSizePercent(p)}
                values={['5%', '10%', '15%', '20%', '25%']}
              />
            </div>
          </>
        ) : null}
        <div className={`col-span-10 col-start-3 flex py-3`}>
          {ipAllowed ? (
            side.toLowerCase() === 'buy' ? (
              <Button
                disabled={disabledTradeButton}
                onClick={onSubmit}
                className={`${
                  !disabledTradeButton
                    ? 'bg-th-bkg-2 border border-th-green hover:border-th-green-dark'
                    : 'border border-th-bkg-4'
                } text-th-green hover:text-th-fgd-1 hover:bg-th-green-dark flex-grow`}
              >
                {submitting ? (
                  <div className="w-full">
                    <Loading className="mx-auto" />
                  </div>
                ) : market instanceof PerpMarket ? (
                  `${baseSize > 0 ? 'Long ' + baseSize : 'Long '} ${
                    marketConfig.name
                  }`
                ) : (
                  `${baseSize > 0 ? 'Buy ' + baseSize : 'Buy '} ${
                    marketConfig.baseSymbol
                  }`
                )}
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
                {submitting ? (
                  <div className="w-full">
                    <Loading className="mx-auto" />
                  </div>
                ) : market instanceof PerpMarket ? (
                  `${baseSize > 0 ? 'Short ' + baseSize : 'Short '} ${
                    marketConfig.name
                  }`
                ) : (
                  `${baseSize > 0 ? 'Sell ' + baseSize : 'Sell '} ${
                    marketConfig.baseSymbol
                  }`
                )}
              </Button>
            )
          ) : (
            <Button disabled className="flex-grow">
              <span>Country Not Allowed</span>
            </Button>
          )}
        </div>
        {!showStopForm ? (
          <div className="col-span-10 col-start-3 flex text-xs text-th-fgd-4">
            <MarketFee />
          </div>
        ) : null}
      </div>
      {/* <LeverageSlider
        onChange={(e) => onSetBaseSize(e)}
        value={baseSize ? baseSize : 0}
        step={parseFloat(minOrderSize)}
        disabled={false}
        side={side}
        decimalCount={sizeDecimalCount}
        price={calculateTradePrice(
          tradeType,
          orderbook,
          baseSize ? baseSize : 0,
          side,
          price
        )}
      /> */}
      {/* {tradeType !== 'Market' ? (
        <div className="flex mt-2">
          <Switch checked={postOnly} onChange={postOnChange}>
            POST
          </Switch>
          <div className="ml-4">
            <Switch checked={ioc} onChange={iocOnChange}>
              IOC
            </Switch>
          </div>
        </div>
      ) : null} */}
    </div>
  ) : (
    <div className="flex flex-col h-full">
      <div className={`flex pb-3 text-base text-th-fgd-4`}>
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
            {market instanceof PerpMarket ? 'Long' : 'Buy'}
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
            {market instanceof PerpMarket ? 'Short' : 'Sell'}
          </div>
        </button>
      </div>
      <div className="pb-3">
        <label className="block mb-1 text-th-fgd-3 text-xs">Price</label>
        <Input
          type="number"
          min="0"
          step={tickSize}
          onChange={(e) => onSetPrice(e.target.value)}
          value={price}
          disabled={tradeType === 'Market'}
          suffix={
            <img
              src={`/assets/icons/${groupConfig.quoteSymbol.toLowerCase()}.svg`}
              width="16"
              height="16"
            />
          }
        />
      </div>
      <div className="flex items-center justify-between pb-3">
        <label className="text-th-fgd-3 text-xs">Type</label>
        <TradeType onChange={onTradeTypeChange} value={tradeType} />
      </div>
      <label className="block mb-1 text-th-fgd-3 text-xs">Size</label>
      <div className="grid grid-cols-2 grid-rows-1 gap-2">
        <div className="col-span-1">
          <Input
            type="number"
            min="0"
            step={minOrderSize}
            onChange={(e) => onSetBaseSize(e.target.value)}
            value={baseSize}
            suffix={
              <img
                src={`/assets/icons/${marketConfig.baseSymbol.toLowerCase()}.svg`}
                width="16"
                height="16"
              />
            }
          />
        </div>
        <div className="col-span-1">
          <Input
            type="number"
            min="0"
            step={minOrderSize}
            onChange={(e) => onSetQuoteSize(e.target.value)}
            value={quoteSize}
            suffix={
              <img
                src={`/assets/icons/${groupConfig.quoteSymbol.toLowerCase()}.svg`}
                width="16"
                height="16"
              />
            }
          />
        </div>
      </div>
      <LeverageSlider
        onChange={(e) => onSetBaseSize(e)}
        value={baseSize ? baseSize : 0}
        step={parseFloat(minOrderSize)}
        disabled={false}
        side={side}
        decimalCount={sizeDecimalCount}
        price={calculateTradePrice(
          tradeType,
          orderbook,
          baseSize ? baseSize : 0,
          side,
          price
        )}
      />
      {tradeType !== 'Market' ? (
        <div className="flex mt-2">
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
      <div className={`flex py-4`}>
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
              {submitting ? (
                <div className="w-full">
                  <Loading className="mx-auto" />
                </div>
              ) : (
                `${baseSize > 0 ? 'Buy ' + baseSize : 'Buy '} ${
                  marketConfig.name.includes('PERP')
                    ? marketConfig.name
                    : marketConfig.baseSymbol
                }`
              )}
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
              {submitting ? (
                <div className="w-full">
                  <Loading className="mx-auto" />
                </div>
              ) : (
                `${baseSize > 0 ? 'Sell ' + baseSize : 'Sell '} ${
                  marketConfig.name.includes('PERP')
                    ? marketConfig.name
                    : marketConfig.baseSymbol
                }`
              )}
            </Button>
          )
        ) : (
          <Button disabled className="flex-grow">
            <span>Country Not Allowed</span>
          </Button>
        )}
      </div>
      <div className="flex text-xs text-th-fgd-4 px-6 mt-2.5">
        <MarketFee />
      </div>
    </div>
  )
}
