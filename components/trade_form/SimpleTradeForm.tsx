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
import { floorToDecimal, capitalize } from '../../utils/index'
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
import EstPriceImpact from './EstPriceImpact'
import { useTranslation } from 'next-i18next'
import { useWallet } from '@solana/wallet-adapter-react'

export default function SimpleTradeForm({ initLeverage }) {
  const { t } = useTranslation('common')
  const set = useMangoStore((s) => s.set)
  const { ipAllowed, spotAllowed } = useIpAddress()
  const { wallet, connected } = useWallet()
  const actions = useMangoStore((s) => s.actions)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const walletTokens = useMangoStore((s) => s.wallet.tokens)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
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
  const [insufficientSol, setinsufficientSol] = useState(false)

  const orderBookRef = useRef(useMangoStore.getState().selectedMarket.orderBook)
  const orderbook = orderBookRef.current

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
    walletSol ? setinsufficientSol(walletSol.uiBalance < 0.01) : null
  }, [walletTokens])

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
        s.tradeForm.triggerPrice = parseFloat(price)
      } else {
        s.tradeForm.triggerPrice = price
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
        (state) => state.selectedMarket.markPrice,
        (markPrice) => (markPriceRef.current = markPrice as number)
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
    }

    const mangoClient = useMangoStore.getState().connection.client
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const askInfo =
      useMangoStore.getState().accountInfos[marketConfig.asksKey.toString()]
    const bidInfo =
      useMangoStore.getState().accountInfos[marketConfig.bidsKey.toString()]

    if (!wallet?.adapter || !mangoGroup || !mangoAccount || !market) return
    setSubmitting(true)

    try {
      const orderPrice = calculateTradePrice(
        marketConfig.kind,
        tradeType,
        orderbook,
        baseSize,
        side,
        price
      )

      if (!orderPrice) {
        notify({
          title: t('price-unavailable'),
          description: t('try-again'),
          type: 'error',
        })
        return
      }

      const orderType = ioc ? 'ioc' : postOnly ? 'postOnly' : 'limit'
      let txid
      if (market instanceof Market) {
        txid = await mangoClient.placeSpotOrder(
          mangoGroup,
          mangoAccount,
          mangoGroup.mangoCache,
          market,
          wallet?.adapter,
          side,
          orderPrice,
          baseSize,
          orderType
        )
      } else {
        txid = await mangoClient.placePerpOrder2(
          mangoGroup,
          mangoAccount,
          market,
          wallet?.adapter,
          side,
          orderPrice,
          baseSize,
          {
            orderType,
            bookSideInfo: side === 'buy' ? askInfo : bidInfo,
          }
        )
      }
      notify({ title: t('successfully-placed'), txid })
      setPrice('')
      onSetBaseSize('')
    } catch (e) {
      notify({
        title: t('order-error'),
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
    if (!mangoAccount || !mangoGroup || !mangoCache || !market)
      return { max: 0 }
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

  if (!deposits || !borrows) return null

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
          size: (+baseSize - roundedDeposits).toFixed(sizeDecimalCount),
          symbol: marketConfig.baseSymbol,
        })
      : `${percentToClose(baseSize, roundedBorrows).toFixed(0)}% ${t(
          'close-position'
        ).toLowerCase()}`

  const disabledTradeButton =
    (!price && tradeType === 'Limit') ||
    !baseSize ||
    !connected ||
    submitting ||
    !mangoAccount ||
    insufficientSol

  const hideProfitStop =
    (side === 'sell' && baseSize === roundedDeposits) ||
    (side === 'buy' && baseSize === roundedBorrows)

  const canTrade = ipAllowed || (market instanceof Market && spotAllowed)

  return (
    <div className="flex h-full flex-col">
      <ElementTitle>
        {marketConfig.name}
        <span className="ml-2 rounded border border-th-primary px-1 py-0.5 text-xs text-th-primary">
          {initLeverage}x
        </span>
      </ElementTitle>
      <OrderSideTabs isSimpleForm onChange={setSide} side={side} />
      <div className="grid grid-cols-12 gap-2 text-left">
        <div className="col-span-6">
          <label className="text-xxs text-th-fgd-3">{t('type')}</label>
          <ButtonGroup
            activeValue={tradeType}
            className="h-10"
            onChange={(p) => onTradeTypeChange(p)}
            values={['Limit', 'Market']}
          />
        </div>
        <div className="col-span-6">
          <label className="text-xxs text-th-fgd-3">{t('price')}</label>
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
        <div className="col-span-12">
          <div className="-mt-1">
            <ButtonGroup
              activeValue={positionSizePercent}
              onChange={(p) => handleSetPositionSize(p)}
              unit="%"
              values={['10', '25', '50', '75', '100']}
            />
          </div>
          {side === 'sell' ? (
            <div className="mt-2 text-xs tracking-normal text-th-fgd-3">
              <span>{roundedDeposits > 0 ? closeDepositString : null}</span>
            </div>
          ) : (
            <div className="mt-2 text-xs tracking-normal text-th-fgd-3">
              <span>{roundedBorrows > 0 ? closeBorrowString : null}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            {!hideProfitStop ? (
              <div
                className={`${
                  showStopForm ? 'bg-th-bkg-4' : 'bg-th-bkg-3'
                } mt-1 w-1/2 rounded-md p-2`}
              >
                <Checkbox
                  checked={showStopForm}
                  onChange={(e) => setShowStopForm(e.target.checked)}
                >
                  {t('set-stop-loss')}
                </Checkbox>
              </div>
            ) : null}
            {!hideProfitStop ? (
              <div
                className={`${
                  showTakeProfitForm ? 'bg-th-bkg-4' : 'bg-th-bkg-3'
                } mt-1 w-1/2 rounded-md p-2`}
              >
                <Checkbox
                  checked={showTakeProfitForm}
                  onChange={(e) => setShowTakeProfitForm(e.target.checked)}
                >
                  {t('set-take-profit')}
                </Checkbox>
              </div>
            ) : null}
          </div>
        </div>
        {showStopForm && !hideProfitStop ? (
          <>
            <div className="col-span-12">
              <label className="text-xxs text-th-fgd-3">
                {t('stop-price')}
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
            </div>
            <div className="col-span-12 -mt-1">
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
            <div className="col-span-12">
              <label className="text-left text-xs text-th-fgd-3">
                {t('profit-price')}
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
            </div>
            <div className="col-span-12 -mt-1">
              <ButtonGroup
                activeValue={stopSizePercent}
                onChange={(p) => setStopSizePercent(p)}
                values={['5%', '10%', '15%', '20%', '25%']}
              />
            </div>
          </>
        ) : null}
        <div className="col-span-12 flex pt-2">
          {tradeType === 'Limit' ? (
            <>
              <div className="mr-4">
                <Tooltip
                  delay={250}
                  placement="left"
                  content={t('tooltip-post')}
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
                  content={t('tooltip-ioc')}
                >
                  <div className="flex items-center text-xs text-th-fgd-3">
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
            <Tooltip delay={250} placement="left" content={t('tooltip-reduce')}>
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
              content={t('tooltip-enable-margin')}
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
        {tradeType === 'Market' ? (
          <div className="col-span-12">
            <EstPriceImpact />
          </div>
        ) : null}
        <div className={`col-span-12 flex pt-2`}>
          {canTrade ? (
            <Button
              disabled={disabledTradeButton}
              onClick={onSubmit}
              className={`${
                !disabledTradeButton
                  ? 'border border-th-green bg-th-bkg-2 hover:border-th-green-dark'
                  : 'border border-th-bkg-4'
              } flex-grow text-th-green hover:bg-th-green-dark hover:text-th-fgd-1`}
            >
              {submitting ? (
                <div className="w-full">
                  <Loading className="mx-auto" />
                </div>
              ) : side.toLowerCase() === 'buy' ? (
                market instanceof PerpMarket ? (
                  `${
                    baseSize > 0
                      ? `${capitalize(t('long'))} ` + baseSize
                      : `${capitalize(t('long'))} `
                  } ${marketConfig.name}`
                ) : (
                  `${
                    baseSize > 0 ? `${t('buy')} ` + baseSize : `${t('buy')} `
                  } ${marketConfig.baseSymbol}`
                )
              ) : market instanceof PerpMarket ? (
                `${
                  baseSize > 0
                    ? `${capitalize(t('short'))} ` + baseSize
                    : `${capitalize(t('short'))} `
                } ${marketConfig.name}`
              ) : (
                `${
                  baseSize > 0 ? `${t('sell')} ` + baseSize : `${t('sell')} `
                } ${marketConfig.baseSymbol}`
              )}
            </Button>
          ) : (
            <div className="flex-grow">
              <Tooltip content={t('country-not-allowed-tooltip')}>
                <div className="flex">
                  <Button disabled className="flex-grow">
                    <span>{t('country-not-allowed')}</span>
                  </Button>
                </div>
              </Tooltip>
            </div>
          )}
        </div>
        {insufficientSol ? (
          <div className="tiny-text mt-1 -mb-3 text-center text-th-red">
            You must leave enough SOL in your wallet to pay for the transaction
          </div>
        ) : null}
        <div className="col-span-12 flex pt-2 text-xs text-th-fgd-4">
          <MarketFee />
        </div>
      </div>
    </div>
  )
}
