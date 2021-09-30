import { useState, useEffect, useRef, useMemo } from 'react'
import useIpAddress from '../../hooks/useIpAddress'
import {
  getTokenBySymbol,
  getMarketIndexBySymbol,
  I80F48,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import { notify } from '../../utils/notifications'
import { calculateTradePrice, getDecimalCount, sleep } from '../../utils'
import { floorToDecimal } from '../../utils/index'
import useMangoStore from '../../stores/useMangoStore'
import Button from '../Button'
import Input from '../Input'
import { Market } from '@project-serum/serum'
import Big from 'big.js'
import MarketFee from '../MarketFee'
import Loading from '../Loading'
import { ElementTitle } from '../styles'
import ButtonGroup from '../ButtonGroup'
import Checkbox from '../Checkbox'
import OrderSideTabs from './OrderSideTabs'
import Tooltip from '../Tooltip'
import SlippageWarning from './SlippageWarning'

export default function SimpleTradeForm({ initLeverage }) {
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
  const { side, baseSize, quoteSize, price, triggerPrice, tradeType } =
    useMangoStore((s) => s.tradeForm)

  const [postOnly, setPostOnly] = useState(false)
  const [ioc, setIoc] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [positionSizePercent, setPositionSizePercent] = useState('')
  const [showStopForm, setShowStopForm] = useState(false)
  const [showTakeProfitForm, setShowTakeProfitForm] = useState(false)
  const [stopSizePercent, setStopSizePercent] = useState('5%')
  const [reduceOnly, setReduceOnly] = useState(false)
  const [spotMargin, setSpotMargin] = useState(false)

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
    if (tradeType !== 'Market' && tradeType !== 'Limit') {
      setTradeType('Limit')
    }
  }, [])

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

  const setTriggerPrice = (price) =>
    set((s) => {
      if (!Number.isNaN(parseFloat(price))) {
        s.tradeForm.tripperPrice = parseFloat(price)
      } else {
        s.tradeForm.tripperPrice = price
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
  const reduceOnChange = (checked) => {
    if (checked) {
      setReduceOnly(false)
    }
    setReduceOnly(checked)
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
      actions.loadMarketFills()
      setSubmitting(false)
    }
  }

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

  const hideProfitStop =
    (side === 'sell' && baseSize === roundedDeposits) ||
    (side === 'buy' && baseSize === roundedBorrows)

  return (
    <div className="flex flex-col h-full">
      <ElementTitle>
        {marketConfig.name}
        <span className="border border-th-primary ml-2 px-1 py-0.5 rounded text-xs text-th-primary">
          {initLeverage}x
        </span>
      </ElementTitle>
      <OrderSideTabs isSimpleForm onChange={setSide} side={side} />
      <div className="grid grid-cols-12 gap-2 text-left">
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
            placeholder={tradeType === 'Market' ? markPrice : null}
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
        <div className="col-span-10 col-start-3 pb-2">
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
          <div className="flex items-center space-x-1">
            {!hideProfitStop ? (
              <div
                className={`${
                  showStopForm ? 'bg-th-bkg-4' : 'bg-th-bkg-3'
                } mt-2 p-2 rounded-md w-1/2`}
              >
                <Checkbox
                  checked={showStopForm}
                  onChange={(e) => setShowStopForm(e.target.checked)}
                >
                  Set Stop Loss
                </Checkbox>
              </div>
            ) : null}
            {!hideProfitStop ? (
              <div
                className={`${
                  showTakeProfitForm ? 'bg-th-bkg-4' : 'bg-th-bkg-3'
                } mt-2 p-2 rounded-md w-1/2`}
              >
                <Checkbox
                  checked={showTakeProfitForm}
                  onChange={(e) => setShowTakeProfitForm(e.target.checked)}
                >
                  Set Take Profit
                </Checkbox>
              </div>
            ) : null}
          </div>
        </div>
        {showStopForm && !hideProfitStop ? (
          <>
            <div className="col-span-2 flex items-center">
              <label className="text-xs text-th-fgd-3">Stop Price</label>
            </div>
            <div className="col-span-10 -mb-1">
              <Input
                type="number"
                min="0"
                step={tickSize}
                onChange={(e) => setTriggerPrice(e.target.value)}
                value={triggerPrice}
                prefix={
                  <img
                    src={`/assets/icons/${groupConfig.quoteSymbol.toLowerCase()}.svg`}
                    width="16"
                    height="16"
                  />
                }
              />
            </div>
            <div className="col-span-10 col-start-3 pb-2">
              <ButtonGroup
                activeValue={stopSizePercent}
                onChange={(p) => setStopSizePercent(p)}
                values={['5%', '10%', '15%', '20%', '25%']}
              />
            </div>
          </>
        ) : null}
        {showTakeProfitForm && !hideProfitStop ? (
          <>
            <div className="col-span-2 flex items-center">
              <label className="text-left text-xs text-th-fgd-3">
                Profit Price
              </label>
            </div>
            <div className="col-span-10 -mb-1">
              <Input
                type="number"
                min="0"
                step={tickSize}
                onChange={(e) => setTriggerPrice(e.target.value)}
                value={triggerPrice}
                prefix={
                  <img
                    src={`/assets/icons/${groupConfig.quoteSymbol.toLowerCase()}.svg`}
                    width="16"
                    height="16"
                  />
                }
              />
            </div>
            <div className="col-span-10 col-start-3 pb-2">
              <ButtonGroup
                activeValue={stopSizePercent}
                onChange={(p) => setStopSizePercent(p)}
                values={['5%', '10%', '15%', '20%', '25%']}
              />
            </div>
          </>
        ) : null}
        <div className="col-span-10 col-start-3 flex">
          {tradeType === 'Limit' ? (
            <>
              <div className="mr-4">
                <Tooltip
                  delay={250}
                  placement="left"
                  content="Post only orders are guaranteed to be the maker order or else it will be canceled."
                >
                  <Checkbox
                    checked={postOnly}
                    onChange={(e) => postOnChange(e.target.checked)}
                  >
                    POST
                  </Checkbox>
                </Tooltip>
              </div>
              <div className="mr-4">
                <Tooltip
                  delay={250}
                  placement="left"
                  content="Immediate or cancel orders are guaranteed to be the taker or it will be canceled."
                >
                  <div className="flex items-center text-th-fgd-3 text-xs">
                    <Checkbox
                      checked={ioc}
                      onChange={(e) => iocOnChange(e.target.checked)}
                    >
                      IOC
                    </Checkbox>
                  </div>
                </Tooltip>
              </div>
            </>
          ) : null}
          {marketConfig.kind === 'perp' ? (
            <Tooltip
              delay={250}
              placement="left"
              content="Reduce only orders will only reduce your overall position."
            >
              <Checkbox
                checked={reduceOnly}
                onChange={(e) => reduceOnChange(e.target.checked)}
              >
                Reduce Only
              </Checkbox>
            </Tooltip>
          ) : null}
          {marketConfig.kind === 'spot' ? (
            <Tooltip
              delay={250}
              placement="left"
              content="Enable spot margin for this trade"
            >
              <Checkbox
                checked={spotMargin}
                onChange={(e) => setSpotMargin(e.target.checked)}
              >
                Margin
              </Checkbox>
            </Tooltip>
          ) : null}
        </div>
        <div className={`col-span-10 col-start-3 flex pt-2`}>
          {ipAllowed ? (
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
              ) : side.toLowerCase() === 'buy' ? (
                market instanceof PerpMarket ? (
                  `${baseSize > 0 ? 'Long ' + baseSize : 'Long '} ${
                    marketConfig.name
                  }`
                ) : (
                  `${baseSize > 0 ? 'Buy ' + baseSize : 'Buy '} ${
                    marketConfig.baseSymbol
                  }`
                )
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
          ) : (
            <Button disabled className="flex-grow">
              <span>Country Not Allowed</span>
            </Button>
          )}
        </div>
        {tradeType === 'Market' ? (
          <div className="col-span-10 col-start-3">
            <SlippageWarning slippage={0.2} />
          </div>
        ) : null}
        <div className="col-span-10 col-start-3 flex pt-2 text-xs text-th-fgd-4">
          <MarketFee />
        </div>
      </div>
    </div>
  )
}
