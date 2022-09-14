import { useEffect, useRef, useState, useMemo } from 'react'
import { useTheme } from 'next-themes'
import {
  widget,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString,
} from '../public/charting_library'
import { CHART_DATA_FEED } from '../utils/chartDataConnector'
import useMangoStore from '../stores/useMangoStore'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { Order, Market } from '@project-serum/serum/lib/market'
import { PerpOrder, PerpMarket } from '@blockworks-foundation/mango-client'
import { notify } from '../utils/notifications'
import { sleep, formatUsdValue, usdFormatter, roundPerpSize } from '../utils'
import { PerpTriggerOrder } from '../@types/types'
import { useTranslation } from 'next-i18next'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { useWallet, Wallet } from '@solana/wallet-adapter-react'
import dayjs from 'dayjs'

export interface ChartContainerProps {
  container: ChartingLibraryWidgetOptions['container']
  symbol: ChartingLibraryWidgetOptions['symbol']
  interval: ChartingLibraryWidgetOptions['interval']
  datafeedUrl: string
  libraryPath: ChartingLibraryWidgetOptions['library_path']
  chartsStorageUrl: ChartingLibraryWidgetOptions['charts_storage_url']
  chartsStorageApiVersion: ChartingLibraryWidgetOptions['charts_storage_api_version']
  clientId: ChartingLibraryWidgetOptions['client_id']
  userId: ChartingLibraryWidgetOptions['user_id']
  fullscreen: ChartingLibraryWidgetOptions['fullscreen']
  autosize: ChartingLibraryWidgetOptions['autosize']
  studiesOverrides: ChartingLibraryWidgetOptions['studies_overrides']
  theme: string
}

const SHOW_ORDER_LINES_KEY = 'showOrderLines-0.1'
const SHOW_TRADE_EXECUTIONS_KEY = 'showTradeExecutions-0.1'
const TRADE_EXECUTION_LIMIT = 100

