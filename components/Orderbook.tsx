import React, { useRef, useEffect, useState } from 'react'
import Big from 'big.js'
import { isEqual as isEqualLodash } from 'lodash'
import useInterval from '../hooks/useInterval'
import usePrevious from '../hooks/usePrevious'
import { isEqual, getDecimalCount, usdFormatter } from '../utils/'
import {
  ArrowUpIcon,
  ArrowDownIcon,
  SwitchHorizontalIcon,
} from '@heroicons/react/solid'
import { CumulativeSizeIcon, StepSizeIcon } from './icons'
import useMarkPrice from '../hooks/useMarkPrice'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import Tooltip from './Tooltip'
import GroupSize from './GroupSize'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import {
  FlipCard,
  FlipCardBack,
  FlipCardFront,
  FlipCardInner,
} from './FlipCard'
import { useTranslation } from 'next-i18next'
import FloatingElement from './FloatingElement'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { ORDERBOOK_FLASH_KEY } from './SettingsModal'
import {
  mangoGroupConfigSelector,
  marketConfigSelector,
  marketSelector,
  orderbookSelector,
  setStoreSelector,
} from '../stores/selectors'

const Line = (props) => {
  return (
    <div
      className={props.className}
      style={{
        textAlign: props.invert ? 'left' : 'right',
        height: '100%',
        width: `${props['data-width'] ? props['data-width'] : ''}`,
      }}
    />
  )
}

const groupBy = (ordersArray, market, grouping: number, isBids: boolean) => {
  if (!ordersArray || !market || !grouping || grouping == market?.tickSize) {
    return ordersArray || []
  }
  const groupFloors = {}
  for (let i = 0; i < ordersArray.length; i++) {
    if (typeof ordersArray[i] == 'undefined') {
      break
    }
    const bigGrouping = Big(grouping)
    const bigOrder = Big(ordersArray[i][0])

    const floor = isBids
      ? bigOrder.div(bigGrouping).round(0, Big.roundDown).times(bigGrouping)
      : bigOrder.div(bigGrouping).round(0, Big.roundUp).times(bigGrouping)
    if (typeof groupFloors[floor] == 'undefined') {
      groupFloors[floor] = ordersArray[i][1]
    } else {
      groupFloors[floor] = ordersArray[i][1] + groupFloors[floor]
    }
  }
  const sortedGroups = Object.entries(groupFloors)
    .map((entry) => {
      return [
        +parseFloat(entry[0]).toFixed(getDecimalCount(grouping)),
        entry[1],
      ]
    })
    .sort(function (a: number[], b: number[]) {
      if (!a || !b) {
        return -1
      }
      return isBids ? b[0] - a[0] : a[0] - b[0]
    })
  return sortedGroups
}

const getCumulativeOrderbookSide = (
  orders,
  totalSize,
  maxSize,
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
        maxSizePercent: Math.round((size / (maxSize || 1)) * 100),
      })
      return cumulative
    }, [])
  if (backwards) {
    cumulative = cumulative.reverse()
  }
  return cumulative
}

const hasOpenOrderForPriceGroup = (openOrderPrices, price, grouping) => {
  return !!openOrderPrices.find((ooPrice) => {
    return ooPrice >= parseFloat(price) && ooPrice < price + grouping
  })
}

