import React, { useRef, useEffect, useState } from 'react'
import styled from '@emotion/styled'
import xw from 'xwind'
import useInterval from '../hooks/useInterval'
import usePrevious from '../hooks/usePrevious'
import { isEqual, getDecimalCount } from '../utils/'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/solid'
import useMarkPrice from '../hooks/useMarkPrice'
import useOrderbook from '../hooks/useOrderbook'
import useMarkets from '../hooks/useMarkets'

const Line = styled.div<any>`
  text-align: ${(props) => (props.invert ? 'left' : 'right')};
  float: ${(props) => (props.invert ? 'left' : 'right')};
  height: 100%;
  ${(props) => props['data-width'] && `width: ${props['data-width']};`}
  ${(props) =>
    props['data-bgcolor'] && `background-color: ${props['data-bgcolor']};`}
`

// const Price = styled.div<any>`
//   position: absolute;
//   ${(props) => (props.invert ? `left: 5px;` : `right: 15px;`)}
//   ${(props) => props['data-color'] && `color: ${props['data-color']};`}
// `

export default function Orderbook({ depth = 7 }) {
  // TODO remove smallScreen
  const smallScreen = false
  const markPrice = useMarkPrice()
  const [orderbook] = useOrderbook()
  const { baseCurrency, quoteCurrency } = useMarkets()

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

      const bidsToDisplay = getCumulativeOrderbookSide(bids, totalSize, false)
      const asksToDisplay = getCumulativeOrderbookSide(asks, totalSize, true)

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

  function getCumulativeOrderbookSide(orders, totalSize, backwards = false) {
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

  return (
    <>
      <div css={xw`flex justify-center pb-1 text-lg font-light`}>Orderbook</div>
      <>
        <div css={xw`text-gray-500 flex justify-between mb-4`}>
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
    </>
  )
}

const OrderbookRow = React.memo<any>(
  ({ side, price, size, sizePercent, onSizeClick, onPriceClick, invert }) => {
    const element = useRef(null)
    const { market } = useMarkets()

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
        css={xw`flex justify-between font-light`}
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
            <div css={xw`text-left flex-1`}>{formattedSize}</div>
            <div css={xw`text-right relative flex-1`}>
              <Line
                css={xw`absolute inset-y-0 right-0`}
                data-width={sizePercent + '%'}
                data-bgcolor={side === 'buy' ? '#5b6b16' : '#E54033'}
              />
              <div
                css={xw`z-30 relative`}
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
    const { market } = useMarkets()
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
