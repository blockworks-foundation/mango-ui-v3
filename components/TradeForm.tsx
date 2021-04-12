import { useState, useEffect, useRef } from 'react'
import { Switch } from 'antd'
import useMarket from '../hooks/useMarket'
import useIpAddress from '../hooks/useIpAddress'
import useConnection from '../hooks/useConnection'
import { PublicKey } from '@solana/web3.js'
import { IDS } from '@blockworks-foundation/mango-client'
import { notify } from '../utils/notifications'
import { placeAndSettle } from '../utils/mango'
import { calculateMarketPrice, getDecimalCount } from '../utils'
import FloatingElement from './FloatingElement'
import { roundToDecimal } from '../utils/index'
import useMangoStore from '../stores/useMangoStore'
import Button from './Button'
import TradeType from './TradeType'
import NewInput from './Input'

export default function TradeForm({
  setChangeOrderRef,
}: {
  setChangeOrderRef?: (
    ref: ({ size, price }: { size?: number; price?: number }) => void
  ) => void
}) {
  const { baseCurrency, quoteCurrency, market, marketAddress } = useMarket()
  const set = useMangoStore((s) => s.set)
  const { connected } = useMangoStore((s) => s.wallet)
  const { connection, cluster } = useConnection()
  const { side, baseSize, quoteSize, price, tradeType } = useMangoStore(
    (s) => s.tradeForm
  )
  const { ipAllowed } = useIpAddress()
  const [postOnly, setPostOnly] = useState(false)
  const [ioc, setIoc] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const orderBookRef = useRef(useMangoStore.getState().market.orderBook)
  const orderbook = orderBookRef.current[0]
  useEffect(
    () =>
      useMangoStore.subscribe(
        (orderBook) => (orderBookRef.current = orderBook as any[]),
        (state) => state.market.orderBook
      ),
    []
  )

  const setSide = (side) =>
    set((s) => {
      s.tradeForm.side = side
    })

  const setBaseSize = (baseSize) =>
    set((s) => {
      s.tradeForm.baseSize = parseFloat(baseSize)
    })

  const setQuoteSize = (quoteSize) =>
    set((s) => {
      s.tradeForm.quoteSize = parseFloat(quoteSize)
    })

  const setPrice = (price) =>
    set((s) => {
      s.tradeForm.price = parseFloat(price)
    })

  const setTradeType = (type) =>
    set((s) => {
      s.tradeForm.tradeType = type
    })

  const markPriceRef = useRef(useMangoStore.getState().market.markPrice)
  const markPrice = markPriceRef.current
  useEffect(
    () =>
      useMangoStore.subscribe(
        (markPrice) => (markPriceRef.current = markPrice as number),
        (state) => state.market.markPrice
      ),
    []
  )

  const sizeDecimalCount =
    market?.minOrderSize && getDecimalCount(market.minOrderSize)
  const priceDecimalCount = market?.tickSize && getDecimalCount(market.tickSize)

  useEffect(() => {
    setChangeOrderRef && setChangeOrderRef(doChangeOrder)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setChangeOrderRef])

  const onSetBaseSize = (baseSize: number | undefined) => {
    setBaseSize(baseSize)
    if (!baseSize) {
      setQuoteSize(undefined)
      return
    }
    const usePrice = price || markPrice
    if (!usePrice) {
      setQuoteSize(undefined)
      return
    }
    const rawQuoteSize = baseSize * usePrice
    const quoteSize = baseSize && roundToDecimal(rawQuoteSize, sizeDecimalCount)
    setQuoteSize(quoteSize)
  }

  const onSetQuoteSize = (quoteSize: number | undefined) => {
    setQuoteSize(quoteSize)
    if (!quoteSize) {
      setBaseSize(undefined)
      return
    }
    const usePrice = price || markPrice
    if (!usePrice) {
      setBaseSize(undefined)
      return
    }
    const rawBaseSize = quoteSize / usePrice
    const baseSize = quoteSize && roundToDecimal(rawBaseSize, sizeDecimalCount)
    setBaseSize(baseSize)
  }

  const doChangeOrder = ({
    size,
    price,
  }: {
    size?: number
    price?: number
  }) => {
    const formattedSize = size && roundToDecimal(size, sizeDecimalCount)
    const formattedPrice = price && roundToDecimal(price, priceDecimalCount)
    formattedSize && onSetBaseSize(formattedSize)
    formattedPrice && setPrice(formattedPrice)
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
      console.warn('Missing price')
      notify({
        message: 'Missing price',
        type: 'error',
      })
      return
    } else if (!baseSize) {
      console.warn('Missing size')
      notify({
        message: 'Missing size',
        type: 'error',
      })
      return
    }

    const marginAccount = useMangoStore.getState().selectedMarginAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const wallet = useMangoStore.getState().wallet.current

    if (!mangoGroup || !marketAddress || !marginAccount || !market) return
    setSubmitting(true)

    try {
      let calculatedPrice
      if (tradeType === 'Market') {
        calculatedPrice =
          side === 'buy'
            ? calculateMarketPrice(orderbook.asks, baseSize, side)
            : calculateMarketPrice(orderbook.bids, baseSize, side)
      }

      await placeAndSettle(
        connection,
        new PublicKey(IDS[cluster].mango_program_id),
        mangoGroup,
        marginAccount,
        market,
        wallet,
        side,
        calculatedPrice ?? price,
        baseSize,
        ioc ? 'ioc' : postOnly ? 'postOnly' : 'limit'
      )
      console.log('Successfully placed trade!')

      setPrice(undefined)
      onSetBaseSize(undefined)
    } catch (e) {
      notify({
        message: 'Error placing order',
        description: e.message,
        type: 'error',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleTradeTypeChange = (tradeType) => {
    setTradeType(tradeType)
    if (tradeType === 'Market') {
      setIoc(true)
      setPrice('')
    } else {
      const limitPrice =
        side === 'buy' ? orderbook.asks[0][0] : orderbook.bids[0][0]
      setPrice(limitPrice)
      setIoc(false)
    }
  }

  return (
    <FloatingElement>
      <div>
        <div className={`flex text-base text-th-fgd-4`}>
          <button
            onClick={() => setSide('buy')}
            className={`flex-1 outline-none focus:outline-none`}
          >
            <div
              className={`hover:text-th-primary pb-1
                ${
                  side === 'buy' &&
                  `text-th-green hover:text-th-green border-b-2 border-th-green`
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
              className={`hover:text-th-primary pb-1
                ${
                  side === 'sell' &&
                  `text-th-red hover:text-th-red border-b-2 border-th-red`
                }
              `}
            >
              Sell
            </div>
          </button>
        </div>
        <NewInput.Group className="mt-4">
          <NewInput
            type="number"
            step={market?.tickSize || 1}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
            value={price}
            disabled={tradeType === 'Market'}
            prefix={'Price'}
            suffix={quoteCurrency}
            className="w-3/5"
          />
          <TradeType
            onChange={handleTradeTypeChange}
            value={tradeType}
            className="w-2/5"
          />
        </NewInput.Group>

        <NewInput.Group className="mt-4">
          <NewInput
            type="number"
            step={market?.minOrderSize || 1}
            onChange={(e) => onSetBaseSize(parseFloat(e.target.value))}
            value={baseSize}
            className="text-right flex-grow w-3/5"
            prefix={'Size'}
            suffix={baseCurrency}
          />
          <NewInput
            type="number"
            step={market?.minOrderSize || 1}
            onChange={(e) => onSetQuoteSize(parseFloat(e.target.value))}
            value={quoteSize}
            className="text-right border-l border-th-fgd-4 rounded-l-none w-2/5"
            suffix={quoteCurrency}
          />
        </NewInput.Group>
        {tradeType !== 'Market' ? (
          <div style={{ paddingTop: 18 }}>
            {'POST '}
            <Switch
              checked={postOnly}
              onChange={postOnChange}
              style={{ marginRight: 40 }}
            />
            {'IOC '}
            <Switch checked={ioc} onChange={iocOnChange} />
          </div>
        ) : null}
      </div>
      <div className={`flex mt-4`}>
        {ipAllowed ? (
          side === 'buy' ? (
            <Button
              disabled={
                (!price && tradeType === 'Limit') ||
                !baseSize ||
                !connected ||
                submitting
              }
              grow={true}
              onClick={onSubmit}
              className={`rounded text-lg font-light bg-th-green text-th-bkg-1 hover:bg-th-primary flex-grow`}
            >
              {connected ? `Buy ${baseCurrency}` : 'CONNECT WALLET TO TRADE'}
            </Button>
          ) : (
            <Button
              disabled={
                (!price && tradeType === 'Limit') ||
                !baseSize ||
                !connected ||
                submitting
              }
              grow={true}
              onClick={onSubmit}
              className={`rounded text-lg font-light bg-th-red text-white hover:bg-th-primary flex-grow`}
            >
              {connected ? `Sell ${baseCurrency}` : 'CONNECT WALLET TO TRADE'}
            </Button>
          )
        ) : (
          <Button disabled grow>
            <span className={`text-lg font-light`}>Country Not Allowed</span>
          </Button>
        )}
      </div>
    </FloatingElement>
  )
}
