import React, { useRef, useEffect, useState } from 'react'
import styled from '@emotion/styled'
import xw from 'xwind'
import useInterval from '../hooks/useInterval'
import usePrevious from '../hooks/usePrevious'
import { isEqual, getDecimalCount } from '../utils/'
// import { useMarket, useOrderbook, useMarkPrice } from '../utils/markets'
// import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'

const Title = styled.div`
  color: rgba(255, 255, 255, 1);
`

const SizeTitle = styled.div`
  padding: 4px 0 4px 0px;
  color: #434a59;
`

const MarkPriceTitle = styled.div`
  padding: 4px 0 4px;
  font-weight: 700;
`

const Line = styled.div<any>`
  text-align: ${(props) => (props.invert ? 'left' : 'right')};
  float: ${(props) => (props.invert ? 'left' : 'right')};
  height: 100%;
  ${(props) => props['data-width'] && `width: ${props['data-width']};`}
  ${(props) =>
    props['data-bgcolor'] && `background-color: ${props['data-bgcolor']};`}
`

const Price = styled.div<any>`
  position: absolute;
  ${(props) => (props.invert ? `left: 5px;` : `right: 5px;`)}
  ${(props) => props['data-color'] && `color: ${props['data-color']};`}
`

export default function Orderbook({ depth = 7 }) {
  // TODO remove smallScreen
  const smallScreen = false
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

  return null

  // return (
  //   <>
  //     <div>
  //       <Title>Orderbook</Title>
  //     </div>
  //     {smallScreen ? (
  //       <>
  //         <MarkPriceComponent markPrice={markPrice} />
  //         <div css={xw`flex`}>
  //           <div css={xw`flex`} flex={1}>
  //             <SizeTitle>
  //               <div css={xw`text-left`}>
  //                 Size
  //                 <div style={{ marginTop: -5 }}>({baseCurrency})</div>
  //               </div>
  //               <div css={xw`text-right pr-4`}>
  //                 Price
  //                 <div style={{ marginTop: -5 }}>({quoteCurrency})</div>
  //               </div>
  //             </SizeTitle>
  //             {orderbookData?.bids.map(({ price, size, sizePercent }) => (
  //               <OrderbookRow
  //                 key={price + ''}
  //                 price={price}
  //                 size={size}
  //                 side={'buy'}
  //                 sizePercent={sizePercent}
  //                 // onPriceClick={() => onPrice(price)}
  //                 // onSizeClick={() => onSize(size)}
  //               />
  //             ))}
  //           </div>
  //           <Col flex={1} style={{ paddingLeft: 2 }}>
  //             <SizeTitle>
  //               <Col span={12} style={{ textAlign: 'left' }}>
  //                 Price
  //                 <div style={{ marginTop: -5 }}>({quoteCurrency})</div>
  //               </Col>
  //               <Col span={12} style={{ textAlign: 'right ' }}>
  //                 Size
  //                 <div style={{ marginTop: -5 }}>({baseCurrency})</div>
  //               </Col>
  //             </SizeTitle>
  //             {orderbookData?.asks
  //               .slice(0)
  //               .reverse()
  //               .map(({ price, size, sizePercent }) => (
  //                 <OrderbookRow
  //                   invert={true}
  //                   key={price + ''}
  //                   price={price}
  //                   size={size}
  //                   side={'sell'}
  //                   sizePercent={sizePercent}
  //                   onPriceClick={() => onPrice(price)}
  //                   onSizeClick={() => onSize(size)}
  //                 />
  //               ))}
  //           </Col>
  //         </div>
  //       </>
  //     ) : (
  //       <>
  //         <SizeTitle>
  //           <Col span={12} style={{ textAlign: 'left' }}>
  //             Size ({baseCurrency})
  //           </Col>
  //           <Col span={12} style={{ textAlign: 'right' }}>
  //             Price ({quoteCurrency})
  //           </Col>
  //         </SizeTitle>
  //         {orderbookData?.asks.map(({ price, size, sizePercent }) => (
  //           <OrderbookRow
  //             key={price + ''}
  //             price={price}
  //             size={size}
  //             side={'sell'}
  //             sizePercent={sizePercent}
  //             onPriceClick={() => onPrice(price)}
  //             onSizeClick={() => onSize(size)}
  //           />
  //         ))}
  //         <MarkPriceComponent markPrice={markPrice} />
  //         {orderbookData?.bids.map(({ price, size, sizePercent }) => (
  //           <OrderbookRow
  //             key={price + ''}
  //             price={price}
  //             size={size}
  //             side={'buy'}
  //             sizePercent={sizePercent}
  //             onPriceClick={() => onPrice(price)}
  //             onSizeClick={() => onSize(size)}
  //           />
  //         ))}
  //       </>
  //     )}
  //   </>
  // )
}

const OrderbookRow = React.memo(
  ({ side, price, size, sizePercent, onSizeClick, onPriceClick, invert }) => {
    const element = useRef()

    const { market } = useMarket()

    useEffect(() => {
      // eslint-disable-next-line
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
        css={xw`flex mb-1`}
        ref={element}
        style={{ marginBottom: 1 }}
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
              <Price
                invert
                data-color={side === 'buy' ? '#ffffff' : 'white'}
                onClick={onPriceClick}
              >
                {formattedPrice}
              </Price>
            </div>
            <div css={xw`text-right`}>{formattedSize}</div>
          </>
        ) : (
          <>
            <Col span={12} style={{ textAlign: 'left' }}>
              {formattedSize}
            </Col>
            <Col span={12} style={{ textAlign: 'right' }}>
              <Line
                data-width={sizePercent + '%'}
                data-bgcolor={side === 'buy' ? '#5b6b16' : '#E54033'}
              />
              <Price
                data-color={side === 'buy' ? '#ffffff' : 'white'}
                onClick={onPriceClick}
              >
                {formattedPrice}
              </Price>
            </Col>
          </>
        )}
      </div>
    )
  },
  (prevProps, nextProps) =>
    isEqual(prevProps, nextProps, ['price', 'size', 'sizePercent'])
)

const MarkPriceComponent = React.memo(
  ({ markPrice }) => {
    const { market } = useMarket()
    const previousMarkPrice = usePrevious(markPrice)

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
      <MarkPriceTitle justify="center">
        <div style={{ color: markPriceColor }}>
          {markPrice > previousMarkPrice && (
            <ArrowUpOutlined style={{ marginRight: 5 }} />
          )}
          {markPrice < previousMarkPrice && (
            <ArrowDownOutlined style={{ marginRight: 5 }} />
          )}
          {formattedMarkPrice || '----'}
        </div>
      </MarkPriceTitle>
    )
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps, ['markPrice'])
)
