import React, { useRef, useEffect, useState } from 'react'
import styled from '@emotion/styled'
import useInterval from '../hooks/useInterval'
import usePrevious from '../hooks/usePrevious'
import { isEqual, getDecimalCount } from '../utils/'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/solid'
import useMarkPrice from '../hooks/useMarkPrice'
import useOrderbook from '../hooks/useOrderbook'
import useMarket from '../hooks/useMarket'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'

const Line = styled.div<any>`
  text-align: ${(props) => (props.invert ? 'left' : 'right')};
  float: ${(props) => (props.invert ? 'left' : 'right')};
  height: 100%;
  filter: opacity(70%);
  ${(props) => props['data-width'] && `width: ${props['data-width']};`}
`

function getCumulativeOrderbookSide(
  orders,
  totalSize,
  depth,
  backwards = false
) {
  let cumulative = orders
    .slice(0, depth)
    .reduce((cumulative, [price, size], i) => {
      const cumulativeSize = (cumulative[i - 1]?.cumulativeSize || 0) + size
      cumulative.push({
        price,
        size,
        cumulativeSize,
        sizePercent: Math.round((cumulativeSize / (totalSize || 1)) * 100),
      })
      return cumulative
    }, [])
  if (backwards) {
    cumulative = cumulative.reverse()
  }
  return cumulative
}

export default function Orderbook({ depth = 7 }) {
  const markPrice = useMarkPrice()
  const [orderbook] = useOrderbook()
  const { baseCurrency, quoteCurrency } = useMarket()
  const setMangoStore = useMangoStore((s) => s.set)

  const currentOrderbookData = useRef(null)
  const lastOrderbookData = useRef(null)

  const [orderbookData, setOrderbookData] = useState(null)

  useInterval(() => {
    if (
      !currentOrderbookData.current ||
      JSON.stringify(currentOrderbookData.current) !==
        JSON.stringify(lastOrderbookData.current)
    ) {
      const bids = orderbook?.bids || []
      const asks = orderbook?.asks || []

      const sum = (total, [, size], index) =>
        index < depth ? total + size : total
      const totalSize = bids.reduce(sum, 0) + asks.reduce(sum, 0)

      const bidsToDisplay = getCumulativeOrderbookSide(
        bids,
        totalSize,
        depth,
        false
      )
      const asksToDisplay = getCumulativeOrderbookSide(
        asks,
        totalSize,
        depth,
        true
      )

      currentOrderbookData.current = {
        bids: orderbook?.bids,
        asks: orderbook?.asks,
      }

      setOrderbookData({ bids: bidsToDisplay, asks: asksToDisplay })
    }
  }, 250)

  useEffect(() => {
    lastOrderbookData.current = {
      bids: orderbook?.bids,
      asks: orderbook?.asks,
    }
  }, [orderbook])

  const handlePriceClick = (price) => {
    console.log('price click')

    setMangoStore((state) => {
      state.tradeForm.price = price
    })
  }

  const handleSizeClick = (size) => {
    console.log('size click')

    setMangoStore((state) => {
      state.tradeForm.baseSize = size
    })
  }

  return (
    <>
      <ElementTitle>Orderbook</ElementTitle>
      <div className={`text-th-fgd-4 flex justify-between mb-2`}>
        <div className={`text-left`}>Size ({baseCurrency})</div>
        <div className={`text-right`}>Price ({quoteCurrency})</div>
      </div>
      {orderbookData?.asks.map(({ price, size, sizePercent }) => (
        <OrderbookRow
          key={price + ''}
          price={price}
          size={size}
          side={'sell'}
          sizePercent={sizePercent}
          onPriceClick={() => handlePriceClick(price)}
          onSizeClick={() => handleSizeClick(size)}
        />
      ))}
      <MarkPriceComponent markPrice={markPrice} />
      {orderbookData?.bids.map(({ price, size, sizePercent }) => (
        <OrderbookRow
          key={price + ''}
          price={price}
          size={size}
          side={'buy'}
          sizePercent={sizePercent}
          onPriceClick={() => handlePriceClick(price)}
          onSizeClick={() => handleSizeClick(size)}
        />
      ))}
    </>
  )
}

const OrderbookRow = React.memo<any>(
  ({ side, price, size, sizePercent, onSizeClick, onPriceClick, invert }) => {
    const element = useRef(null)
    const { market } = useMarket()

    useEffect(() => {
      !element.current?.classList.contains('flash') &&
        element.current?.classList.add('flash')
      const id = setTimeout(
        () =>
          element.current?.classList.contains('flash') &&
          element.current?.classList.remove('flash'),
        250
      )
      return () => clearTimeout(id)
    }, [price, size])

    const formattedSize =
      market?.minOrderSize && !isNaN(size)
        ? Number(size).toFixed(getDecimalCount(market.minOrderSize) + 1)
        : size

    const formattedPrice =
      market?.tickSize && !isNaN(price)
        ? Number(price).toFixed(getDecimalCount(market.tickSize) + 1)
        : price

    return (
      <div className={`flex text-sm leading-7 justify-between`} ref={element}>
        {invert ? (
          <>
            <div className={`text-left`}>
              <Line
                invert
                data-width={sizePercent + '%'}
                side={side}
                className={`${side === 'buy' ? `bg-th-green` : `bg-th-red`}`}
              />
              <div onClick={onPriceClick}>{formattedPrice}</div>
            </div>
            <div className={`text-right`} onClick={onSizeClick}>
              {formattedSize}
            </div>
          </>
        ) : (
          <>
            <div
              className={`text-left flex-1 text-th-fgd-1`}
              onClick={onSizeClick}
            >
              {formattedSize}
            </div>
            <div className={`text-right relative flex-1`}>
              <Line
                className={`absolute inset-y-0 right-0 ${
                  side === 'buy' ? `bg-th-green` : `bg-th-red`
                }`}
                data-width={sizePercent + '%'}
                side={side}
              />
              <div
                className={`z-30 relative text-th-fgd-1`}
                onClick={onPriceClick}
              >
                {formattedPrice}
              </div>
            </div>
          </>
        )}
      </div>
    )
  },
  (prevProps, nextProps) =>
    isEqual(prevProps, nextProps, ['price', 'size', 'sizePercent'])
)

const MarkPriceComponent = React.memo<{ markPrice: number }>(
  ({ markPrice }) => {
    const { market } = useMarket()
    const previousMarkPrice: number = usePrevious(markPrice)

    const formattedMarkPrice =
      markPrice &&
      market?.tickSize &&
      markPrice.toFixed(getDecimalCount(market.tickSize))

    return (
      <div
        className={`flex justify-center items-center font-bold p-1 ${
          markPrice > previousMarkPrice
            ? `text-th-green`
            : markPrice < previousMarkPrice
            ? `text-th-red`
            : `text-th-fgd-1`
        }`}
      >
        {markPrice > previousMarkPrice && (
          <ArrowUpIcon className={`h-5 w-5 mr-1 text-th-green`} />
        )}
        {markPrice < previousMarkPrice && (
          <ArrowDownIcon className={`h-5 w-5 mr-1 text-th-red`} />
        )}
        {formattedMarkPrice || '----'}
      </div>
    )
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps, ['markPrice'])
)
