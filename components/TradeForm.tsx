import { useState, useEffect, useRef } from 'react'
import { Input, Radio, Switch, Select } from 'antd'
import xw from 'xwind'
import styled from '@emotion/styled'
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
import useMarginAccount from '../hooks/useMarginAcccount'
import useMangoStore from '../stores/useMangoStore'

const SellButton = styled.button`
  margin: 20px 0px 0px 0px;
  background: #e54033;
  border-color: #e54033;
`

const BuyButton = styled.button`
  margin: 20px 0px 0px 0px;
  color: #141026;
  background: #9bd104;
  border-color: #9bd104;
`

export default function TradeForm({
  setChangeOrderRef,
}: {
  setChangeOrderRef?: (
    ref: ({ size, price }: { size?: number; price?: number }) => void
  ) => void
}) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const { baseCurrency, quoteCurrency, market } = useMarket()
  const address = market?.publicKey
  const { current: wallet, connected } = useMangoStore((s) => s.wallet)

  const { connection, cluster } = useConnection()
  const { marginAccount, mangoGroup } = useMarginAccount()
  const tradeForm = useMangoStore((s) => s.tradeForm)

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

  const { ipAllowed } = useIpAddress()

  const [postOnly, setPostOnly] = useState(false)
  const [ioc, setIoc] = useState(false)
  const [baseSize, setBaseSize] = useState<number | undefined>(undefined)
  const [quoteSize, setQuoteSize] = useState<number | undefined>(undefined)
  const [price, setPrice] = useState<number | undefined>(undefined)
  const [submitting, setSubmitting] = useState(false)
  const [tradeType, setTradeType] = useState('Limit')

  const sizeDecimalCount =
    market?.minOrderSize && getDecimalCount(market.minOrderSize)
  const priceDecimalCount = market?.tickSize && getDecimalCount(market.tickSize)

  useEffect(() => {
    setChangeOrderRef && setChangeOrderRef(doChangeOrder)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setChangeOrderRef])

  useEffect(() => {
    if (!price && markPrice && tradeType !== 'Market') {
      setPrice(markPrice)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [price, baseSize, quoteSize])

  // Set the price from the balance comp
  useEffect(() => {
    if (tradeForm.currency) {
      if (tradeForm.currency === baseCurrency) {
        // onSetBaseSize(size.size);
      } else {
        // onSetQuoteSize(size.size);
      }
    }
  }, [tradeForm])

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
    console.log('checking if we can call place order', {
      mangoGroup,
      address,
      marginAccount,
      market,
    })

    if (!mangoGroup || !address || !marginAccount || !market) return
    setSubmitting(true)

    try {
      let calculatedPrice
      if (tradeType === 'Market') {
        calculatedPrice =
          side === 'buy'
            ? calculateMarketPrice(orderbook.asks, tradeForm.size, side)
            : calculateMarketPrice(orderbook.bids, tradeForm.size, side)
      }

      await placeAndSettle(
        connection,
        new PublicKey(IDS[cluster].mango_program_id),
        mangoGroup,
        // TODO:
        // @ts-ignore
        marginAccount,
        market,
        wallet,
        side,
        calculatedPrice ?? price,
        baseSize,
        ioc ? 'ioc' : postOnly ? 'postOnly' : 'limit'
      )

      // refreshCache(tuple('getTokenAccounts', wallet, connected))
      setPrice(undefined)
      onSetBaseSize(undefined)
    } catch (e) {
      console.warn(e)
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
      setPrice(undefined)
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
        <Radio.Group
          onChange={(e) => setSide(e.target.value)}
          value={side}
          buttonStyle="solid"
          style={{
            marginBottom: 8,
            width: '100%',
          }}
        >
          <Radio.Button
            value="buy"
            style={{
              width: '50%',
              textAlign: 'center',
              color: side === 'buy' ? '#141026' : '',
              background: side === 'buy' ? '#AFD803' : '',
              borderColor: side === 'buy' ? '#AFD803' : '',
            }}
          >
            BUY
          </Radio.Button>
          <Radio.Button
            className="sell-button"
            value="sell"
            style={{
              width: '50%',
              textAlign: 'center',
              background: side === 'sell' ? '#E54033' : '',
              borderColor: side === 'sell' ? '#E54033' : '',
            }}
          >
            SELL
          </Radio.Button>
        </Radio.Group>
        <Input.Group compact style={{ paddingBottom: 8 }}>
          <Input
            style={{
              width: 'calc(50% + 30px)',
              textAlign: 'right',
              paddingBottom: 8,
            }}
            addonBefore={<div style={{ width: '30px' }}>Price</div>}
            suffix={
              <span style={{ fontSize: 10, opacity: 0.5 }}>
                {quoteCurrency}
              </span>
            }
            value={price}
            type="number"
            step={market?.tickSize || 1}
            onChange={(e) => setPrice(parseFloat(e.target.value))}
            disabled={tradeType === 'Market'}
          />
          <Select
            style={{ width: 'calc(50% - 30px)' }}
            onChange={handleTradeTypeChange}
            value={tradeType}
          >
            <Select.Option value="Limit">Limit</Select.Option>
            <Select.Option value="Market">Market</Select.Option>
          </Select>
        </Input.Group>
        <Input.Group compact style={{ paddingBottom: 8 }}>
          <Input
            style={{ width: 'calc(50% + 30px)', textAlign: 'right' }}
            addonBefore={<div style={{ width: '30px' }}>Size</div>}
            suffix={
              <span style={{ fontSize: 10, opacity: 0.5 }}>{baseCurrency}</span>
            }
            value={baseSize}
            type="number"
            step={market?.minOrderSize || 1}
            onChange={(e) => onSetBaseSize(parseFloat(e.target.value))}
          />
          <Input
            style={{ width: 'calc(50% - 30px)', textAlign: 'right' }}
            suffix={
              <span style={{ fontSize: 10, opacity: 0.5 }}>
                {quoteCurrency}
              </span>
            }
            value={quoteSize}
            type="number"
            step={market?.minOrderSize || 1}
            onChange={(e) => onSetQuoteSize(parseFloat(e.target.value))}
          />
        </Input.Group>
        {/* {connected && marginInfo.prices.length ? (
          <StyledSlider
            value={sizeFraction}
            onChange={onSliderChange}
            min={getSliderMin()}
            max={getSliderMax()}
            step={getSliderStep()}
            tooltipVisible={false}
            renderTrack={Track}
            renderThumb={Thumb}
          />
        ) : null} */}
        {tradeType !== 'Market' ? (
          <div style={{ paddingTop: 18 }}>
            {'POST '}
            <Switch
              checked={postOnly}
              onChange={postOnChange}
              style={{ marginRight: 40 }}
              disabled={tradeType === 'Market'}
            />
            {'IOC '}
            <Switch
              checked={ioc}
              onChange={iocOnChange}
              disabled={tradeType === 'Market'}
            />
          </div>
        ) : null}
      </div>
      <div css={xw`flex`}>
        {ipAllowed ? (
          side === 'buy' ? (
            <BuyButton
              disabled={
                (!price && tradeType === 'Limit') ||
                !baseSize ||
                !connected ||
                submitting
              }
              onClick={onSubmit}
            >
              {connected ? `Buy ${baseCurrency}` : 'CONNECT WALLET TO TRADE'}
            </BuyButton>
          ) : (
            <SellButton
              disabled={
                (!price && tradeType === 'Limit') ||
                !baseSize ||
                !connected ||
                submitting
              }
              onClick={onSubmit}
            >
              {connected ? `Sell ${baseCurrency}` : 'CONNECT WALLET TO TRADE'}
            </SellButton>
          )
        ) : (
          <button css={xw`flex-grow border`} disabled>
            <div css={xw`text-lg font-light p-2`}>Country Not Allowed</div>
          </button>
        )}
      </div>
    </FloatingElement>
  )
}
