import { useState, useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import useIpAddress from '../hooks/useIpAddress'
import {
  getTokenBySymbol,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import { notify } from '../utils/notifications'
import { calculateTradePrice, getDecimalCount, sleep } from '../utils'
import FloatingElement from './FloatingElement'
import { floorToDecimal } from '../utils/index'
import useMangoStore, { mangoClient } from '../stores/useMangoStore'
import Button from './Button'
import TradeType from './TradeType'
import Input from './Input'
import Switch from './Switch'
import { Market } from '@project-serum/serum'
import Big from 'big.js'
import MarketFee from './MarketFee'
import LeverageSlider from './LeverageSlider'
import Loading from './Loading'

const StyledRightInput = styled(Input)`
  border-left: 1px solid transparent;
`

export default function TradeForm() {
  const set = useMangoStore((s) => s.set)
  const { ipAllowed } = useIpAddress()
  const connected = useMangoStore((s) => s.wallet.connected)
  const actions = useMangoStore((s) => s.actions)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const market = useMangoStore((s) => s.selectedMarket.current)
  const { side, baseSize, quoteSize, price, tradeType } = useMangoStore(
    (s) => s.tradeForm
  )

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
    setQuoteSize(rawQuoteSize.toFixed(6))
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
  }

  const onTradeTypeChange = (tradeType) => {
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
      sleep(500).then(() => {
        actions.reloadMangoAccount()
        actions.updateOpenOrders()
      })
      setSubmitting(false)
    }
  }

  const disabledTradeButton =
    (!price && tradeType === 'Limit') ||
    !baseSize ||
    !connected ||
    submitting ||
    !mangoAccount

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
              onChange={onTradeTypeChange}
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
        </div>
        <div className={`flex pt-4`}>
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
    </FloatingElement>
  )
}