const TVChartContainer = () => {
  const { t } = useTranslation(['common', 'tv-chart'])
  const { theme } = useTheme()
  const { width } = useViewport()
  const { wallet, publicKey } = useWallet()
  const [chartReady, setChartReady] = useState(false)
  const [showOrderLinesLocalStorage, toggleShowOrderLinesLocalStorage] =
    useLocalStorageState(SHOW_ORDER_LINES_KEY, true)
  const [showOrderLines, toggleShowOrderLines] = useState(
    showOrderLinesLocalStorage
  )
  const [showTradeExecutionsLocalStorage, toggleShowTradeExecutionsLocalStorage] =
    useLocalStorageState(SHOW_TRADE_EXECUTIONS_KEY, true)
  const [showTradeExecutions, toggleShowTradeExecutions] = useState(
    showTradeExecutionsLocalStorage
  )
  const setMangoStore = useMangoStore.getState().set
  const selectedMarketConfig = useMangoStore((s) => s.selectedMarket.config)
  const actions = useMangoStore((s) => s.actions)
  const isMobile = width ? width < breakpoints.sm : false
  const mangoClient = useMangoStore.getState().connection.client
  const selectedMarketName = selectedMarketConfig.name
  const tradeExecutions = useMangoStore((s) => s.tradingView.tradeExecutions)
  const tradeHistoryAndLiquidations = useMangoStore((s) => s.tradeHistory.parsed)
  const tradeHistory = tradeHistoryAndLiquidations.filter((t) => !('liqor' in t))

  // @ts-ignore
  const defaultProps: ChartContainerProps = useMemo(
    () => ({
      symbol: selectedMarketConfig.name,
      interval: '60' as ResolutionString,
      theme: 'Dark',
      container: 'tv_chart_container',
      datafeedUrl: CHART_DATA_FEED,
      libraryPath: '/charting_library/',
      chartsStorageUrl: 'https://trading-view-backend.herokuapp.com',
      chartsStorageApiVersion: '1.1',
      clientId: 'mango.markets',
      userId: '',
      fullscreen: false,
      autosize: true,
      studiesOverrides: {
        'volume.volume.color.0': theme === 'Mango' ? '#E54033' : '#CC2929',
        'volume.volume.color.1': theme === 'Mango' ? '#AFD803' : '#5EBF4D',
        'volume.precision': 4,
      },
    }),
    [selectedMarketConfig.name, theme]
  )

  const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null)

  useEffect(() => {
    if (showOrderLines !== showOrderLinesLocalStorage) {
      toggleShowOrderLinesLocalStorage(showOrderLines)
    }
  }, [showOrderLines])

  useEffect(() => {
    if (showTradeExecutions !== showTradeExecutionsLocalStorage) {
      toggleShowTradeExecutionsLocalStorage(showTradeExecutions)
    }
  }, [showTradeExecutions])

  useEffect(() => {
    if (
      chartReady &&
      tvWidgetRef.current &&
      selectedMarketConfig.name !== tvWidgetRef.current?.activeChart()?.symbol()
    ) {
      tvWidgetRef.current.setSymbol(
        selectedMarketConfig.name,
        tvWidgetRef.current.activeChart().resolution(),
        () => {
          if (showOrderLines) {
            const openOrders =
              useMangoStore.getState().selectedMangoAccount.openOrders
            deleteLines()
            drawLinesForMarket(openOrders)
          }
          if (showTradeExecutions) {
            drawTradeExecutions()
          }
        }
      )
    }
  }, [selectedMarketConfig.name, chartReady])

  let chartStyleOverrides = {
    'paneProperties.background': 'rgba(0,0,0,0)',
    'paneProperties.backgroundType': 'solid',
    'paneProperties.legendProperties.showBackground': false,
    'paneProperties.vertGridProperties.color': 'rgba(0,0,0,0)',
    'paneProperties.horzGridProperties.color': 'rgba(0,0,0,0)',
    'paneProperties.legendProperties.showStudyTitles': false,
    'scalesProperties.showStudyLastValue': false,
  }

  const mainSeriesProperties = [
    'candleStyle',
    'hollowCandleStyle',
    'haStyle',
    'barStyle',
  ]
  mainSeriesProperties.forEach((prop) => {
    chartStyleOverrides = {
      ...chartStyleOverrides,
      [`mainSeriesProperties.${prop}.barColorsOnPrevClose`]: true,
      [`mainSeriesProperties.${prop}.drawWick`]: true,
      [`mainSeriesProperties.${prop}.drawBorder`]: true,
      [`mainSeriesProperties.${prop}.upColor`]:
        theme === 'Mango' ? '#AFD803' : '#5EBF4D',
      [`mainSeriesProperties.${prop}.downColor`]:
        theme === 'Mango' ? '#E54033' : '#CC2929',
      [`mainSeriesProperties.${prop}.borderColor`]:
        theme === 'Mango' ? '#AFD803' : '#5EBF4D',
      [`mainSeriesProperties.${prop}.borderUpColor`]:
        theme === 'Mango' ? '#AFD803' : '#5EBF4D',
      [`mainSeriesProperties.${prop}.borderDownColor`]:
        theme === 'Mango' ? '#E54033' : '#CC2929',
      [`mainSeriesProperties.${prop}.wickUpColor`]:
        theme === 'Mango' ? '#AFD803' : '#5EBF4D',
      [`mainSeriesProperties.${prop}.wickDownColor`]:
        theme === 'Mango' ? '#E54033' : '#CC2929',
    }
  })

  useEffect(() => {
    const widgetOptions: ChartingLibraryWidgetOptions = {
      // debug: true,
      symbol: selectedMarketConfig.name,
      // BEWARE: no trailing slash is expected in feed URL
      // tslint:disable-next-line:no-any
      datafeed: new (window as any).Datafeeds.UDFCompatibleDatafeed(
        defaultProps.datafeedUrl
      ),
      interval:
        defaultProps.interval as ChartingLibraryWidgetOptions['interval'],
      container:
        defaultProps.container as ChartingLibraryWidgetOptions['container'],
      library_path: defaultProps.libraryPath as string,
      locale: 'en',
      enabled_features: ['hide_left_toolbar_by_default', 'study_templates'],
      disabled_features: [
        'use_localstorage_for_settings',
        'timeframes_toolbar',
        isMobile ? 'left_toolbar' : '',
        'show_logo_on_all_charts',
        'caption_buttons_text_if_possible',
        'header_settings',
        // 'header_chart_type',
        'header_compare',
        'compare_symbol',
        'header_screenshot',
        // 'header_widget_dom_node',
        // 'header_widget',
        !publicKey ? 'header_saveload' : '',
        'header_undo_redo',
        'header_interval_dialog_button',
        'show_interval_dialog_on_key_press',
        'header_symbol_search',
      ],
      // load_last_chart: true,
      charts_storage_url: defaultProps.chartsStorageUrl,
      charts_storage_api_version: defaultProps.chartsStorageApiVersion,
      client_id: defaultProps.clientId,
      user_id: publicKey ? publicKey.toString() : defaultProps.userId,
      fullscreen: defaultProps.fullscreen,
      autosize: defaultProps.autosize,
      studies_overrides: defaultProps.studiesOverrides,
      theme: theme === 'Light' ? 'Light' : 'Dark',
      custom_css_url: '/tradingview-chart.css',
      loading_screen: {
        backgroundColor:
          theme === 'Dark' ? '#101012' : theme === 'Light' ? '#fff' : '#141026',
      },
      overrides: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,

        ...chartStyleOverrides,
      },
    }

    const tvWidget = new widget(widgetOptions)
    tvWidgetRef.current = tvWidget

    // Create Show Order Lines button
    tvWidgetRef.current.onChartReady(function () {
      const button = tvWidgetRef?.current?.createButton()
      if (!button) {
        return
      }
      setChartReady(true)
      button.textContent = 'OL'
      if (showOrderLinesLocalStorage) {
        button.style.color =
          theme === 'Dark' || theme === 'Mango'
            ? 'rgb(242, 201, 76)'
            : 'rgb(255, 156, 36)'
      } else {
        button.style.color =
          theme === 'Dark' || theme === 'Mango'
            ? 'rgb(138, 138, 138)'
            : 'rgb(138, 138, 138)'
      }
      button.setAttribute('title', t('tv-chart:toggle-order-line'))
      button.addEventListener('click', toggleOrderLines)
    })

    // Create Show Trade Executions button
    tvWidgetRef.current.onChartReady(function () {
      const button = tvWidgetRef?.current?.createButton()
      if (!button) {
        return
      }
      setChartReady(true)
      button.textContent = 'TE'
      if (showTradeExecutionsLocalStorage) {
        button.style.color =
          theme === 'Dark' || theme === 'Mango'
            ? 'rgb(242, 201, 76)'
            : 'rgb(255, 156, 36)'
      } else {
        button.style.color =
          theme === 'Dark' || theme === 'Mango'
            ? 'rgb(138, 138, 138)'
            : 'rgb(138, 138, 138)'
      }
      button.setAttribute('title', t('tv-chart:toggle-trade-executions'))
      button.addEventListener('click', toggleTradeExecutions)
    })
    //eslint-disable-next-line
  }, [theme, isMobile, publicKey])

  function toggleTradeExecutions() {
    toggleShowTradeExecutions((prevState) => !prevState)
    if (
      this.style.color === 'rgb(255, 156, 36)' ||
      this.style.color === 'rgb(242, 201, 76)'
    ) {
      this.style.color =
        theme === 'Dark' || theme === 'Mango'
          ? 'rgb(138, 138, 138)'
          : 'rgb(138, 138, 138)'
    } else {
      this.style.color =
        theme === 'Dark' || theme === 'Mango'
          ? 'rgb(242, 201, 76)'
          : 'rgb(255, 156, 36)'
    }
  }

  function toggleOrderLines() {
    toggleShowOrderLines((prevState) => !prevState)
    if (
      this.style.color === 'rgb(255, 156, 36)' ||
      this.style.color === 'rgb(242, 201, 76)'
    ) {
      this.style.color =
        theme === 'Dark' || theme === 'Mango'
          ? 'rgb(138, 138, 138)'
          : 'rgb(138, 138, 138)'
    } else {
      this.style.color =
        theme === 'Dark' || theme === 'Mango'
          ? 'rgb(242, 201, 76)'
          : 'rgb(255, 156, 36)'
    }
  }

  const handleCancelOrder = async (
    order: Order | PerpOrder | PerpTriggerOrder,
    market: Market | PerpMarket,
    wallet: Wallet
  ) => {
    const selectedMangoGroup =
      useMangoStore.getState().selectedMangoGroup.current
    const selectedMangoAccount =
      useMangoStore.getState().selectedMangoAccount.current
    const mangoClient = useMangoStore.getState().connection.client
    let txid
    try {
      if (!selectedMangoGroup || !selectedMangoAccount) return
      if (market instanceof Market) {
        txid = await mangoClient.cancelSpotOrder(
          selectedMangoGroup,
          selectedMangoAccount,
          wallet?.adapter,
          // @ts-ignore
          market,
          order as Order
        )
      } else if (market instanceof PerpMarket) {
        if (order['triggerCondition']) {
          txid = await mangoClient.removeAdvancedOrder(
            selectedMangoGroup,
            selectedMangoAccount,
            wallet?.adapter,
            (order as PerpTriggerOrder).orderId
          )
        } else {
          txid = await mangoClient.cancelPerpOrder(
            selectedMangoGroup,
            selectedMangoAccount,
            wallet?.adapter,
            market,
            order as PerpOrder,
            false
          )
        }
      }
      notify({ title: t('cancel-success'), txid })
    } catch (e) {
      notify({
        title: t('cancel-error'),
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
      console.log('error', `${e}`)
    } finally {
      actions.reloadMangoAccount()
      actions.reloadOrders()
    }
  }

  const handleModifyOrder = async (
    order: Order | PerpOrder,
    market: Market | PerpMarket,
    price: number,
    wallet: Wallet
  ) => {
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const marketConfig = useMangoStore.getState().selectedMarket.config
    const askInfo =
      useMangoStore.getState().accountInfos[marketConfig.asksKey.toString()]
    const bidInfo =
      useMangoStore.getState().accountInfos[marketConfig.bidsKey.toString()]
    const referrerPk = useMangoStore.getState().referrerPk

    if (!wallet || !mangoGroup || !mangoAccount || !market) return

    try {
      const orderPrice = price

      if (!orderPrice) {
        notify({
          title: t('price-unavailable'),
          description: t('try-again'),
          type: 'error',
        })
      }
      const orderType = 'limit'
      let txid
      if (market instanceof Market) {
        txid = await mangoClient.modifySpotOrder(
          mangoGroup,
          mangoAccount,
          mangoGroup.mangoCache,
          // @ts-ignore
          market,
          wallet?.adapter,
          order as Order,
          order.side,
          orderPrice,
          order.size,
          orderType
        )
      } else {
        txid = await mangoClient.modifyPerpOrder(
          mangoGroup,
          mangoAccount,
          mangoGroup.mangoCache,
          market,
          wallet?.adapter,
          order as PerpOrder,
          order.side,
          orderPrice,
          order.size,
          orderType,
          0,
          order.side === 'buy' ? askInfo : bidInfo,
          false,
          referrerPk ? referrerPk : undefined
        )
      }

      notify({ title: t('successfully-placed'), txid })
    } catch (e) {
      notify({
        title: t('order-error'),
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
    } finally {
      sleep(1000).then(() => {
        actions.reloadMangoAccount()
        actions.reloadOrders()
      })
    }
  }

  function drawLine(order, market) {
    const orderSizeUi = roundPerpSize(order.size, market.config.baseSymbol)
    if (!tvWidgetRef?.current?.chart() || !wallet) return
    return tvWidgetRef.current
      .chart()
      .createOrderLine({ disableUndo: false })
      .onMove(function () {
        const currentOrderPrice = order.price
        const updatedOrderPrice = this.getPrice()
        const selectedMarketPrice =
          useMangoStore.getState().selectedMarket.markPrice
        if (!order.perpTrigger?.clientOrderId) {
          if (
            (order.side === 'buy' &&
              updatedOrderPrice > 1.05 * selectedMarketPrice) ||
            (order.side === 'sell' &&
              updatedOrderPrice < 0.95 * selectedMarketPrice)
          ) {
            tvWidgetRef.current?.showNoticeDialog({
              title: t('tv-chart:outside-range'),
              body:
                t('tv-chart:slippage-warning', {
                  updatedOrderPrice: formatUsdValue(updatedOrderPrice),
                  aboveBelow: order.side == 'buy' ? t('above') : t('below'),
                  selectedMarketPrice: formatUsdValue(selectedMarketPrice),
                }) +
                '<p><p>' +
                t('tv-chart:slippage-accept'),
              callback: () => {
                this.setPrice(currentOrderPrice)
              },
            })
          } else {
            tvWidgetRef.current?.showConfirmDialog({
              title: t('tv-chart:modify-order'),
              body: t('tv-chart:modify-order-details', {
                orderSize: orderSizeUi,
                baseSymbol: market.config.baseSymbol,
                orderSide: t(order.side),
                currentOrderPrice: currentOrderPrice,
                updatedOrderPrice: updatedOrderPrice,
              }),
              callback: (res) => {
                if (res) {
                  handleModifyOrder(
                    order,
                    market.account,
                    updatedOrderPrice,
                    wallet
                  )
                } else {
                  this.setPrice(currentOrderPrice)
                }
              },
            })
          }
        } else {
          tvWidgetRef.current?.showNoticeDialog({
            title: t('tv-chart:advanced-order'),
            body: t('tv-chart:advanced-order-details'),
            callback: () => {
              this.setPrice(currentOrderPrice)
            },
          })
        }
      })
      .onCancel(function () {
        tvWidgetRef.current?.showConfirmDialog({
          title: t('tv-chart:cancel-order'),
          body: t('tv-chart:cancel-order-details', {
            orderSize: orderSizeUi,
            baseSymbol: market.config.baseSymbol,
            orderSide: t(order.side),
            orderPrice: order.price,
          }),
          callback: (res) => {
            if (res) {
              handleCancelOrder(order, market.account, wallet)
            }
          },
        })
      })
      .setPrice(order.price)
      .setQuantity(orderSizeUi)
      .setText(getLineText(order, market))
      .setTooltip(
        order.perpTrigger?.clientOrderId
          ? `${order.orderType} Order #: ${order.orderId}`
          : `Order #: ${order.orderId}`
      )
      .setBodyTextColor(
        theme === 'Dark' ? '#F2C94C' : theme === 'Light' ? '#FF9C24' : '#F2C94C'
      )
      .setQuantityTextColor(
        theme === 'Dark' ? '#F2C94C' : theme === 'Light' ? '#FF9C24' : '#F2C94C'
      )
      .setCancelButtonIconColor(
        theme === 'Dark' ? '#F2C94C' : theme === 'Light' ? '#FF9C24' : '#F2C94C'
      )
      .setBodyBorderColor(
        order.perpTrigger?.clientOrderId
          ? '#FF9C24'
          : order.side == 'buy'
          ? '#4BA53B'
          : '#AA2222'
      )
      .setQuantityBorderColor(
        order.perpTrigger?.clientOrderId
          ? '#FF9C24'
          : order.side == 'buy'
          ? '#4BA53B'
          : '#AA2222'
      )
      .setCancelButtonBorderColor(
        order.perpTrigger?.clientOrderId
          ? '#FF9C24'
          : order.side == 'buy'
          ? '#4BA53B'
          : '#AA2222'
      )
      .setBodyBackgroundColor(
        theme === 'Dark' ? '#1B1B1F' : theme === 'Light' ? '#fff' : '#1D1832'
      )
      .setQuantityBackgroundColor(
        theme === 'Dark' ? '#1B1B1F' : theme === 'Light' ? '#fff' : '#1D1832'
      )
      .setCancelButtonBackgroundColor(
        theme === 'Dark' ? '#1B1B1F' : theme === 'Light' ? '#fff' : '#1D1832'
      )
      .setLineColor(
        order.perpTrigger?.clientOrderId
          ? '#FF9C24'
          : order.side == 'buy'
          ? '#4BA53B'
          : '#AA2222'
      )
      .setLineLength(3)
      .setLineWidth(2)
      .setLineStyle(1)
  }

  function getLineText(order, market) {
    const orderSideTranslated = t(order.side)
    if (order.perpTrigger?.clientOrderId) {
      const triggerPrice =
        order.perpTrigger.triggerPrice *
        Math.pow(10, market.config.baseDecimals - market.config.quoteDecimals)
      const orderTypeTranslated = t(order.orderType)
      const triggerConditionTranslated = t(order.perpTrigger.triggerCondition)
      if (order.side === 'buy') {
        if (order.perpTrigger.triggerCondition === 'above') {
          return (
            (order.orderType === 'market' ? t('stop-loss') : t('stop-limit')) +
            t('tv-chart:order-details', {
              orderType: orderTypeTranslated,
              orderSide: orderSideTranslated,
              triggerCondition: triggerConditionTranslated,
              triggerPrice: usdFormatter(triggerPrice),
            })
          )
        } else {
          return (
            t('take-profit') +
            t('tv-chart:order-details', {
              orderType: orderTypeTranslated,
              orderSide: orderSideTranslated,
              triggerCondition: triggerConditionTranslated,
              triggerPrice: usdFormatter(triggerPrice),
            })
          )
        }
      } else {
        if (order.perpTrigger.triggerCondition === 'below') {
          return (
            (order.orderType === 'market' ? t('stop-loss') : t('stop-limit')) +
            t('tv-chart:order-details', {
              orderType: orderTypeTranslated,
              orderSide: orderSideTranslated,
              triggerCondition: triggerConditionTranslated,
              triggerPrice: usdFormatter(triggerPrice),
            })
          )
        } else {
          return (
            t('take-profit') +
            t('tv-chart:order-details', {
              orderType: orderTypeTranslated,
              orderSide: orderSideTranslated,
              triggerCondition: triggerConditionTranslated,
              triggerPrice: usdFormatter(triggerPrice),
            })
          )
        }
      }
    } else {
      return `${orderSideTranslated} ${market.config.baseSymbol}`.toUpperCase()
    }
  }

  const drawTradeArrows = () => {
    const tradeArrows = useMangoStore.getState().tradingView.tradeArrows
    const newTradeArrows = new Map()
    if (tradeHistory?.length && chartReady && tvWidgetRef?.current) {
      console.log(`selectedMarketName: ${selectedMarketName}`)
      // console.log(`tradeHistory 1-20: ${JSON.stringify(tradeHistory.slice(0,20))}`)
      tradeHistory
        .filter(trade => {
          return trade.marketName === selectedMarketName && tradeArrows.get(`${trade.seqNum}${trade.marketName}`) === undefined
        })
        .forEach(trade => {
          const arrowID = tvWidgetRef.current?.chart().createShape({time: trade.loadTimestamp, price: trade.price}, {shape: trade.side === "buy" ? "arrow_up" : "arrow_down"})
          console.log(`Drawing ${trade.side} arrow at time: ${trade.loadTimestamp}, Price: ${trade.price}`)
          newTradeArrows.set(`${trade.seqNum}${trade.marketName}`, arrowID)
      })
    }
    setMangoStore((state) => {
      state.tradingView.tradeArrows = newTradeArrows
    })
  }

  const drawLinesForMarket = (openOrders) => {
    const newOrderLines = new Map()
    if (openOrders?.length) {
      for (const { order, market } of openOrders) {
        if (market.config.name == selectedMarketName) {
          newOrderLines.set(order.orderId.toString(), drawLine(order, market))
        }
      }
    }

    setMangoStore((state) => {
      state.tradingView.orderLines = newOrderLines
    })
  }

  const deleteLines = () => {
    const orderLines = useMangoStore.getState().tradingView.orderLines

    if (orderLines.size > 0) {
      orderLines?.forEach((value, key) => {
        orderLines.get(key)?.remove()
      })

      setMangoStore((state) => {
        state.tradingView.orderLines = new Map()
      })
    }
  }

  // delete order lines if showOrderLines button is toggled
  useEffect(() => {
    if (!showOrderLines) {
      deleteLines()
    }
  }, [showOrderLines])

  // updated order lines if a user's open orders change
  useEffect(() => {
    let subscription
    if (chartReady && tvWidgetRef?.current) {
      subscription = useMangoStore.subscribe(
        (state) => state.selectedMangoAccount.openOrders,
        (openOrders) => {
          const orderLines = useMangoStore.getState().tradingView.orderLines
          tvWidgetRef.current?.onChartReady(() => {
            let matchingOrderLines = 0
            let openOrdersForMarket = 0

            for (const [key] of orderLines) {
              openOrders?.forEach(({ order }) => {
                if (order.orderId == key) {
                  matchingOrderLines += 1
                }
              })
            }

            openOrders?.forEach(({ market }) => {
              if (market.config.name == selectedMarketName) {
                openOrdersForMarket += 1
              }
            })

            tvWidgetRef.current?.activeChart().dataReady(() => {
              if (
                (showOrderLines &&
                  matchingOrderLines !== openOrdersForMarket) ||
                orderLines?.size != matchingOrderLines
              ) {
                deleteLines()
                drawLinesForMarket(openOrders)
              }
            })
          })
        }
      )
    }
    return subscription
  }, [chartReady, showOrderLines, selectedMarketName])

  const drawTradeExecutions = () => {
    const newTradeExecutions = new Map()
    if (tradeHistory?.length && chartReady && tvWidgetRef?.current) {
      tradeHistory 
        .filter(trade => { //get trades in the current market that dont have an arrow drawn already
          return trade.marketName === selectedMarketName && tradeExecutions.get(`${trade.seqNum}${trade.marketName}`) === undefined
        })
        .slice(0, TRADE_EXECUTION_LIMIT)
        .forEach(trade => {
          const arrowID = tvWidgetRef.current?.chart()
            .createExecutionShape()
            .setTime(dayjs(trade.loadTimestamp).unix())
            .setDirection(trade.side)
            .setArrowHeight(6)
            .setArrowColor(trade.side === 'buy' ? theme === 'Mango' ? '#AFD803' : '#5EBF4D' : theme === 'Mango' ? '#E54033' : '#CC2929')
          newTradeExecutions.set(`${trade.seqNum}${trade.marketName}`, arrowID)
      })
    }
    setMangoStore((state) => {
      state.tradingView.tradeExecutions = newTradeExecutions
    })
  }

  const deleteTradeExecutions = () => {
    if(previousTradeExecutions && chartReady && tvWidgetRef?.current) {
      console.log(`previous trade executions: ${JSON.stringify(previousTradeExecutions.values())}`)
      for (const tradeExecution of previousTradeExecutions.values()) {
        tradeExecution.remove()
      }
    }
    if (tradeHistory?.length && chartReady && tvWidgetRef?.current) {
      for (const tradeExecution of tradeExecutions.values()) {
        tradeExecution.remove()
      }
    }
    setMangoStore(state => {
      state.tradingView.tradeExecutions = new Map()
    })
  }

  // delete trade executions if showTradeExecutions button is toggled
  useEffect(() => {
    if (!showTradeExecutions) {
      deleteTradeExecutions()
    }
  }, [showTradeExecutions, mangoAccount])

  // update trade executions if transaction history changes
  useEffect(() => {
    if (chartReady && tvWidgetRef?.current) {
      const tradesInMarket = tradeHistory
        .filter(trade => {
          return trade.marketName === selectedMarketName
        }).length
      tvWidgetRef.current.onChartReady(() => {
        if (tradeExecutions.size !== tradesInMarket && showTradeExecutions) {
          drawTradeExecutions()
        }
      })
    }
  }, [chartReady, tradeHistory])
  

  return (
    <div id={defaultProps.container as string} className="tradingview-chart" />
  )
}

export default TVChartContainer
