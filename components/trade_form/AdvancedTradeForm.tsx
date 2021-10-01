import { useMemo, useState, useEffect, useRef } from 'react'
import useIpAddress from '../../hooks/useIpAddress'
import {
  getMarketIndexBySymbol,
  getTokenBySymbol,
  I80F48,
  nativeI80F48ToUi,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import { notify } from '../../utils/notifications'
import { calculateTradePrice, getDecimalCount } from '../../utils'
import { floorToDecimal } from '../../utils/index'
import useMangoStore from '../../stores/useMangoStore'
import Button from '../Button'
import TradeType from './TradeType'
import Input from '../Input'
import { Market } from '@project-serum/serum'
import Big from 'big.js'
import MarketFee from '../MarketFee'
import Loading from '../Loading'
import Tooltip from '../Tooltip'
import OrderSideTabs from './OrderSideTabs'
import { ElementTitle } from '../styles'
import ButtonGroup from '../ButtonGroup'
import Checkbox from '../Checkbox'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../TradePageGrid'
import EstPriceImpact from './EstPriceImpact'

interface AdvancedTradeFormProps {
  initLeverage?: number
}

export default function AdvancedTradeForm({
  initLeverage,
}: AdvancedTradeFormProps) {
  const set = useMangoStore((s) => s.set)
  const { ipAllowed } = useIpAddress()
  const connected = useMangoStore((s) => s.wallet.connected)
  const actions = useMangoStore((s) => s.actions)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoClient = useMangoStore((s) => s.connection.client)
  const market = useMangoStore((s) => s.selectedMarket.current)
  const isPerpMarket = market instanceof PerpMarket
  const [reduceOnly, setReduceOnly] = useState(false)
  const [spotMargin, setSpotMargin] = useState(false)
  const [positionSizePercent, setPositionSizePercent] = useState('')

  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const marketIndex = getMarketIndexBySymbol(
    groupConfig,
    marketConfig.baseSymbol
  )
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const {
    side,
    baseSize,
    quoteSize,
    price,
    tradeType,
    triggerPrice,
    triggerCondition,
  } = useMangoStore((s) => s.tradeForm)
  const isLimitOrder = ['Limit', 'Stop Limit', 'Take Profit Limit'].includes(
    tradeType
  )
  const isMarketOrder = ['Market', 'Stop Loss', 'Take Profit'].includes(
    tradeType
  )
  const isTriggerLimit = ['Stop Limit', 'Take Profit Limit'].includes(tradeType)

  const isTriggerOrder = [
    'Stop Loss',
    'Take Profit',
    'Stop Limit',
    'Take Profit Limit',
  ].includes(tradeType)

  const [postOnly, setPostOnly] = useState(false)
  const [ioc, setIoc] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  useEffect(() => {
    let condition
    switch (tradeType) {
      case 'Stop Loss':
      case 'Stop Limit':
        condition = side == 'buy' ? 'above' : 'below'
        break
      case 'Take Profit':
      case 'Take Profit Limit':
        condition = side == 'buy' ? 'below' : 'above'
        break
    }
    if (condition) {
      set((s) => {
        s.tradeForm.triggerCondition = condition
      })
    }
  }, [set, tradeType, side])

  const { max, deposits, borrows, spotMax } = useMemo(() => {
    if (!mangoAccount) return { max: 0 }
    const priceOrDefault = price
      ? I80F48.fromNumber(price)
      : mangoGroup.getPrice(marketIndex, mangoCache)

    const token =
      side === 'buy'
        ? getTokenBySymbol(groupConfig, 'USDC')
        : getTokenBySymbol(groupConfig, marketConfig.baseSymbol)
    const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)

    const availableBalance = floorToDecimal(
      nativeI80F48ToUi(
        mangoAccount.getAvailableBalance(mangoGroup, mangoCache, tokenIndex),
        token.decimals
      ).toNumber(),
      token.decimals
    )

    const spotMax =
      side === 'buy'
        ? availableBalance / priceOrDefault.toNumber()
        : availableBalance

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

    return { max: scaledMax, deposits, borrows, spotMax }
  }, [mangoAccount, mangoGroup, mangoCache, marketIndex, market, side, price])

  const onChangeSide = (side) => {
    setPositionSizePercent('')
    set((s) => {
      s.tradeForm.side = side
    })
  }

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

  const setTradeType = (type) => {
    set((s) => {
      s.tradeForm.tradeType = type
    })
  }

  const setTriggerPrice = (price) => {
    set((s) => {
      if (!Number.isNaN(parseFloat(price))) {
        s.tradeForm.triggerPrice = parseFloat(price)
      } else {
        s.tradeForm.triggerPrice = price
      }
    })
    if (isMarketOrder) {
      onSetPrice(price)
    }
  }

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
  } else if (isPerpMarket) {
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
    setQuoteSize(rawQuoteSize.toFixed(6))
  }

  const onSetQuoteSize = (quoteSize: number | '') => {
    setQuoteSize(quoteSize)
    if (!quoteSize) {
      setBaseSize('')
      return
    }

    if (!Number(price) && isLimitOrder) {
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
    if (['Market', 'Stop Loss', 'Take Profit'].includes(tradeType)) {
      setIoc(true)
      if (isTriggerOrder) {
        setPrice(triggerPrice)
      }
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
  const marginOnChange = (checked) => {
    setSpotMargin(checked)
    handleSetPositionSize(positionSizePercent, checked)
  }

  const handleSetPositionSize = (percent, spotMargin) => {
    setPositionSizePercent(percent)
    const baseSizeMax =
      spotMargin || marketConfig.kind === 'perp' ? max : spotMax
    const baseSize = baseSizeMax * (parseInt(percent) / 100)
    const step = parseFloat(minOrderSize)
    const roundedSize = (Math.floor(baseSize / step) * step).toFixed(
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

  async function onSubmit() {
    if (!price && isLimitOrder) {
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
    } else if (!triggerPrice && isTriggerOrder) {
      notify({
        title: 'Missing trigger price',
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
        price,
        triggerPrice
      )

      if (!orderPrice) {
        notify({
          title: 'Price not available',
          description: 'Please try again',
          type: 'error',
        })
      }

      // TODO: this has a race condition when switching between markets or buy & sell
      // spot market orders will sometimes not be ioc but limit
      const orderType = ioc ? 'ioc' : postOnly ? 'postOnly' : 'limit'

      console.log(
        'submit',
        side,
        baseSize.toString(),
        orderPrice.toString(),
        orderType,
        market instanceof Market && 'spot',
        isTriggerOrder && 'trigger'
      )
      let txid
      if (market instanceof Market) {
        txid = await mangoClient.placeSpotOrder2(
          mangoGroup,
          mangoAccount,
          market,
          wallet,
          side,
          orderPrice,
          baseSize,
          orderType
        )
      } else {
        if (isTriggerOrder) {
          txid = await mangoClient.addPerpTriggerOrder(
            mangoGroup,
            mangoAccount,
            market,
            wallet,
            isMarketOrder ? 'market' : orderType,
            side,
            orderPrice,
            baseSize,
            triggerCondition,
            Number(triggerPrice)
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
            isMarketOrder ? 'market' : orderType,
            Date.now(),
            side === 'buy' ? askInfo : bidInfo, // book side used for ConsumeEvents
            reduceOnly
          )
        }
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
      console.error(e)
    } finally {
      // TODO: should be removed, main issue are newly created OO accounts
      // await sleep(600)
      actions.reloadMangoAccount()
      actions.loadMarketFills()
      setSubmitting(false)
    }
  }

  const roundedMax = (
    Math.round(max / parseFloat(minOrderSize)) * parseFloat(minOrderSize)
  ).toFixed(sizeDecimalCount)

  const sizeTooLarge =
    spotMargin || marketConfig.kind === 'perp'
      ? baseSize > roundedMax
      : baseSize > spotMax

  const disabledTradeButton =
    (!price && isLimitOrder) ||
    !baseSize ||
    !connected ||
    submitting ||
    !mangoAccount ||
    sizeTooLarge

  return (
    <div className="flex flex-col h-full">
      <ElementTitle className="hidden md:flex">
        {marketConfig.name}
        <span className="border border-th-primary ml-2 px-1 py-0.5 rounded text-xs text-th-primary">
          {initLeverage}x
        </span>
      </ElementTitle>
      <OrderSideTabs onChange={onChangeSide} side={side} />
      <div className="grid grid-cols-12 gap-2 text-left">
        <div className="col-span-12 md:col-span-6">
          <label className="text-xxs text-th-fgd-3">Type</label>
          <TradeType
            onChange={onTradeTypeChange}
            value={tradeType}
            offerTriggers={isPerpMarket}
          />
        </div>
        <div className="col-span-12 md:col-span-6">
          {!isTriggerOrder ? (
            <>
              <label className="text-xxs text-th-fgd-3">Price</label>
              <Input
                type="number"
                min="0"
                step={tickSize}
                onChange={(e) => onSetPrice(e.target.value)}
                value={price}
                disabled={isMarketOrder}
                placeholder={tradeType === 'Market' ? markPrice : null}
                prefix={
                  <img
                    src={`/assets/icons/${groupConfig.quoteSymbol.toLowerCase()}.svg`}
                    width="16"
                    height="16"
                  />
                }
              />
            </>
          ) : (
            <>
              <label className="text-xxs text-th-fgd-3">Trigger Price</label>
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
            </>
          )}
        </div>
        {isTriggerLimit && (
          <>
            <div className="col-span-12">
              <label className="text-xxs text-th-fgd-3">Price</label>
              <Input
                type="number"
                min="0"
                step={tickSize}
                onChange={(e) => onSetPrice(e.target.value)}
                value={price}
                prefix={
                  <img
                    src={`/assets/icons/${groupConfig.quoteSymbol.toLowerCase()}.svg`}
                    width="16"
                    height="16"
                  />
                }
              />
            </div>
          </>
        )}
        <div className="col-span-6">
          <label className="text-xxs text-th-fgd-3">Size</label>
          <Input
            type="number"
            min="0"
            step={minOrderSize}
            onChange={(e) => onSetBaseSize(e.target.value)}
            value={baseSize}
            prefix={
              <img
                src={`/assets/icons/${marketConfig.baseSymbol.toLowerCase()}.svg`}
                width="16"
                height="16"
              />
            }
          />
        </div>
        <div className="col-span-6">
          <label className="text-xxs text-th-fgd-3">Quantity</label>
          <Input
            type="number"
            min="0"
            step={minOrderSize}
            onChange={(e) => onSetQuoteSize(e.target.value)}
            value={quoteSize}
            prefix={
              <img
                src={`/assets/icons/${groupConfig.quoteSymbol.toLowerCase()}.svg`}
                width="16"
                height="16"
              />
            }
          />
        </div>
        <div className="col-span-12 -mt-1">
          <ButtonGroup
            activeValue={positionSizePercent}
            onChange={(p) => handleSetPositionSize(p, spotMargin)}
            unit="%"
            values={
              isMobile
                ? ['10', '25', '50', '75']
                : ['10', '25', '50', '75', '100']
            }
          />
          {marketConfig.kind === 'perp' ? (
            side === 'sell' ? (
              roundedDeposits > 0 ? (
                <div className="text-th-fgd-3 text-xs tracking-normal mt-2">
                  <span>{closeDepositString}</span>
                </div>
              ) : null
            ) : roundedBorrows > 0 ? (
              <div className="text-th-fgd-3 text-xs tracking-normal mt-2">
                <span>{closeBorrowString}</span>
              </div>
            ) : null
          ) : null}
          <div className="sm:flex">
            {isLimitOrder ? (
              <div className="flex">
                <div className="mr-4 mt-4">
                  <Tooltip
                    className="hidden md:block"
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
                <div className="mr-4 mt-4">
                  <Tooltip
                    className="hidden md:block"
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
              </div>
            ) : null}
            {marketConfig.kind === 'perp' && !isTriggerOrder ? (
              <div className="mt-4">
                <Tooltip
                  className="hidden md:block"
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
              </div>
            ) : null}
            {marketConfig.kind === 'spot' ? (
              <div className="mt-4">
                <Tooltip
                  delay={250}
                  placement="left"
                  content="Enable spot margin for this trade"
                >
                  <Checkbox
                    checked={spotMargin}
                    onChange={(e) => marginOnChange(e.target.checked)}
                  >
                    Margin
                  </Checkbox>
                </Tooltip>
              </div>
            ) : null}
          </div>
          {tradeType === 'Market' ? (
            <div className="col-span-12 md:col-span-10 md:col-start-3 pt-2">
              <EstPriceImpact />
            </div>
          ) : null}
          <div className={`flex pt-4`}>
            {ipAllowed ? (
              <Button
                disabled={disabledTradeButton}
                onClick={onSubmit}
                className={`bg-th-bkg-2 border ${
                  !disabledTradeButton
                    ? side === 'buy'
                      ? 'border-th-green hover:border-th-green-dark text-th-green hover:bg-th-green-dark'
                      : 'border-th-red hover:border-th-red-dark text-th-red hover:bg-th-red-dark'
                    : 'border border-th-bkg-4'
                } hover:text-th-fgd-1 flex-grow`}
              >
                {submitting ? (
                  <div className="w-full">
                    <Loading className="mx-auto" />
                  </div>
                ) : sizeTooLarge ? (
                  'Size Too Large'
                ) : side === 'buy' ? (
                  market instanceof PerpMarket ? (
                    <>
                      {baseSize > 0 ? 'Long ' + baseSize : 'Long '}{' '}
                      <span className="whitespace-nowrap">
                        {marketConfig.name}
                      </span>
                    </>
                  ) : (
                    `${baseSize > 0 ? 'Buy ' + baseSize : 'Buy '} ${
                      marketConfig.baseSymbol
                    }`
                  )
                ) : market instanceof PerpMarket ? (
                  sizeTooLarge ? (
                    'Size Too Large'
                  ) : (
                    <>
                      {baseSize > 0 ? 'Short ' + baseSize : 'Short '}{' '}
                      <span className="whitespace-nowrap">
                        {marketConfig.name}
                      </span>
                    </>
                  )
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
          <div className="flex text-xs text-th-fgd-4 pt-4">
            <MarketFee />
          </div>
        </div>
      </div>
    </div>
  )
}
