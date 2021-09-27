import { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import {
  widget,
  ChartingLibraryWidgetOptions,
  IChartingLibraryWidget,
  ResolutionString,
} from '../charting_library' // Make sure to follow step 1 of the README
import { CHART_DATA_FEED } from '../../utils/chartDataConnector'
import useMangoStore from '../../stores/useMangoStore'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../TradePageGrid'
import { useOpenOrders } from '../../hooks/useOpenOrders'
import { Order, Market } from '@project-serum/serum/lib/market'
import { PerpOrder, PerpMarket } from '@blockworks-foundation/mango-client'
import { notify } from '../../utils/notifications'
import { sleep, formatUsdValue } from '../../utils'
import useInterval from '../../hooks/useInterval'

// This is a basic example of how to create a TV widget
// You can add more feature such as storing charts in localStorage

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

// export interface ChartContainerState {}

const TVChartContainer = () => {
  const selectedMarketConfig = useMangoStore((s) => s.selectedMarket.config)
  const { theme } = useTheme()
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const selectedMarketName = selectedMarketConfig.name
  const openOrders = useOpenOrders()
  const actions = useMangoStore((s) => s.actions)
  const connected = useMangoStore((s) => s.wallet.connected)
  const selectedMarginAccount =
    useMangoStore.getState().selectedMangoAccount.current
  const selectedMarketPrice = useMangoStore((s) => s.selectedMarket.markPrice)
  const [lines, setLines] = useState(new Map())
  const [moveInProgress, toggleMoveInProgress] = useState(false)
  const [orderInProgress, toggleOrderInProgress] = useState(false)
  const [priceReset, togglePriceReset] = useState(false)
  const mangoClient = useMangoStore.getState().connection.client

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
    const widgetOptions: ChartingLibraryWidgetOptions = {
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
      disabled_features: [
        'use_localstorage_for_settings',
        'timeframes_toolbar',
        // 'volume_force_overlay',
        isMobile && 'left_toolbar',
        'show_logo_on_all_charts',
        'caption_buttons_text_if_possible',
        'header_settings',
        'header_chart_type',
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
      loading_screen: { backgroundColor: 'rgba(0,0,0,0.1)' },
      overrides: {
        'paneProperties.background':
          theme === 'Dark' ? '#1B1B1F' : theme === 'Light' ? '#fff' : '#1D1832',
        'mainSeriesProperties.candleStyle.barColorsOnPrevClose': true,
        'mainSeriesProperties.candleStyle.drawWick': true,
        'mainSeriesProperties.candleStyle.drawBorder': true,
        'mainSeriesProperties.candleStyle.upColor':
          theme === 'Mango' ? '#AFD803' : '#5EBF4D',
        'mainSeriesProperties.candleStyle.downColor':
          theme === 'Mango' ? '#E54033' : '#CC2929',
        'mainSeriesProperties.candleStyle.borderColor':
          theme === 'Mango' ? '#AFD803' : '#5EBF4D',
        'mainSeriesProperties.candleStyle.borderUpColor':
          theme === 'Mango' ? '#AFD803' : '#5EBF4D',
        'mainSeriesProperties.candleStyle.borderDownColor':
          theme === 'Mango' ? '#E54033' : '#CC2929',
        'mainSeriesProperties.candleStyle.wickUpColor':
          theme === 'Mango' ? '#AFD803' : '#5EBF4D',
        'mainSeriesProperties.candleStyle.wickDownColor':
          theme === 'Mango' ? '#E54033' : '#CC2929',
      },
    }

    const tvWidget = new widget(widgetOptions)
    tvWidgetRef.current = tvWidget
    setLines(deleteLines())
    //eslint-disable-next-line
  }, [selectedMarketConfig, theme, isMobile])


  const handleCancelOrder = async (
    order: Order | PerpOrder,
    market: Market | PerpMarket
  ) => {
    const wallet = useMangoStore.getState().wallet.current
    const selectedMangoGroup =
      useMangoStore.getState().selectedMangoGroup.current
    const selectedMangoAccount =
      useMangoStore.getState().selectedMangoAccount.current

    let txid
    try {
      if (!selectedMangoGroup || !selectedMangoAccount) return
      if (market instanceof Market) {
        txid = await mangoClient.cancelSpotOrder(
          selectedMangoGroup,
          selectedMangoAccount,
          wallet,
          market,
          order as Order
        )
      } else if (market instanceof PerpMarket) {
        txid = await mangoClient.cancelPerpOrder(
          selectedMangoGroup,
          selectedMangoAccount,
          wallet,
          market,
          order as PerpOrder
        )
      }
      notify({ title: 'Successfully cancelled order', txid })
      toggleOrderInProgress(false)
    } catch (e) {
      notify({
        title: 'Error cancelling order',
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
      return false
    } finally {
      sleep(500).then(() => {
        actions.fetchMangoAccounts()
        actions.updateOpenOrders()
        toggleOrderInProgress(false)
        toggleMoveInProgress(false)
      })  
    }
  }

  const handleModifyOrder = async (
    order: Order | PerpOrder,
    market: Market | PerpMarket,
    price: number
  ) => {
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const { askInfo, bidInfo } = useMangoStore.getState().selectedMarket
    const wallet = useMangoStore.getState().wallet.current

    if (!wallet || !mangoGroup || !mangoAccount || !market) return

    try {
      const orderPrice = price

      if (!orderPrice) {
        notify({
          title: 'Price not available',
          description: 'Please try again',
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
          market,
          wallet,
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
          wallet,
          order as PerpOrder,
          order.side,
          orderPrice,
          order.size,
          orderType,
          0,
          order.side === 'buy' ? askInfo : bidInfo
        )
      }

      notify({ title: 'Successfully placed trade', txid })
      toggleOrderInProgress(false)
    } catch (e) {
      notify({
        title: 'Error placing order',
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
      togglePriceReset(true)
    } finally {
      sleep(1000).then(() => {
        actions.fetchMangoAccounts()
        actions.updateOpenOrders()
        toggleOrderInProgress(false)
        toggleMoveInProgress(false)
      })
    }
  }


  function getLine(order, market) {
    return tvWidgetRef.current
      .chart()
      .createOrderLine({ disableUndo: false })
      .onMove(function () {
        toggleMoveInProgress(true)
        toggleOrderInProgress(true)
        const currentOrderPrice = order.price
        const updatedOrderPrice = this.getPrice()
        if (
          (order.side === 'buy' &&
            updatedOrderPrice > 1.05 * selectedMarketPrice) ||
          (order.side === 'sell' &&
            updatedOrderPrice < 0.95 * selectedMarketPrice)
        ) {
          tvWidgetRef.current.showNoticeDialog({
            title: 'Order Price Outside Range',
            body:
              `Your order price (${formatUsdValue(
                updatedOrderPrice
              )}) is greater than 5% ${
                order.side == 'buy' ? 'above' : 'below'
              } the current market price (${formatUsdValue(
                selectedMarketPrice
              )}). ` +
              ' indicating you might incur significant slippage. <p><p>Please use the trade input form if you wish to accept the potential slippage.',
            callback: () => {
              this.setPrice(currentOrderPrice)
              toggleMoveInProgress(false)
              toggleOrderInProgress(false)
            },
          })
        } else {
          tvWidgetRef.current.showConfirmDialog({
            title: 'Modify Your Order?',
            body: `Would you like to change your order from a 
           ${order.size} ${market.config.baseSymbol} ${
              order.side
            } at ${formatUsdValue(currentOrderPrice)} 
           to a 
          ${order.size} ${market.config.baseSymbol} LIMIT ${
              order.side
            } at ${formatUsdValue(updatedOrderPrice)}?
          `,
            callback: (res) => {
              if (res) {
                handleModifyOrder(order, market.account, updatedOrderPrice)
              } else {
                this.setPrice(currentOrderPrice)
                toggleOrderInProgress(false)
                toggleMoveInProgress(false)
              }
            },
          })
        }
      })
      .onCancel(function () {
        toggleOrderInProgress(true)
        tvWidgetRef.current.showConfirmDialog({
          title: 'Cancel Your Order?',
          body: `Would you like to cancel your order for 
       ${order.size} ${market.config.baseSymbol} ${
            order.side
          } at ${formatUsdValue(order.price)}  
      `,
          callback: (res) => {
            if (res) {
              handleCancelOrder(order, market.account)
            } else {
              toggleOrderInProgress(false)
            }
          },
        })
      })
      .setText(`${order.side.toUpperCase()} ${market.config.baseSymbol}`)
      .setBodyBorderColor(order.side == 'buy' ? '#AFD803' : '#E54033')
      .setBodyBackgroundColor('#000000')
      .setBodyTextColor('#F2C94C')
      .setLineLength(3)
      .setLineColor(order.side == 'buy' ? '#AFD803' : '#E54033')
      .setQuantity(order.size)
      .setTooltip(`Order #: ${order.orderId}`)
      .setQuantityBorderColor(order.side == 'buy' ? '#AFD803' : '#E54033')
      .setQuantityBackgroundColor('#000000')
      .setQuantityTextColor('#F2C94C')
      .setCancelButtonBorderColor(order.side == 'buy' ? '#AFD803' : '#E54033')
      .setCancelButtonBackgroundColor('#000000')
      .setCancelButtonIconColor('#F2C94C')
      .setPrice(order.price)
  }


  function deleteLines() {
    tvWidgetRef.current.onChartReady(() => {
      if (lines?.size > 0) {
        lines?.forEach((value, key) => {
          lines.get(key).remove()
        })
      }
    })
    return new Map()
  }


  function drawLines() {
    const tempLines = new Map()
    tvWidgetRef.current.onChartReady(() => {
      openOrders?.map(({ order, market }) => {
        if (market.config.name == selectedMarketName) {
          tempLines.set(order.orderId.toString(), getLine(order, market))
        }
      })
    })
    return tempLines
  }


  useInterval(() => {
    if (selectedMarginAccount && connected && !moveInProgress && !orderInProgress && openOrders?.length > 0) {

      let matches = 0
      let openOrdersInSelectedMarket = 0
      lines?.forEach((value, key) => {
        openOrders?.map(({ order }) => {
          if (order.orderId == key) {
            matches += 1
          }
        })
      })

      openOrders?.map(({ market }) => {
        if (market.config.name == selectedMarketName) {
          openOrdersInSelectedMarket += 1
        }
      })

      if (
        lines?.size != openOrdersInSelectedMarket 
        || matches != openOrdersInSelectedMarket 
        || lines?.size > 0 && lines?.size != matches 
        || lines?.size > 0 && !selectedMarginAccount 
        || priceReset
      ) {
        if (priceReset) { togglePriceReset(false) }
        setLines(deleteLines())
        setLines(drawLines())
      }

    } else if (lines?.size > 0 && !moveInProgress && !orderInProgress) {
      setLines(deleteLines())
    }
  }, [100])


  return <div id={defaultProps.containerId} className="tradingview-chart" />
}

export default TVChartContainer
