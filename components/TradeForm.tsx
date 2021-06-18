import { useState, useEffect, useRef } from 'react'
import styled from '@emotion/styled'
import useMarket from '../hooks/useMarket'
import useIpAddress from '../hooks/useIpAddress'
import useConnection from '../hooks/useConnection'
import { PublicKey } from '@solana/web3.js'
import {
  getTokenBySymbol,
  IDS,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import { notify } from '../utils/notifications'
// import { placeAndSettle } from '../utils/mango'
import { calculateMarketPrice, getDecimalCount } from '../utils'
import FloatingElement from './FloatingElement'
import { floorToDecimal } from '../utils/index'
import useMangoStore, { mangoClient } from '../stores/useMangoStore'
import Button from './Button'
import TradeType from './TradeType'
import Input from './Input'
import Switch from './Switch'
import { Market } from '@project-serum/serum'
import {
  I80F48,
  NEG_ONE_I80F48,
} from '@blockworks-foundation/mango-client/lib/src/fixednum'
import Big from 'big.js'

const StyledRightInput = styled(Input)`
  border-left: 1px solid transparent;
`

export default function TradeForm() {
  const set = useMangoStore((s) => s.set)
  const connected = useMangoStore((s) => s.wallet.connected)
  const actions = useMangoStore((s) => s.actions)
  const { connection, cluster } = useConnection()
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const market = useMangoStore((s) => s.selectedMarket.current)
  const { side, baseSize, quoteSize, price, tradeType } = useMangoStore(
    (s) => s.tradeForm
  )
  let { ipAllowed } = useIpAddress()
  ipAllowed = true
  const [postOnly, setPostOnly] = useState(false)
  const [ioc, setIoc] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const orderBookRef = useRef(useMangoStore.getState().selectedMarket.orderBook)
  const orderbook = orderBookRef.current
  useEffect(
    () =>
      useMangoStore.subscribe(
        (orderBook) => (orderBookRef.current = orderBook),
        (state) => state.selectedMarket.orderBook
      ),
    []
  )
  console.log({ orderbook, orderBookRef })

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
      marketConfig.base_symbol
    ).decimals
    minOrderSize = new Big(market.contractSize)
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
      marketConfig.base_symbol
    ).decimals
    const quoteDecimals = getTokenBySymbol(
      groupConfig,
      groupConfig.quote_symbol
    ).decimals

    const nativeToUi = new Big(10).pow(baseDecimals - quoteDecimals)
    const lotsToNative = new Big(market.quoteLotSize).div(
      new Big(market.contractSize)
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

    if (!wallet || !mangoGroup || !marginAccount || !market) return
    setSubmitting(true)

    try {
      let orderPrice = Number(price)
      if (tradeType === 'Market') {
        orderPrice = calculateMarketPrice(orderbook, baseSize, side)
      }

      console.log('place', orderPrice, baseSize)

      const orderType = ioc ? 'ioc' : postOnly ? 'postOnly' : 'limit'
      if (market instanceof Market) {
        mangoClient.placeSpotOrder(
          mangoGroup,
          marginAccount,
          mangoGroup.merpsCache,
          market,
          wallet,
          side,
          orderPrice,
          baseSize,
          orderType
        )
      } else {
        //
      }

      console.log('Successfully placed trade!')

      setPrice('')
      onSetBaseSize('')
      actions.fetchMarginAccounts()
    } catch (e) {
      notify({
        message: 'Error placing order',
        description: e.message,
        txid: e.txid,
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
      const priceOnBook = side === 'buy' ? orderbook?.asks : orderbook?.bids
      if (priceOnBook && priceOnBook.length > 0 && priceOnBook[0].length > 0) {
        setPrice(priceOnBook[0][0])
      }
      setIoc(false)
    }
  }

  const disabledTradeButton =
    (!price && tradeType === 'Limit') || !baseSize || !connected || submitting

  console.log(
    'dis',
    !price && tradeType === 'Limit',
    !baseSize,
    !connected,
    submitting
  )

  return (
    <FloatingElement>
      <div>
        <div className={`flex text-base text-th-fgd-4`}>
          <button
            onClick={() => setSide('buy')}
            className={`flex-1 outline-none focus:outline-none`}
          >
            <div
              className={`hover:text-th-green pb-1 transition-colors duration-500
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
              className={`hover:text-th-red pb-1 transition-colors duration-500
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
        <Input.Group className="mt-4">
          <Input
            type="number"
            min="0"
            step={tickSize}
            onChange={(e) => onSetPrice(e.target.value)}
            value={price}
            disabled={tradeType === 'Market'}
            prefix={'Price'}
            suffix={groupConfig.quote_symbol}
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
            suffix={marketConfig.base_symbol}
          />
          <StyledRightInput
            type="number"
            min="0"
            step={minOrderSize}
            onChange={(e) => onSetQuoteSize(e.target.value)}
            value={quoteSize}
            className="rounded-l-none"
            wrapperClassName="w-2/5"
            suffix={groupConfig.quote_symbol}
          />
        </Input.Group>
        {tradeType !== 'Market' ? (
          <div className="flex items-center mt-4">
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
      <div className={`flex pt-6`}>
        {ipAllowed ? (
          connected ? (
            side === 'buy' ? (
              <Button
                disabled={disabledTradeButton}
                onClick={onSubmit}
                className={`${
                  !disabledTradeButton &&
                  'border-th-green hover:border-th-green-dark'
                } text-th-green hover:text-th-fgd-1 hover:bg-th-green-dark flex-grow`}
              >
                {`${
                  baseSize > 0
                    ? 'Buy ' + baseSize
                    : 'Set BUY bid >= ' + minOrderSize
                } ${marketConfig.base_symbol}`}
              </Button>
            ) : (
              <Button
                disabled={disabledTradeButton}
                onClick={onSubmit}
                className={`${
                  !disabledTradeButton &&
                  'border-th-red hover:border-th-red-dark'
                } text-th-red hover:text-th-fgd-1 hover:bg-th-red-dark flex-grow`}
              >
                {`${
                  baseSize > 0
                    ? 'Sell ' + baseSize
                    : 'Set SELL bid >= ' + minOrderSize
                } ${marketConfig.base_symbol}`}
              </Button>
            )
          ) : (
            <>
              <Button disabled className="flex-grow">
                Connect Wallet
              </Button>
              {/* <div className="flex justify-between border border-th-fgd-4 rounded-md w-full">
                <Button
                  onClick={() => wallet.connect()}
                  className={`rounded-r-none flex flex-grow items-center justify-center border-none`}
                >
                  <WalletIcon className="fill-current h-4 w-4 mr-2" />
                  Connect Wallet
                </Button>
                <div className="relative h-full">
                  <WalletSelect />
                </div>
              </div> */}
            </>
          )
        ) : (
          <Button disabled className="flex-grow">
            <span className="text-lg font-light">Country Not Allowed</span>
          </Button>
        )}
      </div>
    </FloatingElement>
  )
}

function divideBnToNumber(numerator: BN, denominator: BN): number {
  const quotient = numerator.div(denominator).toNumber()
  const rem = numerator.umod(denominator)
  const gcd = rem.gcd(denominator)
  return quotient + rem.div(gcd).toNumber() / denominator.div(gcd).toNumber()
}
