import React, { useRef, useEffect, useState } from 'react'
import styled from '@emotion/styled'
import { css, keyframes } from '@emotion/react'
import useInterval from '../hooks/useInterval'
import usePrevious from '../hooks/usePrevious'
import { isEqual, getDecimalCount } from '../utils/'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  SwitchHorizontalIcon,
} from '@heroicons/react/solid'
import useMarkPrice from '../hooks/useMarkPrice'
import useOrderbook from '../hooks/useOrderbook'
import useMarket from '../hooks/useMarket'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import Tooltip from './Tooltip'
import FloatingElement from './FloatingElement'

const Line = styled.div<any>`
  text-align: ${(props) => (props.invert ? 'left' : 'right')};
  height: 100%;
  filter: opacity(40%);
  ${(props) => props['data-width'] && `width: ${props['data-width']};`}
`
const fadeIn = keyframes`
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
`

const FlipCard = styled.div`
  background-color: transparent;
  height: 100%;
  perspective: 1000px;
`

const FlipCardInner = styled.div<any>`
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.8s ease-out;
  transform-style: preserve-3d;
  transform: ${({ flip }) => (flip ? 'rotateY(0deg)' : 'rotateY(180deg)')};
`

const FlipCardFront = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
`

const FlipCardBack = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  transform: rotateY(180deg);
`

const StyledFloatingElement = styled(FloatingElement)`
  animation: ${css`
    ${fadeIn} 1s linear
  `};
`

