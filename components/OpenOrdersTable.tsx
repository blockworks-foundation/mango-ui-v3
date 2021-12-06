import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useOpenOrders } from '../hooks/useOpenOrders'
import Button from './Button'
import Loading from './Loading'
import useMangoStore from '../stores/useMangoStore'
import { notify } from '../utils/notifications'
import SideBadge from './SideBadge'
import { Order, Market } from '@project-serum/serum/lib/market'
import {
  PerpOrder,
  PerpMarket,
  MarketConfig,
} from '@blockworks-foundation/mango-client'
import { formatUsdValue, getDecimalCount, usdFormatter } from '../utils'
import { Table, Td, Th, TrBody, TrHead } from './TableElements'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { Row } from './TableElements'
import { PerpTriggerOrder } from '../@types/types'
import { useTranslation } from 'next-i18next'

const DesktopTable = ({ openOrders, cancelledOrderId, handleCancelOrder }) => {
  const { t } = useTranslation('common')
  const { asPath } = useRouter()
  const renderMarketName = (market: MarketConfig) => {
    const location =
      market.kind === 'spot'
        ? `/market?name=${market.baseSymbol}%2FUSDC`
        : `/market?name=${market.name}`
    if (!asPath.includes(location)) {
      return (
        <Link href={location} shallow={true}>
          <a className="text-th-fgd-1 underline hover:no-underline hover:text-th-fgd-1">
            {market.name}
          </a>
        </Link>
      )
    } else {
      return <span>{market.name}</span>
    }
  }
  return (
    <Table>
      <thead>
        <TrHead>
          <Th>{t('market')}</Th>
          <Th>{t('size')}</Th>
          <Th>{t('size')}</Th>
          <Th>{t('price')}</Th>
          <Th>{t('value')}</Th>
          <Th>{t('condition')}</Th>
          <Th>
            <span className={`sr-only`}>{t('edit')}</span>
          </Th>
        </TrHead>
      </thead>
      <tbody>
        {openOrders.map(({ order, market }, index) => {
          const decimals = getDecimalCount(market.account.tickSize)
          return (
            <TrBody index={index} key={`${order.orderId}${order.side}`}>
              <Td>
                <div className="flex items-center">
                  <img
                    alt=""
                    width="20"
                    height="20"
                    src={`/assets/icons/${market.config.baseSymbol.toLowerCase()}.svg`}
                    className={`mr-2.5`}
                  />
                  {renderMarketName(market.config)}
                </div>
              </Td>
              <Td>
                <SideBadge side={order.side} />
              </Td>
              <Td>{order.size}</Td>
              <Td>{usdFormatter(order.price, decimals)}</Td>
              <Td>{formatUsdValue(order.price * order.size)}</Td>
              <Td>
                {order.perpTrigger &&
                  `${t(order.orderType)} ${t(
                    order.triggerCondition
                  )} ${order.triggerPrice.toFixed(2)}`}
              </Td>
              <Td>
                <div className={`flex justify-end`}>
                  <Button
                    onClick={() => handleCancelOrder(order, market.account)}
                    className="ml-3 text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                  >
                    {cancelledOrderId + '' === order.orderId + '' ? (
                      <Loading />
                    ) : (
                      <span>{t('cancel')}</span>
                    )}
                  </Button>
                </div>
              </Td>
            </TrBody>
          )
        })}
      </tbody>
    </Table>
  )
}

const MobileTable = ({ openOrders, cancelledOrderId, handleCancelOrder }) => {
  const { t } = useTranslation('common')
  return (
    <>
      {openOrders.map(({ market, order }, index) => (
        <Row key={`${order.orderId}${order.side}`} index={index}>
          <div className="col-span-12 flex items-center justify-between text-fgd-1 text-left">
            <div className="flex items-center">
              <img
                alt=""
                width="20"
                height="20"
                src={`/assets/icons/${market.config.baseSymbol.toLowerCase()}.svg`}
                className={`mr-2.5`}
              />
              <div>
                <div className="mb-0.5">{market.config.name}</div>
                <div className="text-th-fgd-3 text-xs">
                  <span
                    className={`mr-1
                                ${
                                  order.side === 'buy'
                                    ? 'text-th-green'
                                    : 'text-th-red'
                                }
                              `}
                  >
                    {order.side.toUpperCase()}
                  </span>
                  {order.perpTrigger
                    ? `${order.size} ${order.triggerCondition} ${order.triggerPrice}`
                    : `${order.size} at ${formatUsdValue(order.price)}`}
                </div>
              </div>
            </div>
            <Button
              onClick={() => handleCancelOrder(order, market.account)}
              className="ml-3 text-xs pt-0 pb-0 h-8 pl-3 pr-3"
            >
              {cancelledOrderId + '' === order.orderId + '' ? (
                <Loading />
              ) : (
                <span>{t('cancel')}</span>
              )}
            </Button>
          </div>
        </Row>
      ))}
    </>
  )
}

const OpenOrdersTable = () => {
  const { t } = useTranslation('common')
  const { asPath } = useRouter()
  const openOrders = useOpenOrders()
  const [cancelId, setCancelId] = useState(null)
  const actions = useMangoStore((s) => s.actions)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false

  const handleCancelOrder = async (
    order: Order | PerpOrder | PerpTriggerOrder,
    market: Market | PerpMarket
  ) => {
    const wallet = useMangoStore.getState().wallet.current
    const selectedMangoGroup =
      useMangoStore.getState().selectedMangoGroup.current
    const selectedMangoAccount =
      useMangoStore.getState().selectedMangoAccount.current
    const mangoClient = useMangoStore.getState().connection.client
    setCancelId(order.orderId)
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
        actions.reloadOrders()
      } else if (market instanceof PerpMarket) {
        // TODO: this is not ideal
        if (order['triggerCondition']) {
          txid = await mangoClient.removeAdvancedOrder(
            selectedMangoGroup,
            selectedMangoAccount,
            wallet,
            (order as PerpTriggerOrder).orderId
          )
          actions.reloadOrders()
        } else {
          txid = await mangoClient.cancelPerpOrder(
            selectedMangoGroup,
            selectedMangoAccount,
            wallet,
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
      actions.updateOpenOrders()
      setCancelId(null)
    }
  }

  const tableProps = {
    openOrders,
    cancelledOrderId: cancelId,
    handleCancelOrder,
  }

  return (
    <div className={`flex flex-col py-2 sm:pb-4 sm:pt-4`}>
      <div className={`-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8`}>
        <div className={`align-middle inline-block min-w-full sm:px-6 lg:px-8`}>
          {openOrders && openOrders.length > 0 ? (
            !isMobile ? (
              <DesktopTable {...tableProps} />
            ) : (
              <MobileTable {...tableProps} />
            )
          ) : (
            <div
              className={`w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md`}
            >
              {t('no-orders')}
              {asPath === '/account' ? (
                <Link href={'/'} shallow={true}>
                  <a className={`inline-flex ml-2 py-0`}>{t('make-trade')}</a>
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default OpenOrdersTable
