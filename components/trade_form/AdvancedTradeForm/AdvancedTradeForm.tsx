import { useEffect, useMemo, useRef, useState } from 'react'
import useIpAddress from 'hooks/useIpAddress'
import {
  clamp,
  getMarketIndexBySymbol,
  getTokenBySymbol,
  I80F48,
  nativeI80F48ToUi,
  PerpMarket,
  PerpOrderType,
  ZERO_I80F48,
} from '@blockworks-foundation/mango-client'
import { notify } from 'utils/notifications'
import { calculateTradePrice, getDecimalCount } from 'utils'
import { floorToDecimal } from 'utils/index'
import useMangoStore, { Orderbook } from 'stores/useMangoStore'
import TradeType from 'components/trade_form/TradeType'
import Input from 'components/Input'
import { Market } from '@project-serum/serum'
import Big from 'big.js'
import OrderSideTabs from 'components/trade_form/OrderSideTabs'
import { ElementTitle } from 'components/styles'
import ButtonGroup from 'components/ButtonGroup'
import { useViewport } from 'hooks/useViewport'
import { breakpoints } from 'components/TradePageGrid'
import EstPriceImpact from 'components/trade_form/EstPriceImpact'
import useFees from 'hooks/useFees'
import { useTranslation } from 'next-i18next'
import useSrmAccount from 'hooks/useSrmAccount'
import useLocalStorageState, {
  useLocalStorageStringState,
} from 'hooks/useLocalStorageState'
import InlineNotification from 'components/InlineNotification'
import { DEFAULT_SPOT_MARGIN_KEY } from 'components/SettingsModal'
import { useWallet } from '@solana/wallet-adapter-react'
import {
  SlippageWarning,
  SubmitButton,
  PerpMarketMaxSlippage,
  EditMaxSlippage,
  Fees,
} from 'components/trade_form/AdvancedTradeForm/index'
import { CheckBoxes } from './CheckBoxes'

const MAX_SLIPPAGE_KEY = 'maxSlippage'

export const TRIGGER_ORDER_TYPES = [
  'Stop Loss',
  'Take Profit',
  'Stop Limit',
  'Take Profit Limit',
]

export type Options = {
  postOnlySlide: boolean
  postOnly: boolean
  ioc: boolean
  reduceOnly: boolean
  spotMargin: boolean
}