export default function Orderbook({ depth = 8 }) {
  const markPrice = useMarkPrice()
  const [orderbook] = useOrderbook()
  const { baseCurrency, quoteCurrency } = useMarket()
  const setMangoStore = useMangoStore((s) => s.set)

  const currentOrderbookData = useRef(null)
  const lastOrderbookData = useRef(null)

  const [orderbookData, setOrderbookData] = useState(null)
  const [defaultLayout, setDefaultLayout] = useState(true)
  const [loading, setLoading] = useState(true)

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
      const asksToDisplay = defaultLayout
        ? getCumulativeOrderbookSide(asks, totalSize, depth, false)
        : getCumulativeOrderbookSide(asks, totalSize, depth, true)

      currentOrderbookData.current = {
        bids: orderbook?.bids,
        asks: orderbook?.asks,
      }
      if (bidsToDisplay[0] && asksToDisplay[0]) {
        const bid = bidsToDisplay[0].price
        const ask = defaultLayout
          ? asksToDisplay[0].price
          : asksToDisplay[7].price
        const spread = ask - bid
        const spreadPercentage = (spread / ask) * 100

        setOrderbookData({
          bids: bidsToDisplay,
          asks: asksToDisplay,
          spread: spread,
          spreadPercentage: spreadPercentage,
        })
        setLoading(false)
      }
    }
  }, 250)

  useEffect(() => {
    lastOrderbookData.current = {
      bids: orderbook?.bids,
      asks: orderbook?.asks,
    }
  }, [orderbook])

  const getCumulativeOrderbookSide = (
    orders,
    totalSize,
    depth,
    backwards = false
  ) => {
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

  const handleLayoutChange = () => {
    setLoading(true)
    setDefaultLayout(!defaultLayout)
  }

  return (
    <>
      <FlipCard>
        <FlipCardInner flip={defaultLayout}>
          {defaultLayout ? (
            <FlipCardFront>
              <StyledFloatingElement>
                <div className="flex items-center justify-between pb-2.5">
                  <div className="w-8 h-8" />
                  <ElementTitle noMarignBottom>Orderbook</ElementTitle>
                  <div className="flex relative">
                    <Tooltip content={'Switch Layout'} className="text-xs py-1">
                      <button
                        onClick={() => handleLayoutChange()}
                        className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
                      >
                        <SwitchHorizontalIcon className="w-5 h-5" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <MarkPriceComponent markPrice={markPrice} />
                {!loading ? (
                  <>
                    <div
                      className={`text-th-fgd-4 flex justify-between mb-2 text-xs`}
                    >
                      <div className={`text-left`}>Size ({baseCurrency})</div>
                      <div className={`text-center`}>
                        Price ({quoteCurrency})
                      </div>
                      <div className={`text-right`}>Size ({baseCurrency})</div>
                    </div>
                    <div className="flex">
                      <div className="w-1/2">
                        {orderbookData?.bids.map(
                          ({ price, size, sizePercent }) => (
                            <OrderbookRow
                              key={price + ''}
                              price={price}
                              size={size}
                              side={'buy'}
                              sizePercent={sizePercent}
                              onPriceClick={() => handlePriceClick(price)}
                              onSizeClick={() => handleSizeClick(size)}
                            />
                          )
                        )}
                      </div>
                      <div className="w-1/2">
                        {/* <div
                          className={`text-th-fgd-4 flex justify-between mb-2`}
                        >
                          <div className={`text-left text-xs px-1`}>
                            Ask ({quoteCurrency})
                          </div>
                          <div className={`text-right text-xs`}>
                            Size ({baseCurrency})
                          </div>
                        </div> */}
                        {orderbookData?.asks.map(
                          ({ price, size, sizePercent }) => (
                            <OrderbookRow
                              invert
                              key={price + ''}
                              price={price}
                              size={size}
                              side={'sell'}
                              sizePercent={sizePercent}
                              onPriceClick={() => handlePriceClick(price)}
                              onSizeClick={() => handleSizeClick(size)}
                            />
                          )
                        )}
                      </div>
                    </div>
                    <div className="flex justify-between bg-th-bkg-1 p-2 mt-4 rounded-md text-xs">
                      <div className="text-th-fgd-3">Spread</div>
                      <div className="text-th-fgd-1">
                        {orderbookData?.spread.toFixed(2)}
                      </div>
                      <div className="text-th-fgd-1">
                        {orderbookData?.spreadPercentage.toFixed(2)}%
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="animate-pulse space-y-3 w-full">
                    <div className="h-5 w-full bg-th-bkg-3 rounded" />
                    <div className="h-5 w-full bg-th-bkg-3 rounded" />
                    <div className="h-5 w-full bg-th-bkg-3 rounded" />
                    <div className="h-5 w-full bg-th-bkg-3 rounded" />
                    <div className="h-5 w-full bg-th-bkg-3 rounded" />
                    <div className="h-5 w-full bg-th-bkg-3 rounded" />
                    <div className="h-5 w-full bg-th-bkg-3 rounded" />
                    <div className="h-5 w-full bg-th-bkg-3 rounded" />
                  </div>
                )}
              </StyledFloatingElement>
            </FlipCardFront>
          ) : (
            <FlipCardBack>
              <StyledFloatingElement>
                <div className="flex items-center justify-between pb-2.5">
                  <div className="w-8 h-8" />
                  <ElementTitle noMarignBottom>Orderbook</ElementTitle>
                  <div className="flex relative">
                    <Tooltip content={'Switch Layout'} className="text-xs py-1">
                      <button
                        onClick={() => handleLayoutChange()}
                        className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
                      >
                        <SwitchHorizontalIcon className="w-5 h-5" />
                      </button>
                    </Tooltip>
                  </div>
                </div>
                <MarkPriceComponent markPrice={markPrice} />
                {!loading ? (
                  <>
                    <div className={`text-th-fgd-4 flex justify-between mb-2`}>
                      <div className={`text-left text-xs`}>
                        Size ({baseCurrency})
                      </div>
                      <div className={`text-right text-xs`}>
                        Price ({quoteCurrency})
                      </div>
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
                    <div className="flex justify-between bg-th-bkg-1 p-2 my-2 rounded-md text-xs">
                      <div className="text-th-fgd-3">Spread</div>
                      <div className="text-th-fgd-1">
                        {orderbookData?.spread.toFixed(2)}
                      </div>
                      <div className="text-th-fgd-1">
                        {orderbookData?.spreadPercentage.toFixed(2)}%
                      </div>
                    </div>
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
                ) : (
                  <div className="animate-pulse space-y-3 w-full">
                    <div className="h-5 w-full bg-th-bkg-3 rounded" />
                    <div className="h-5 w-full bg-th-bkg-3 rounded" />
                    <div className="h-5 w-full bg-th-bkg-3 rounded" />
                    <div className="h-5 w-full bg-th-bkg-3 rounded" />
                    <div className="h-5 w-full bg-th-bkg-3 rounded" />
                    <div className="h-5 w-full bg-th-bkg-3 rounded" />
                    <div className="h-5 w-full bg-th-bkg-3 rounded" />
                    <div className="h-5 w-full bg-th-bkg-3 rounded" />
                  </div>
                )}
              </StyledFloatingElement>
            </FlipCardBack>
          )}
        </FlipCardInner>
      </FlipCard>
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
            <div className={`text-left relative flex-1`}>
              <Line
                invert
                data-width={sizePercent + '%'}
                side={side}
                className={`absolute inset-y-0 left-0 ${
                  side === 'buy' ? `bg-th-green` : `bg-th-red`
                }`}
              />
              <div
                onClick={onPriceClick}
                className="z-30 relative text-th-fgd-1 px-1"
              >
                {formattedPrice}
              </div>
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
                className={`z-30 relative text-th-fgd-1 px-1`}
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
        className={`flex justify-center items-center font-bold text-lg pb-4 ${
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
