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
  filter: opacity(70%);
  ${(props) => props['data-width'] && `width: ${props['data-width']};`}
  ${(props) => (props.side === 'buy' ? xw`bg-th-green` : xw`bg-th-red`)};
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
      <div css={xw`text-th-fgd-4 flex justify-between mb-2`}>
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
              <Line invert data-width={sizePercent + '%'} side={side} />
              <div onClick={onPriceClick}>{formattedPrice}</div>
            </div>
            <div css={xw`text-right`}>{formattedSize}</div>
          </>
        ) : (
          <>
            <div css={xw`text-left flex-1 text-th-fgd-1`}>{formattedSize}</div>
            <div css={xw`text-right relative flex-1`}>
              <Line
                css={xw`absolute inset-y-0 right-0`}
                data-width={sizePercent + '%'}
                side={side}
              />
              <div css={xw`z-30 relative text-th-fgd-1`} onClick={onPriceClick}>
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
        css={
          markPrice > previousMarkPrice
            ? xw`text-th-green flex justify-center items-center font-bold p-1`
            : markPrice < previousMarkPrice
            ? xw`text-th-red flex justify-center items-center font-bold p-1`
            : xw`text-th-fgd-1 flex justify-center items-center font-bold p-1`
        }
      >
        {markPrice > previousMarkPrice && (
          <ArrowUpIcon css={xw`h-5 w-5 mr-1 text-th-green`} />
        )}
        {markPrice < previousMarkPrice && (
          <ArrowDownIcon css={xw`h-5 w-5 mr-1 text-th-red`} />
        )}
        {formattedMarkPrice || '----'}
      </div>
    )
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps, ['markPrice'])
)
