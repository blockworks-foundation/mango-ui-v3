import { useState } from 'react'
// import { CheckIcon, XIcon } from '@heroicons/react/outline'
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
  sleep,
} from '@blockworks-foundation/mango-client'
import { formatUsdValue, getDecimalCount, usdFormatter } from '../utils'
import { Table, Td, Th, TrBody, TrHead } from './TableElements'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from './TradePageGrid'
import { Row } from './TableElements'
import { PerpTriggerOrder } from '../@types/types'
import { useTranslation } from 'next-i18next'
import Input from './Input'

const DesktopTable = ({
  cancelledOrderId,
  editOrder,
  handleCancelOrder,
  handleModifyOrder,
  modifiedOrderId,
  openOrders,
  setEditOrder,
}) => {
  const { t } = useTranslation('common')
  const { asPath } = useRouter()
  const [modifiedOrderSize, setModifiedOrderSize] = useState('')
  const [modifiedOrderPrice, setModifiedOrderPrice] = useState('')
  const renderMarketName = (market: MarketConfig) => {
    const location = `/${market.kind}/${market.baseSymbol}`
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
              <Td className="w-[14.286%]">
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
              <Td className="w-[14.286%]">
                <SideBadge side={order.side} />
              </Td>
              {!editOrder ? (
                <>
                  <Td className="w-[14.286%]">{order.size}</Td>
                  <Td className="w-[14.286%]">
                    {usdFormatter(order.price, decimals)}
                  </Td>
                </>
              ) : (
                <>
                  <Td className="w-[14.286%]">
                    <Input
                      className="bg-transparent border-b-2 border-l-0 border-r-0 border-t-0 h-7 px-0 rounded-none"
                      type="number"
                      value={modifiedOrderSize || order.size}
                      onChange={(e) => setModifiedOrderSize(e.target.value)}
                    />
                  </Td>
                  <Td className="w-[14.286%]">
                    <Input
                      className="bg-transparent border-b-2 border-l-0 border-r-0 border-t-0 h-7 px-0 rounded-none"
                      type="number"
                      value={modifiedOrderPrice || order.price}
                      onChange={(e) => setModifiedOrderPrice(e.target.value)}
                    />
                  </Td>
                </>
              )}
              <Td className="w-[14.286%]">
                {editOrder ? '' : formatUsdValue(order.price * order.size)}
              </Td>
              <Td className="w-[14.286%]">
                {order.perpTrigger &&
                  `${order.orderType} ${
                    order.triggerCondition
                  } ${order.triggerPrice.toFixed(2)}`}
              </Td>
              <Td className="w-[14.286%]">
                <div className={`flex justify-end space-x-3`}>
                  {!editOrder ? (
                    <>
                      <Button
                        onClick={() => setEditOrder(!editOrder)}
                        className="text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                      >
                        {t('edit')}
                      </Button>
                      <Button
                        onClick={() => handleCancelOrder(order, market.account)}
                        className="text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                      >
                        {cancelledOrderId + '' === order.orderId + '' ? (
                          <Loading />
                        ) : (
                          <span>{t('cancel')}</span>
                        )}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        className="text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                        onClick={() =>
                          handleModifyOrder(
                            order,
                            market.account,
                            modifiedOrderPrice
                          )
                        }
                      >
                        {modifiedOrderId + '' === order.orderId + '' ? (
                          <Loading />
                        ) : (
                          <span>{t('save')}</span>
                        )}
                      </Button>
                      <Button
                        className="text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                        onClick={() => setEditOrder(false)}
                      >
                        Cancel Edit
                      </Button>
                    </>
                  )}
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
  const [modifyId, setModifyId] = useState(null)
  const [editOrder, setEditOrder] = useState(false)
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
      } else if (market instanceof PerpMarket) {
        // TODO: this is not ideal
        if (order['triggerCondition']) {
          txid = await mangoClient.removeAdvancedOrder(
            selectedMangoGroup,
            selectedMangoAccount,
            wallet,
            (order as PerpTriggerOrder).orderId
          )
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
      // await sleep(600)
      actions.reloadMangoAccount()
      setCancelId(null)
    }
  }

  const handleModifyOrder = async (
    order: Order | PerpOrder,
    market: Market | PerpMarket,
    price: number
  ) => {
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const mangoClient = useMangoStore.getState().connection.client
    const { askInfo, bidInfo } = useMangoStore.getState().selectedMarket
    const wallet = useMangoStore.getState().wallet.current

    if (!wallet || !mangoGroup || !mangoAccount || !market) return
    setModifyId(order.orderId)
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
      setEditOrder(false)
      notify({ title: t('successfully-placed'), txid })
    } catch (e) {
      notify({
        title: t('order-error'),
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
    } finally {
      sleep(600).then(() => {
        actions.reloadMangoAccount()
        setModifyId(null)
      })
    }
  }

  const tableProps = {
    openOrders,
    cancelledOrderId: cancelId,
    editOrder,
    handleCancelOrder,
    handleModifyOrder,
    modifiedOrderId: modifyId,
    setEditOrder,
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
