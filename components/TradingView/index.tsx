import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  widget,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString,
} from '../../public/charting_library'
import { CHART_DATA_FEED } from '../../utils/chartDataConnector'
import useMangoStore from '../../stores/useMangoStore'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../TradePageGrid'
import { Order, Market } from '@project-serum/serum/lib/market'
import { PerpOrder, PerpMarket } from '@blockworks-foundation/mango-client'
import { notify } from '../../utils/notifications'
import { sleep, formatUsdValue, usdFormatter, roundPerpSize } from '../../utils'
import { PerpTriggerOrder } from '../../@types/types'
import { useTranslation } from 'next-i18next'
import useLocalStorageState from '../../hooks/useLocalStorageState'
import { useWallet, Wallet } from '@solana/wallet-adapter-react'

export interface ChartContainerProps {
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
  containerId: ChartingLibraryWidgetOptions['container_id']
  theme: string
}

const SHOW_ORDER_LINES_KEY = 'showOrderLines-0.1'

const TVChartContainer = () => {
  const { t } = useTranslation(['common', 'tv-chart'])
  const { theme } = useTheme()
  const { width } = useViewport()
  const { wallet } = useWallet()
  const [chartReady, setChartReady] = useState(false)
  const [showOrderLinesLocalStorage, toggleShowOrderLinesLocalStorage] =
    useLocalStorageState(SHOW_ORDER_LINES_KEY, true)
  const [showOrderLines, toggleShowOrderLines] = useState(
    showOrderLinesLocalStorage
  )

  const setMangoStore = useMangoStore.getState().set
  const selectedMarketConfig = useMangoStore((s) => s.selectedMarket.config)
  const openOrders = useMangoStore((s) => s.selectedMangoAccount.openOrders)
  const actions = useMangoStore((s) => s.actions)

  const isMobile = width ? width < breakpoints.sm : false
  const mangoClient = useMangoStore.getState().connection.client
  const selectedMarketName = selectedMarketConfig.name

  // @ts-ignore
  const defaultProps: ChartContainerProps = {
    symbol: selectedMarketConfig.name,
    interval: '60' as ResolutionString,
    theme: 'Dark',
    containerId: 'tv_chart_container',
    datafeedUrl: CHART_DATA_FEED,
    libraryPath: '/charting_library/',
    fullscreen: false,
    autosize: true,
    studiesOverrides: {
      'volume.volume.color.0': theme === 'Mango' ? '#E54033' : '#CC2929',
      'volume.volume.color.1': theme === 'Mango' ? '#AFD803' : '#5EBF4D',
      'volume.precision': 4,
    },
  }

  const tvWidgetRef = useRef<IChartingLibraryWidget | null>(null)

  useEffect(() => {
    if (showOrderLines !== showOrderLinesLocalStorage) {
      toggleShowOrderLinesLocalStorage(showOrderLines)
    }
  }, [showOrderLines])

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
            deleteLines()
            drawLinesForMarket()
          }
        }
      )
    }
  }, [selectedMarketConfig.name, chartReady])

  useEffect(() => {
    const mainSeriesProperties = [
      'candleStyle',
      'hollowCandleStyle',
      'haStyle',
      'barStyle',
    ]
    let chartStyleOverrides = {}
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
      container_id:
        defaultProps.containerId as ChartingLibraryWidgetOptions['container_id'],
      library_path: defaultProps.libraryPath as string,
      locale: 'en',
      enabled_features: ['hide_left_toolbar_by_default'],
      disabled_features: [
        'use_localstorage_for_settings',
        'timeframes_toolbar',
        // 'volume_force_overlay',
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
        'header_saveload',
        'header_undo_redo',
        'header_interval_dialog_button',
        'show_interval_dialog_on_key_press',
        'header_symbol_search',
      ],
      load_last_chart: true,
      client_id: defaultProps.clientId,
      user_id: defaultProps.userId,
      fullscreen: defaultProps.fullscreen,
      autosize: defaultProps.autosize,
      studies_overrides: defaultProps.studiesOverrides,
      theme: theme === 'Light' ? 'Light' : 'Dark',
      custom_css_url: '/tradingview-chart.css',
      loading_screen: {
        backgroundColor:
          theme === 'Dark' ? '#1B1B1F' : theme === 'Light' ? '#fff' : '#1D1832',
      },
      overrides: {
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        'paneProperties.background':
          theme === 'Dark' ? '#1B1B1F' : theme === 'Light' ? '#fff' : '#1D1832',
        ...chartStyleOverrides,
      },
    }

    const tvWidget = new widget(widgetOptions)
    tvWidgetRef.current = tvWidget

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
    //eslint-disable-next-line
  }, [theme, isMobile])

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

  const drawLinesForMarket = () => {
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
    if (chartReady && tvWidgetRef?.current) {
      const orderLines = useMangoStore.getState().tradingView.orderLines
      tvWidgetRef.current.onChartReady(() => {
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
            (showOrderLines && matchingOrderLines !== openOrdersForMarket) ||
            orderLines?.size != matchingOrderLines
          ) {
            deleteLines()
            drawLinesForMarket()
          }
        })
      })
    }
  }, [chartReady, openOrders, showOrderLines])

  return <div id={defaultProps.containerId} className="tradingview-chart" />
}

export default TVChartContainer