export const AdvancedTradeForm: React.FC<{ initLeverage?: number }> = ({
  initLeverage,
}) => {
  const { t } = useTranslation('common')
  const set = useMangoStore((s) => s.set)
  const { ipAllowed, spotAllowed } = useIpAddress()
  const { wallet, connected } = useWallet()
  const actions = useMangoStore((s) => s.actions)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const walletTokens = useMangoStore((s) => s.wallet.tokens)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const market = useMangoStore((s) => s.selectedMarket.current)
  const isPerpMarket = market instanceof PerpMarket
  const [defaultSpotMargin] = useLocalStorageState(
    DEFAULT_SPOT_MARGIN_KEY,
    false
  )
  const [positionSizePercent, setPositionSizePercent] = useState('')
  const [insufficientSol, setInsufficientSol] = useState(false)
  const { takerFee, makerFee } = useFees()
  const { totalMsrm } = useSrmAccount()

  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const marketIndex = getMarketIndexBySymbol(
    groupConfig,
    marketConfig.baseSymbol
  )
  let perpAccount
  if (isPerpMarket && mangoAccount) {
    perpAccount = mangoAccount.perpAccounts[marketIndex]
  }

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

  const isTriggerOrder = TRIGGER_ORDER_TYPES.includes(tradeType)

  const [options, setOptions] = useState<Options>({
    postOnlySlide: false,
    postOnly: false,
    ioc: false,
    reduceOnly: false,
    spotMargin: defaultSpotMargin,
  })

  const orderBookRef = useRef(useMangoStore.getState().selectedMarket.orderBook)
  const orderbook = orderBookRef.current
  const [maxSlippage, setMaxSlippage] = useLocalStorageStringState(
    MAX_SLIPPAGE_KEY,
    '0.025'
  )
  const [maxSlippagePercentage, setMaxSlippagePercentage] = useState<
    number | null
  >(null)
  const [editMaxSlippage, setEditMaxSlippage] = useState(false)

  const saveMaxSlippage = (slippage) => {
    setMaxSlippage(clamp(slippage / 100, 0, 1).toString())
    setEditMaxSlippage(false)
  }

  useEffect(() => {
    if (maxSlippage && !maxSlippagePercentage) {
      setMaxSlippagePercentage(clamp(parseFloat(maxSlippage), 0, 1) * 100)
    }
  }, [setMaxSlippagePercentage, maxSlippage, maxSlippagePercentage])

  useEffect(
    () =>
      useMangoStore.subscribe(
        (state) => state.selectedMarket.orderBook,
        (orderBook) => (orderBookRef.current = orderBook)
      ),
    []
  )

  useEffect(() => {
    const walletSol = walletTokens.find((a) => a.config.symbol === 'SOL')
    walletSol && connected
      ? setInsufficientSol(walletSol.uiBalance < 0.01)
      : null
  }, [connected, walletTokens])

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

  const { max, deposits, borrows, spotMax, reduceMax } = useMemo(() => {
    const defaultValues = {
      max: ZERO_I80F48,
      deposits: ZERO_I80F48,
      borrows: ZERO_I80F48,
      spotMax: 0,
      reduceMax: 0,
    }
    if (!mangoAccount || !mangoGroup || !mangoCache || !market) {
      return defaultValues
    }
    const priceOrDefault = price
      ? I80F48.fromNumber(price)
      : mangoGroup.getPrice(marketIndex, mangoCache)

    let spotMax
    if (marketConfig.kind === 'spot') {
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

      spotMax =
        side === 'buy'
          ? availableBalance / priceOrDefault.toNumber()
          : availableBalance
    }

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

    let reduceMax
    if (market && market instanceof PerpMarket) {
      reduceMax =
        Math.abs(market?.baseLotsToNumber(perpAccount?.basePosition)) || 0
    } else {
      reduceMax = 0
    }

    if (maxQuote.toNumber() <= 0) return defaultValues
    // multiply the maxQuote by a scaler value to account for
    // srm fees or rounding issues in getMaxLeverageForMarket
    const maxScaler = market instanceof PerpMarket ? 0.99 : 0.95
    const scaledMax = price
      ? (maxQuote.toNumber() * maxScaler) / price
      : (maxQuote.toNumber() * maxScaler) /
        mangoGroup.getPrice(marketIndex, mangoCache).toNumber()

    return { max: scaledMax, deposits, borrows, spotMax, reduceMax }
  }, [
    mangoAccount,
    mangoGroup,
    mangoCache,
    marketIndex,
    market,
    side,
    price,
    options.reduceOnly,
    groupConfig,
  ])

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
        (state) => state.selectedMarket.markPrice,
        (markPrice) => (markPriceRef.current = markPrice as number)
      ),
    []
  )

  let minOrderSize = '0'
  if (market instanceof Market && market.minOrderSize) {
    minOrderSize = market.minOrderSize.toString()
  } else if (market instanceof PerpMarket) {
    const baseDecimals = marketConfig.baseDecimals
    minOrderSize = new Big(market.baseLotSize)
      .div(new Big(10).pow(baseDecimals))
      .toString()
  }

  const sizeDecimalCount = getDecimalCount(minOrderSize)

  let tickSize = 1
  if (market instanceof Market) {
    tickSize = market.tickSize
  } else if (isPerpMarket) {
    const baseDecimals = marketConfig.baseDecimals
    const quoteDecimals = marketConfig.quoteDecimals

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
    setPositionSizePercent('')
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
    setPositionSizePercent('')
  }

  const onTradeTypeChange = (tradeType) => {
    setTradeType(tradeType)
    let _reduceOnly = false
    let _ioc = options.ioc
    if (TRIGGER_ORDER_TYPES.includes(tradeType)) {
      _reduceOnly = true
    }
    if (['Market', 'Stop Loss', 'Take Profit'].includes(tradeType)) {
      _ioc = true
      if (isTriggerOrder) {
        setPrice(triggerPrice)
      }
    } else {
      const priceOnBook = side === 'buy' ? orderbook?.asks : orderbook?.bids
      if (priceOnBook && priceOnBook.length > 0 && priceOnBook[0].length > 0) {
        setPrice(priceOnBook[0][0])
      }
      _ioc = false
    }
    setOptions({
      ...options,
      reduceOnly: _reduceOnly,
      postOnly: false,
      ioc: _ioc,
    })
  }

  const handleSetPositionSize = (percent, spotMargin, reduceOnly) => {
    setPositionSizePercent(percent)
    const baseSizeMax = reduceOnly
      ? reduceMax
      : spotMargin || marketConfig.kind === 'perp'
      ? max
      : spotMax
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
    if (!size || !total) return 0
    return (size / total) * 100
  }

  const roundedDeposits = parseFloat(deposits.toFixed(sizeDecimalCount))
  const roundedBorrows = parseFloat(borrows.toFixed(sizeDecimalCount))

  const closeDepositString =
    percentToClose(baseSize, roundedDeposits) > 100
      ? t('close-open-short', {
          size: (+baseSize - roundedDeposits).toFixed(sizeDecimalCount),
          symbol: marketConfig.baseSymbol,
        })
      : `${percentToClose(baseSize, roundedDeposits).toFixed(0)}% ${t(
          'close-position'
        ).toLowerCase()}`

  const closeBorrowString =
    percentToClose(baseSize, roundedBorrows) > 100
      ? t('close-open-long', {
          size: (+baseSize - roundedBorrows).toFixed(sizeDecimalCount),
          symbol: marketConfig.baseSymbol,
        })
      : `${percentToClose(baseSize, roundedBorrows).toFixed(0)}% ${t(
          'close-position'
        ).toLowerCase()}`

  // The reference price is the book mid if book is double sided; else mark price
  const bb = orderbook?.bids?.length > 0 && Number(orderbook.bids[0][0])
  const ba = orderbook?.asks?.length > 0 && Number(orderbook.asks[0][0])
  const referencePrice = bb && ba ? (bb + ba) / 2 : markPrice

  let priceImpact
  let estimatedPrice = price
  if (tradeType === 'Market' && baseSize > 0) {
    const estimateMarketPrice = (
      orderBook: Orderbook,
      size: number,
      side: 'buy' | 'sell'
    ): number => {
      const orders = side === 'buy' ? orderBook.asks : orderBook.bids
      let accSize = 0
      let accPrice = 0
      for (const [orderPrice, orderSize] of orders) {
        const remainingSize = size - accSize
        if (remainingSize <= orderSize) {
          accSize += remainingSize
          accPrice += remainingSize * orderPrice
          break
        }
        accSize += orderSize
        accPrice += orderSize * orderPrice
      }

      if (!accSize) {
        console.log('Orderbook empty no market price available')
        return markPrice
      }

      return accPrice / accSize
    }

    const estimatedSize =
      perpAccount && options.reduceOnly && market instanceof PerpMarket
        ? Math.abs(market.baseLotsToNumber(perpAccount.basePosition))
        : baseSize
    estimatedPrice = estimateMarketPrice(orderbook, estimatedSize || 0, side)

    const slippageAbs =
      estimatedSize > 0 ? Math.abs(estimatedPrice - referencePrice) : 0
    const slippageRel = slippageAbs / referencePrice

    const takerFeeRel = takerFee
    const takerFeeAbs = estimatedSize
      ? takerFeeRel * estimatedPrice * estimatedSize
      : 0

    priceImpact = {
      slippage: [slippageAbs, slippageRel],
      takerFee: [takerFeeAbs, takerFeeRel],
    }
  }

  async function onSubmit() {
    if (!price && isLimitOrder && !options.postOnlySlide) {
      notify({
        title: t('missing-price'),
        type: 'error',
      })
      return
    } else if (!baseSize) {
      notify({
        title: t('missing-size'),
        type: 'error',
      })
      return
    } else if (!triggerPrice && isTriggerOrder) {
      notify({
        title: t('missing-trigger'),
        type: 'error',
      })
      return
    }

    const mangoClient = useMangoStore.getState().connection.client
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const askInfo =
      useMangoStore.getState().accountInfos[marketConfig.asksKey.toString()]
    const bidInfo =
      useMangoStore.getState().accountInfos[marketConfig.bidsKey.toString()]
    const referrerPk = useMangoStore.getState().referrerPk

    if (!wallet || !mangoGroup || !mangoAccount || !market) return

    try {
      const orderPrice = calculateTradePrice(
        marketConfig.kind,
        tradeType,
        orderbook,
        baseSize,
        side,
        price || markPrice,
        triggerPrice
      )

      if (!orderPrice) {
        notify({
          title: t('price-unavailable'),
          description: t('try-again'),
          type: 'error',
        })
        return
      }

      // TODO: this has a race condition when switching between markets or buy & sell
      // spot market orders will sometimes not be ioc but limit
      const orderType = options.ioc
        ? 'ioc'
        : options.postOnly
        ? 'postOnly'
        : 'limit'

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
          wallet.adapter,
          side,
          orderPrice,
          baseSize,
          orderType,
          undefined,
          totalMsrm > 0
        )
        actions.reloadOrders()
      } else {
        let perpOrderType: PerpOrderType = orderType
        let perpOrderPrice: number = orderPrice

        if (isMarketOrder) {
          if (options.postOnlySlide) {
            perpOrderType = 'postOnlySlide'
          } else if (tradeType === 'Market' && maxSlippage) {
            perpOrderType = 'ioc'
            if (side === 'buy') {
              perpOrderPrice = markPrice * (1 + parseFloat(maxSlippage))
            } else {
              perpOrderPrice = Math.max(
                market.tickSize,
                markPrice * (1 - parseFloat(maxSlippage))
              )
            }
          } else {
            perpOrderType = 'market'
          }
        }

        if (isTriggerOrder) {
          txid = await mangoClient.addPerpTriggerOrder(
            mangoGroup,
            mangoAccount,
            market,
            wallet.adapter,
            perpOrderType,
            side,
            perpOrderPrice,
            baseSize,
            triggerCondition,
            Number(triggerPrice),
            true // reduceOnly
          )
          actions.reloadOrders()
        } else {
          txid = await mangoClient.placePerpOrder2(
            mangoGroup,
            mangoAccount,
            market,
            wallet.adapter,
            side,
            perpOrderPrice,
            baseSize,
            {
              orderType: perpOrderType,
              clientOrderId: Date.now(),
              bookSideInfo: side === 'buy' ? askInfo : bidInfo, // book side used for ConsumeEvents
              reduceOnly: options.reduceOnly,
              referrerMangoAccountPk: referrerPk ? referrerPk : undefined,
            }
          )
        }
      }
      if (txid instanceof Array) {
        for (const [index, id] of txid.entries()) {
          notify({
            title:
              index === 0 ? 'Transaction successful' : t('successfully-placed'),
            txid: id,
          })
        }
      } else {
        notify({ title: t('successfully-placed'), txid })
      }

      setPrice('')
      onSetBaseSize('')
    } catch (e) {
      notify({
        title: t('order-error'),
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
      console.error(e)
    } finally {
      actions.reloadMangoAccount()
      actions.loadMarketFills()
    }
  }

  /*
  const roundedMax = (
    Math.round(max / parseFloat(minOrderSize)) * parseFloat(minOrderSize)
  ).toFixed(sizeDecimalCount)
  */

  const sizeTooLarge = false /*
    spotMargin || marketConfig.kind === 'perp'
      ? baseSize > roundedMax
      : baseSize > spotMax*/

  const disabledTradeButton =
    (!price && isLimitOrder && !options.postOnlySlide) ||
    !baseSize ||
    !connected ||
    !mangoAccount ||
    sizeTooLarge ||
    editMaxSlippage

  const canTrade = ipAllowed || (market instanceof Market && spotAllowed)

  // If stop loss or take profit, walk up the book and alert user if slippage will be high
  let warnUserSlippage = false
  if (isMarketOrder && isTriggerOrder) {
    const bookSide = side === 'buy' ? orderbook.asks : orderbook.bids
    let base = 0
    let quote = 0
    for (const [p, q] of bookSide) {
      base += q
      quote += p * q

      if (base >= baseSize) {
        break
      }
    }

    if (base < baseSize || (baseSize && base === 0)) {
      warnUserSlippage = true
    } else if (baseSize > 0) {
      // only check if baseSize nonzero because this implies base nonzero
      const avgPrice = quote / base
      warnUserSlippage = Math.abs(avgPrice / referencePrice - 1) > 0.025
    }
  }

  return (
    <div>
      <ElementTitle className="hidden md:flex">
        {marketConfig.name}
        <span className="ml-2 rounded border border-th-primary px-1 py-0.5 text-xs text-th-primary">
          {initLeverage}x
        </span>
      </ElementTitle>
      {insufficientSol ? (
        <div className="mb-3 text-left">
          <InlineNotification desc={t('add-more-sol')} type="warning" />
        </div>
      ) : null}
      <OrderSideTabs onChange={onChangeSide} side={side} />
      <div className="grid grid-cols-12 gap-x-1.5 gap-y-0.5 text-left">
        <div className="col-span-12 md:col-span-6">
          <label className="text-xxs text-th-fgd-3">{t('type')}</label>
          <TradeType
            onChange={onTradeTypeChange}
            value={tradeType}
            offerTriggers={isPerpMarket}
          />
        </div>
        <div className="col-span-12 md:col-span-6">
          {!isTriggerOrder ? (
            <>
              <label className="text-xxs text-th-fgd-3">{t('price')}</label>
              <Input
                type="number"
                min="0"
                step={tickSize}
                onChange={(e) => onSetPrice(e.target.value)}
                value={
                  options.postOnlySlide && tradeType === 'Limit' ? '' : price
                }
                disabled={
                  isMarketOrder ||
                  (options.postOnlySlide && tradeType === 'Limit')
                }
                placeholder={tradeType === 'Market' ? markPrice : ''}
                prefix={
                  <>
                    {options.postOnlySlide && tradeType === 'Limit' ? null : (
                      <img
                        src={`/assets/icons/${groupConfig.quoteSymbol.toLowerCase()}.svg`}
                        width="16"
                        height="16"
                      />
                    )}
                  </>
                }
              />
            </>
          ) : (
            <>
              <label className="text-xxs text-th-fgd-3">
                {t('trigger-price')}
              </label>
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
              <label className="text-xxs text-th-fgd-3">
                {t('limit-price')}
              </label>
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
          <label className="text-xxs text-th-fgd-3">{t('size')}</label>
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
          <label className="text-xxs text-th-fgd-3">{t('quantity')}</label>
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
        <div className="col-span-12 mt-1">
          <ButtonGroup
            activeValue={positionSizePercent}
            onChange={(p) =>
              handleSetPositionSize(p, options.spotMargin, options.reduceOnly)
            }
            unit="%"
            values={
              isMobile
                ? ['10', '25', '50', '100']
                : ['10', '25', '50', '75', '100']
            }
          />
          {marketConfig.kind === 'perp' ? (
            side === 'sell' ? (
              roundedDeposits > 0 ? (
                <div className="mt-2 text-xs tracking-normal text-th-fgd-4">
                  <span>{closeDepositString}</span>
                </div>
              ) : null
            ) : roundedBorrows > 0 ? (
              <div className="mt-2 text-xs tracking-normal text-th-fgd-4">
                <span>{closeBorrowString}</span>
              </div>
            ) : null
          ) : null}
          <div className="flex-wrap sm:flex">
            <CheckBoxes
              options={options}
              setOptions={setOptions}
              isLimitOrder={isLimitOrder}
              isTriggerOrder={isTriggerOrder}
              positionSizePercent={positionSizePercent}
              handleSetPositionSize={handleSetPositionSize}
            />
          </div>
          <SlippageWarning show={warnUserSlippage} />
          <SubmitButton
            canTrade={canTrade}
            isPerpMarket={isPerpMarket}
            onSubmit={onSubmit}
            disabled={disabledTradeButton}
            sizeTooLarge={sizeTooLarge}
            side={side}
            baseSize={baseSize}
          />
          {tradeType === 'Market' && priceImpact ? (
            <div className="col-span-12 mt-4 md:col-span-10 md:col-start-3">
              {editMaxSlippage ? (
                <EditMaxSlippage
                  isMobile={isMobile}
                  onSave={() => saveMaxSlippage(maxSlippagePercentage)}
                  maxSlippagePercentage={maxSlippagePercentage}
                  setMaxSlippagePercentage={setMaxSlippagePercentage}
                />
              ) : (
                <>
                  <PerpMarketMaxSlippage
                    show={isPerpMarket}
                    maxSlippage={maxSlippage}
                    onClickEdit={() => setEditMaxSlippage(true)}
                  />
                  <EstPriceImpact priceImpact={priceImpact} />
                </>
              )}
            </div>
          ) : (
            <Fees makerFee={makerFee} takerFee={takerFee} />
          )}
        </div>
      </div>
    </div>
  )
}
