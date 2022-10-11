import React, { useRef, useEffect, useState, useMemo } from 'react'
import Big from 'big.js'
import isEqualLodash from 'lodash/isEqual'
import useInterval from '../hooks/useInterval'
import usePrevious from '../hooks/usePrevious'
import {
  isEqual,
  getDecimalCount,
  getPrecisionDigits,
  usdFormatter,
} from '../utils/'
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
  setStoreSelector,
} from '../stores/selectors'
import { Market } from '@project-serum/serum'
import { PerpMarket } from '@blockworks-foundation/mango-client'

const Line = (props) => {
  return (
    <div
      className={`${props.className}`}
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
  const market = useMangoStore(marketSelector)
  const markPrice = useMarkPrice()

  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const currentOrderbookData = useRef<any>(null)
  const nextOrderbookData = useRef<any>(null)
  const previousDepth = usePrevious(depth)

  const [openOrderPrices, setOpenOrderPrices] = useState<any[]>([])
  const [orderbookData, setOrderbookData] = useState<any | null>(null)
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
    const orderbook = useMangoStore.getState().selectedMarket.orderBook
    if (
      nextOrderbookData?.current &&
      (!isEqualLodash(
        currentOrderbookData.current,
        nextOrderbookData.current
      ) ||
        previousDepth !== depth ||
        previousGrouping !== grouping)
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
  }, 400)

  useEffect(
    () =>
      useMangoStore.subscribe(
        (state) =>
          (nextOrderbookData.current = {
            bids: state.selectedMarket.orderBook?.bids,
            asks: state.selectedMarket.orderBook?.asks,
          })
      ),
    []
  )

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
            <FloatingElement className="fadein-floating-element h-full">
              <div className="flex items-center justify-between pb-2.5">
                <div className="relative flex">
                  <Tooltip
                    content={
                      displayCumulativeSize
                        ? t('tooltip-display-step')
                        : t('tooltip-display-cumulative')
                    }
                    className="py-1 text-xs"
                  >
                    <button
                      onClick={() => {
                        setDisplayCumulativeSize(!displayCumulativeSize)
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-th-bkg-4 focus:outline-none md:hover:text-th-primary"
                    >
                      {displayCumulativeSize ? (
                        <StepSizeIcon className="h-4 w-4" />
                      ) : (
                        <CumulativeSizeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </Tooltip>
                </div>
                <ElementTitle noMarginBottom>{t('orderbook')}</ElementTitle>
                <div className="relative flex">
                  <Tooltip
                    content={t('tooltip-switch-layout')}
                    className="py-1 text-xs"
                  >
                    <button
                      onClick={handleLayoutChange}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-th-bkg-4 focus:outline-none md:hover:text-th-primary"
                    >
                      <SwitchHorizontalIcon className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              </div>
              <div className="mb-3 flex items-center justify-end">
                <MarkPriceComponent markPrice={markPrice} />
                <GroupSize
                  tickSize={market?.tickSize}
                  onChange={onGroupSizeChange}
                  value={grouping}
                  className="relative flex w-1/3 flex-col items-end"
                />
              </div>
              <div
                className={`mb-2 flex justify-between text-xs text-th-fgd-4`}
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
              <OrderbookSpread orderbookData={orderbookData} />
            </FloatingElement>
          </FlipCardFront>
        ) : (
          <FlipCardBack>
            <FloatingElement className="fadein-floating-element h-full">
              <div className="flex items-center justify-between pb-2.5">
                <div className="relative flex">
                  <Tooltip
                    content={
                      displayCumulativeSize
                        ? t('tooltip-display-step')
                        : t('tooltip-display-cumulative')
                    }
                    className="py-1 text-xs"
                  >
                    <button
                      onClick={() => {
                        setDisplayCumulativeSize(!displayCumulativeSize)
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-th-bkg-3 focus:outline-none md:hover:text-th-primary"
                    >
                      {displayCumulativeSize ? (
                        <StepSizeIcon className="h-5 w-5" />
                      ) : (
                        <CumulativeSizeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </Tooltip>
                </div>
                <ElementTitle noMarginBottom>{t('orderbook')}</ElementTitle>
                <div className="relative flex">
                  <Tooltip
                    content={t('tooltip-switch-layout')}
                    className="py-1 text-xs"
                  >
                    <button
                      onClick={handleLayoutChange}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-th-bkg-3 focus:outline-none md:hover:text-th-primary"
                    >
                      <SwitchHorizontalIcon className="h-5 w-5" />
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
                  className="relative flex w-1/3 flex-col items-end"
                />
              </div>
              <div className={`mb-2 flex justify-between text-th-fgd-4`}>
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
              <div className="my-2 flex justify-between rounded-md bg-th-bkg-2 p-2 text-xs">
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
        <div className="relative flex">
          <button
            onClick={() => {
              setDisplayCumulativeSize(!displayCumulativeSize)
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-th-bkg-3 focus:outline-none md:hover:text-th-primary"
          >
            {displayCumulativeSize ? (
              <StepSizeIcon className="h-5 w-5" />
            ) : (
              <CumulativeSizeIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        <GroupSize
          tickSize={market?.tickSize}
          onChange={onGroupSizeChange}
          value={grouping}
          className="relative mb-1 flex w-1/3 flex-col items-end"
        />
      </div>
      <div className={`flex justify-between text-th-fgd-4`}>
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
      <OrderbookSpread orderbookData={orderbookData} />
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

const OrderbookSpread = ({ orderbookData }) => {
  const { t } = useTranslation('common')
  const selectedMarket = useMangoStore((s) => s.selectedMarket.current)
  const decimals = useMemo(() => {
    if (selectedMarket) {
      return getPrecisionDigits(selectedMarket?.tickSize)
    }
    return 2
  }, [selectedMarket])

  return (
    <div className="my-2 flex justify-between rounded-md bg-th-bkg-2 p-2 text-xs">
      <div className="hidden text-th-fgd-3 sm:block">{t('spread')}</div>
      <div className="text-th-fgd-1">
        {orderbookData?.spread.toFixed(decimals)}
      </div>
      <div className="text-th-fgd-1">
        {orderbookData?.spreadPercentage.toFixed(2)}%
      </div>
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
  }: {
    side: 'buy' | 'sell'
    price: number
    size: number
    sizePercent: number
    hasOpenOrder: boolean
    invert: boolean
    grouping: number
    market: Market | PerpMarket
  }) => {
    const element = useRef<HTMLDivElement>(null)
    const setMangoStore = useMangoStore(setStoreSelector)
    const [showOrderbookFlash] = useLocalStorageState(ORDERBOOK_FLASH_KEY, true)
    const flashClassName = side === 'sell' ? 'red-flash' : 'green-flash'

    useEffect(() => {
      showOrderbookFlash &&
        !element.current?.classList.contains(flashClassName) &&
        element.current?.classList.add(flashClassName)
      const id = setTimeout(
        () =>
          element.current?.classList.contains(flashClassName) &&
          element.current?.classList.remove(flashClassName),
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
        state.tradeForm.price = Number(formattedPrice)
      })
    }

    const handleSizeClick = () => {
      setMangoStore((state) => {
        state.tradeForm.baseSize = Number(formattedSize)
      })
    }

    if (!market) return null

    const groupingDecimalCount = getDecimalCount(grouping)
    const minOrderSizeDecimals = getDecimalCount(market.minOrderSize)

    return (
      <div
        className={`relative flex cursor-pointer justify-between text-sm leading-6`}
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
            <div className="flex w-full items-center justify-between hover:font-semibold">
              <div
                onClick={handlePriceClick}
                className={`z-10 text-xs leading-5 md:pl-5 md:leading-6 ${
                  side === 'buy'
                    ? `text-th-green`
                    : `text-th-red brightness-125`
                }`}
              >
                {usdFormatter(formattedPrice, groupingDecimalCount, false)}
              </div>

              <div
                className={`z-10 text-xs ${
                  hasOpenOrder ? 'text-th-primary' : 'text-th-fgd-2'
                }`}
                onClick={handleSizeClick}
              >
                {usdFormatter(formattedSize, minOrderSizeDecimals, false)}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex w-full items-center justify-between hover:font-semibold">
              <div
                className={`z-10 text-xs leading-5 md:leading-6 ${
                  hasOpenOrder ? 'text-th-primary' : 'text-th-fgd-2'
                }`}
                onClick={handleSizeClick}
              >
                {usdFormatter(formattedSize, minOrderSizeDecimals, false)}
              </div>
              <div
                className={`z-10 text-xs leading-5 md:pr-4 md:leading-6 ${
                  side === 'buy'
                    ? `text-th-green`
                    : `text-th-red brightness-125`
                }`}
                onClick={handlePriceClick}
              >
                {usdFormatter(formattedPrice, groupingDecimalCount, false)}
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
    isEqual(prevProps, nextProps, [
      'price',
      'size',
      'sizePercent',
      'hasOpenOrder',
    ])
)

const MarkPriceComponent = React.memo<{ markPrice: number }>(
  ({ markPrice }) => {
    const previousMarkPrice: number = usePrevious(markPrice)

    return (
      <div
        className={`flex items-center justify-center font-bold md:w-1/3 md:text-base ${
          markPrice > previousMarkPrice
            ? `text-th-green`
            : markPrice < previousMarkPrice
            ? `text-th-red`
            : `text-th-fgd-1`
        }`}
      >
        {markPrice > previousMarkPrice && (
          <ArrowUpIcon className={`mr-1 h-4 w-4 text-th-green`} />
        )}
        {markPrice < previousMarkPrice && (
          <ArrowDownIcon className={`mr-1 h-4 w-4 text-th-red`} />
        )}
        {markPrice || '----'}
      </div>
    )
  },
  (prevProps, nextProps) => isEqual(prevProps, nextProps, ['markPrice'])
)
