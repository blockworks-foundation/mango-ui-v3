import React, { useRef, useEffect, useState } from 'react'
import styled from '@emotion/styled'
import xw from 'xwind'
import useInterval from '../hooks/useInterval'
import usePrevious from '../hooks/usePrevious'
import { isEqual, getDecimalCount } from '../utils/'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/solid'
import useMarkPrice from '../hooks/useMarkPrice'
import useOrderbook from '../hooks/useOrderbook'
import useMarket from '../hooks/useMarket'
import { ElementTitle } from './styles'

const Line = styled.div<any>`
  text-align: ${(props) => (props.invert ? 'left' : 'right')};
  float: ${(props) => (props.invert ? 'left' : 'right')};
  height: 100%;
  ${(props) => props['data-width'] && `width: ${props['data-width']};`}
  ${(props) =>
    props['data-bgcolor'] && `background-color: ${props['data-bgcolor']};`}
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

  return (
    <>
      <ElementTitle>Orderbook</ElementTitle>
      <div css={xw`text-gray-500 flex justify-between mb-2`}>
        <div css={xw`text-left`}>Size ({baseCurrency})</div>
        <div css={xw`text-right`}>Price ({quoteCurrency})</div>
      </div>
      {orderbookData?.asks.map(({ price, size, sizePercent }) => (
        <OrderbookRow
          key={price + ''}
          price={price}
          size={size}
          side={'sell'}
          sizePercent={sizePercent}
          onPriceClick={() => alert(`price ${price}`)}
          onSizeClick={() => alert(`size ${size}`)}
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
          onPriceClick={() => alert(`price ${price}`)}
          onSizeClick={() => alert(`size ${size}`)}
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
      <div
        css={xw`flex mb-0.5 justify-between font-light`}
        ref={element}
        onClick={onSizeClick}
      >
        {invert ? (
          <>
            <div css={xw`text-left`}>
              <Line
                invert
                data-width={sizePercent + '%'}
                data-bgcolor={side === 'buy' ? '#5b6b16' : '#E54033'}
              />
              <div
                css={xw``}
                data-color={side === 'buy' ? '#ffffff' : 'white'}
                onClick={onPriceClick}
              >
                {formattedPrice}
              </div>
            </div>
            <div css={xw`text-right`}>{formattedSize}</div>
          </>
        ) : (
          <>
            <div css={xw`text-left flex-1 text-gray-200`}>{formattedSize}</div>
            <div css={xw`text-right relative flex-1`}>
              <Line
                css={xw`absolute inset-y-0 right-0`}
                data-width={sizePercent + '%'}
                data-bgcolor={side === 'buy' ? '#5b6b16' : '#E54033'}
              />
              <div
                css={xw`z-30 relative text-gray-200`}
                data-color={side === 'buy' ? '#ffffff' : 'white'}
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

    const markPriceColor =
      markPrice > previousMarkPrice
        ? '#afd803'
        : markPrice < previousMarkPrice
        ? '#E54033'
        : 'white'

    const formattedMarkPrice =
      markPrice &&
      market?.tickSize &&
      markPrice.toFixed(getDecimalCount(market.tickSize))

    return (
      <div
        css={xw`flex justify-center items-center font-bold p-1`}
        style={{ color: markPriceColor }}
      >
        {markPrice > previousMarkPrice && (
          <ArrowUpIcon css={xw`h-5 w-5 mr-1`} />
        )}
        {markPrice < previousMarkPrice && (
          <ArrowDownIcon css={xw`h-5 w-5 mr-1`} />
        )}
        {formattedMarkPrice || '----'}
      </div>
    )
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps, ['markPrice'])
)