export default function Orderbook({ depth = 8 }) {
  const { t } = useTranslation('common')
  const groupConfig = useMangoStore(mangoGroupConfigSelector)
  const marketConfig = useMangoStore(marketConfigSelector)
  const orderbook = useMangoStore(orderbookSelector)
  const market = useMangoStore(marketSelector)
  const markPrice = useMarkPrice()

  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const currentOrderbookData = useRef(null)
  const nextOrderbookData = useRef(null)
  const previousDepth = usePrevious(depth)

  const [openOrderPrices, setOpenOrderPrices] = useState([])
  const [orderbookData, setOrderbookData] = useState(null)
  const [defaultLayout, setDefaultLayout] = useState(true)
  const [displayCumulativeSize, setDisplayCumulativeSize] = useState(false)
  const [grouping, setGrouping] = useState(0.01)
  const [tickSize, setTickSize] = useState(0)
  const previousGrouping = usePrevious(grouping)

  useEffect(() => {
    if (market && market.tickSize !== tickSize) {
      setTickSize(market.tickSize)
      setGrouping(market.tickSize)
    }
  }, [market])

  useInterval(() => {
    if (
      !currentOrderbookData.current ||
      !isEqualLodash(
        currentOrderbookData.current.bids,
        nextOrderbookData.current.bids
      ) ||
      !isEqualLodash(
        currentOrderbookData.current.asks,
        nextOrderbookData.current.asks
      ) ||
      previousDepth !== depth ||
      previousGrouping !== grouping
    ) {
      // check if user has open orders so we can highlight them on orderbook
      const openOrders =
        useMangoStore.getState().selectedMangoAccount.openOrders
      const newOpenOrderPrices = openOrders?.length
        ? openOrders
            .filter(({ market }) =>
              market.account.publicKey.equals(marketConfig.publicKey)
            )
            .map(({ order }) => order.price)
        : []
      if (!isEqualLodash(newOpenOrderPrices, openOrderPrices)) {
        setOpenOrderPrices(newOpenOrderPrices)
      }

      // updated orderbook data
      const bids = groupBy(orderbook?.bids, market, grouping, true) || []
      const asks = groupBy(orderbook?.asks, market, grouping, false) || []

      const sum = (total, [, size], index) =>
        index < depth ? total + size : total
      const totalSize = bids.reduce(sum, 0) + asks.reduce(sum, 0)
      const maxSize =
        Math.max(
          ...asks.map(function (a) {
            return a[1]
          })
        ) +
        Math.max(
          ...bids.map(function (b) {
            return b[1]
          })
        )

      const bidsToDisplay = defaultLayout
        ? getCumulativeOrderbookSide(bids, totalSize, maxSize, depth, false)
        : getCumulativeOrderbookSide(bids, totalSize, maxSize, depth / 2, false)
      const asksToDisplay = defaultLayout
        ? getCumulativeOrderbookSide(asks, totalSize, maxSize, depth, false)
        : getCumulativeOrderbookSide(
            asks,
            totalSize,
            maxSize,
            (depth + 1) / 2,
            true
          )

      currentOrderbookData.current = {
        bids: orderbook?.bids,
        asks: orderbook?.asks,
      }
      if (bidsToDisplay[0] || asksToDisplay[0]) {
        const bid = bidsToDisplay[0]?.price
        const ask = defaultLayout
          ? asksToDisplay[0]?.price
          : asksToDisplay[asksToDisplay.length - 1]?.price
        let spread = 0,
          spreadPercentage = 0
        if (bid && ask) {
          spread = ask - bid
          spreadPercentage = (spread / ask) * 100
        }

        setOrderbookData({
          bids: bidsToDisplay,
          asks: isMobile ? asksToDisplay.reverse() : asksToDisplay,
          spread,
          spreadPercentage,
        })
      } else {
        setOrderbookData(null)
      }
    }
  }, 500)

  useEffect(() => {
    nextOrderbookData.current = {
      bids: orderbook?.bids,
      asks: orderbook?.asks,
    }
  }, [orderbook])

  const handleLayoutChange = () => {
    setDefaultLayout(!defaultLayout)
    setOrderbookData((prevState) => ({
      ...orderbookData,
      asks: prevState.asks.reverse(),
    }))
  }

  const onGroupSizeChange = (groupSize) => {
    setGrouping(groupSize)
  }

  return !isMobile ? (
    <FlipCard>
      <FlipCardInner flip={defaultLayout}>
        {defaultLayout ? (
          <FlipCardFront>
            <FloatingElement className="h-full fadein-floating-element">
              <div className="flex items-center justify-between pb-2.5">
                <div className="flex relative">
                  <Tooltip
                    content={
                      displayCumulativeSize
                        ? t('tooltip-display-step')
                        : t('tooltip-display-cumulative')
                    }
                    className="text-xs py-1"
                  >
                    <button
                      onClick={() => {
                        setDisplayCumulativeSize(!displayCumulativeSize)
                      }}
                      className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
                    >
                      {displayCumulativeSize ? (
                        <StepSizeIcon className="w-5 h-5" />
                      ) : (
                        <CumulativeSizeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </Tooltip>
                </div>
                <ElementTitle noMarignBottom>{t('orderbook')}</ElementTitle>
                <div className="flex relative">
                  <Tooltip
                    content={t('tooltip-switch-layout')}
                    className="text-xs py-1"
                  >
                    <button
                      onClick={handleLayoutChange}
                      className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
                    >
                      <SwitchHorizontalIcon className="w-5 h-5" />
                    </button>
                  </Tooltip>
                </div>
              </div>
              <div className="flex justify-end items-center mb-4">
                <MarkPriceComponent markPrice={markPrice} />
                <GroupSize
                  tickSize={market?.tickSize}
                  onChange={onGroupSizeChange}
                  value={grouping}
                  className="relative flex flex-col w-1/3 items-end"
                />
              </div>
              <div
                className={`text-th-fgd-4 flex justify-between mb-2 text-xs`}
              >
                <div className={`text-left`}>
                  {displayCumulativeSize ? 'Cumulative ' : ''}
                  {t('size')} ({marketConfig.baseSymbol})
                </div>
                <div className={`text-center`}>
                  {`${t('price')} (${groupConfig.quoteSymbol})`}
                </div>
                <div className={`text-right`}>
                  {displayCumulativeSize ? 'Cumulative ' : ''}
                  {t('size')} ({marketConfig.baseSymbol})
                </div>
              </div>
              <div className="flex">
                <div className="w-1/2">
                  {orderbookData?.bids.map(
                    ({
                      price,
                      size,
                      cumulativeSize,
                      sizePercent,
                      maxSizePercent,
                    }) => (
                      <OrderbookRow
                        market={market}
                        hasOpenOrder={hasOpenOrderForPriceGroup(
                          openOrderPrices,
                          price,
                          grouping
                        )}
                        key={price + ''}
                        price={price}
                        size={displayCumulativeSize ? cumulativeSize : size}
                        side="buy"
                        sizePercent={
                          displayCumulativeSize ? maxSizePercent : sizePercent
                        }
                        grouping={grouping}
                      />
                    )
                  )}
                </div>
                <div className="w-1/2">
                  {orderbookData?.asks.map(
                    ({
                      price,
                      size,
                      cumulativeSize,
                      sizePercent,
                      maxSizePercent,
                    }) => (
                      <OrderbookRow
                        market={market}
                        hasOpenOrder={hasOpenOrderForPriceGroup(
                          openOrderPrices,
                          price,
                          grouping
                        )}
                        invert
                        key={price + ''}
                        price={price}
                        size={displayCumulativeSize ? cumulativeSize : size}
                        side="sell"
                        sizePercent={
                          displayCumulativeSize ? maxSizePercent : sizePercent
                        }
                        grouping={grouping}
                      />
                    )
                  )}
                </div>
              </div>
              <div className="flex justify-between bg-th-bkg-1 p-2 mt-4 rounded-md text-xs">
                <div className="text-th-fgd-3">{t('spread')}</div>
                <div className="text-th-fgd-1">
                  {orderbookData?.spread?.toFixed(2)}
                </div>
                <div className="text-th-fgd-1">
                  {orderbookData?.spreadPercentage?.toFixed(2)}%
                </div>
              </div>
            </FloatingElement>
          </FlipCardFront>
        ) : (
          <FlipCardBack>
            <FloatingElement className="h-full fadein-floating-element">
              <div className="flex items-center justify-between pb-2.5">
                <div className="flex relative">
                  <Tooltip
                    content={
                      displayCumulativeSize
                        ? t('tooltip-display-step')
                        : t('tooltip-display-cumulative')
                    }
                    className="text-xs py-1"
                  >
                    <button
                      onClick={() => {
                        setDisplayCumulativeSize(!displayCumulativeSize)
                      }}
                      className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
                    >
                      {displayCumulativeSize ? (
                        <StepSizeIcon className="w-5 h-5" />
                      ) : (
                        <CumulativeSizeIcon className="w-5 h-5" />
                      )}
                    </button>
                  </Tooltip>
                </div>
                <ElementTitle noMarignBottom>{t('orderbook')}</ElementTitle>
                <div className="flex relative">
                  <Tooltip
                    content={t('tooltip-switch-layout')}
                    className="text-xs py-1"
                  >
                    <button
                      onClick={handleLayoutChange}
                      className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
                    >
                      <SwitchHorizontalIcon className="w-5 h-5" />
                    </button>
                  </Tooltip>
                </div>
              </div>
              <div className="flex flex-row items-center justify-end pb-2">
                <MarkPriceComponent markPrice={markPrice} />
                <GroupSize
                  tickSize={market?.tickSize}
                  onChange={onGroupSizeChange}
                  value={grouping}
                  className="relative flex flex-col w-1/3 items-end"
                />
              </div>
              <div className={`text-th-fgd-4 flex justify-between mb-2`}>
                <div className={`text-left text-xs`}>
                  {displayCumulativeSize ? 'Cumulative ' : ''}
                  {t('size')} ({marketConfig.baseSymbol})
                </div>
                <div className={`text-right text-xs`}>
                  {`${t('price')} (${groupConfig.quoteSymbol})`}
                </div>
              </div>
              {orderbookData?.asks.map(
                ({
                  price,
                  size,
                  cumulativeSize,
                  sizePercent,
                  maxSizePercent,
                }) => (
                  <OrderbookRow
                    market={market}
                    hasOpenOrder={hasOpenOrderForPriceGroup(
                      openOrderPrices,
                      price,
                      grouping
                    )}
                    key={price + ''}
                    price={price}
                    size={displayCumulativeSize ? cumulativeSize : size}
                    side="sell"
                    sizePercent={
                      displayCumulativeSize ? maxSizePercent : sizePercent
                    }
                    grouping={grouping}
                  />
                )
              )}
              <div className="flex justify-between bg-th-bkg-1 p-2 my-2 rounded-md text-xs">
                <div className="text-th-fgd-3">{t('spread')}</div>
                <div className="text-th-fgd-1">
                  {orderbookData?.spread.toFixed(2)}
                </div>
                <div className="text-th-fgd-1">
                  {orderbookData?.spreadPercentage.toFixed(2)}%
                </div>
              </div>
              {orderbookData?.bids.map(
                ({
                  price,
                  size,
                  cumulativeSize,
                  sizePercent,
                  maxSizePercent,
                }) => (
                  <OrderbookRow
                    market={market}
                    hasOpenOrder={hasOpenOrderForPriceGroup(
                      openOrderPrices,
                      price,
                      grouping
                    )}
                    key={price + ''}
                    price={price}
                    size={displayCumulativeSize ? cumulativeSize : size}
                    side="buy"
                    sizePercent={
                      displayCumulativeSize ? maxSizePercent : sizePercent
                    }
                    grouping={grouping}
                  />
                )
              )}
            </FloatingElement>
          </FlipCardBack>
        )}
      </FlipCardInner>
    </FlipCard>
  ) : (
    <div>
      <div className="flex items-center justify-between pb-2.5">
        <div className="flex relative">
          <Tooltip
            content={
              displayCumulativeSize
                ? t('tooltip-display-step')
                : t('tooltip-display-cumulative')
            }
            className="text-xs py-1"
          >
            <button
              onClick={() => {
                setDisplayCumulativeSize(!displayCumulativeSize)
              }}
              className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8 hover:text-th-primary focus:outline-none"
            >
              {displayCumulativeSize ? (
                <StepSizeIcon className="w-5 h-5" />
              ) : (
                <CumulativeSizeIcon className="w-5 h-5" />
              )}
            </button>
          </Tooltip>
        </div>

        <GroupSize
          tickSize={market?.tickSize}
          onChange={onGroupSizeChange}
          value={grouping}
          className="relative flex flex-col w-1/3 items-end mb-1"
        />
      </div>
      <div className={`text-th-fgd-4 flex justify-between`}>
        <div className={`text-left text-xs`}>
          {displayCumulativeSize ? 'Cumulative ' : ''}
          {t('size')}
        </div>
        <div className={`text-right text-xs`}>{t('price')}</div>
      </div>
      {orderbookData?.asks.map(
        ({ price, size, cumulativeSize, sizePercent, maxSizePercent }) => (
          <OrderbookRow
            market={market}
            hasOpenOrder={hasOpenOrderForPriceGroup(
              openOrderPrices,
              price,
              grouping
            )}
            key={price + ''}
            price={price}
            size={displayCumulativeSize ? cumulativeSize : size}
            side="sell"
            sizePercent={displayCumulativeSize ? maxSizePercent : sizePercent}
            grouping={grouping}
          />
        )
      )}
      <div className="flex justify-between bg-th-bkg-1 p-2 my-2 rounded-md text-xs">
        <div className="hidden sm:block text-th-fgd-3">{t('spread')}</div>
        <div className="text-th-fgd-1">{orderbookData?.spread.toFixed(2)}</div>
        <div className="text-th-fgd-1">
          {orderbookData?.spreadPercentage.toFixed(2)}%
        </div>
      </div>
      {orderbookData?.bids.map(
        ({ price, size, cumulativeSize, sizePercent, maxSizePercent }) => (
          <OrderbookRow
            market={market}
            hasOpenOrder={hasOpenOrderForPriceGroup(
              openOrderPrices,
              price,
              grouping
            )}
            key={price + ''}
            price={price}
            size={displayCumulativeSize ? cumulativeSize : size}
            side="buy"
            sizePercent={displayCumulativeSize ? maxSizePercent : sizePercent}
            grouping={grouping}
          />
        )
      )}
    </div>
  )
}

const OrderbookRow = React.memo<any>(
  ({
    side,
    price,
    size,
    sizePercent,
    invert,
    hasOpenOrder,
    market,
    grouping,
  }) => {
    const element = useRef(null)
    const setMangoStore = useMangoStore(setStoreSelector)
    const [showOrderbookFlash] = useLocalStorageState(ORDERBOOK_FLASH_KEY, true)

    useEffect(() => {
      showOrderbookFlash &&
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
        ? Number(size).toFixed(getDecimalCount(market.minOrderSize))
        : size

    const formattedPrice =
      market?.tickSize && !isNaN(price)
        ? Number(price).toFixed(getDecimalCount(market.tickSize))
        : price

    const handlePriceClick = () => {
      setMangoStore((state) => {
        state.tradeForm.price = price
      })
    }

    const handleSizeClick = () => {
      setMangoStore((state) => {
        state.tradeForm.baseSize = size
      })
    }

    if (!market) return null

    return (
      <div
        className={`flex relative text-sm leading-7 justify-between cursor-pointer`}
        ref={element}
      >
        {invert ? (
          <>
            <Line
              invert
              data-width={sizePercent + '%'}
              className={`absolute left-0 ${
                side === 'buy' ? `bg-th-green-muted` : `bg-th-red-muted`
              }`}
            />
            <div className="flex justify-between w-full">
              <div
                onClick={handlePriceClick}
                className={`z-10 text-xs md:text-sm leading-5 md:leading-7 text-th-fgd-1 md:pl-2 ${
                  side === 'buy' ? `text-th-green` : `text-th-red`
                }`}
              >
                {usdFormatter(formattedPrice, getDecimalCount(grouping), false)}
              </div>

              <div
                className={`z-10 ${
                  hasOpenOrder ? 'text-th-primary' : 'text-th-fgd-3'
                }`}
                onClick={handleSizeClick}
              >
                {formattedSize}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between w-full">
              <div
                className={`z-10 text-xs md:text-sm leading-5 md:leading-7 ${
                  hasOpenOrder ? 'text-th-primary' : 'text-th-fgd-3'
                }`}
                onClick={handleSizeClick}
              >
                {formattedSize}
              </div>
              <div
                className={`z-10 text-xs md:text-sm leading-5 md:leading-7 md:pr-2 ${
                  side === 'buy' ? `text-th-green` : `text-th-red`
                }`}
                onClick={handlePriceClick}
              >
                {usdFormatter(formattedPrice, getDecimalCount(grouping), false)}
              </div>
            </div>

            <Line
              className={`absolute right-0 ${
                side === 'buy' ? `bg-th-green-muted` : `bg-th-red-muted`
              }`}
              data-width={sizePercent + '%'}
            />
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
    const previousMarkPrice: number = usePrevious(markPrice)

    return (
      <div
        className={`flex justify-center items-center font-bold md:text-lg md:w-1/3 ${
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
        {markPrice || '----'}
      </div>
    )
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps, ['markPrice'])
)
