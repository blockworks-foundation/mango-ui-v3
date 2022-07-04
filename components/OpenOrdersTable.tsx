import { useState } from 'react'
import { PencilIcon, TrashIcon, XIcon } from '@heroicons/react/solid'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Button, { IconButton } from './Button'
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
import Input, { Label } from './Input'
import { useWallet, Wallet } from '@solana/wallet-adapter-react'

const DesktopTable = ({
  cancelledOrderId,
  editOrderIndex,
  handleCancelOrder,
  handleCancelAllOrders,
  handleModifyOrder,
  modifiedOrderId,
  openOrders,
  setEditOrderIndex,
}) => {
  const { t } = useTranslation('common')
  const { asPath } = useRouter()
  const { wallet } = useWallet()
  const [modifiedOrderSize, setModifiedOrderSize] = useState('')
  const [modifiedOrderPrice, setModifiedOrderPrice] = useState('')

  const showEditOrderForm = (index, order) => {
    setEditOrderIndex(index)
    setModifiedOrderSize(order.size)
    setModifiedOrderPrice(order.price)
  }

  const renderMarketName = (market: MarketConfig) => {
    const location =
      market.kind === 'spot'
        ? `/?name=${market.baseSymbol}%2FUSDC`
        : `/?name=${market.name}`
    if (!asPath.includes(location)) {
      return (
        <Link href={location} shallow={true}>
          <a className="text-th-fgd-1 underline hover:text-th-fgd-1 hover:no-underline">
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
          <Th>{t('side')}</Th>
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
          const editThisOrder = editOrderIndex === index
          return (
            <TrBody key={`${order.orderId}${order.side}`}>
              <Td className="w-[14.286%]">
                <div className="flex items-center">
                  <img
                    alt=""
                    width="20"
                    height="20"
                    src={`/assets/icons/${market.config.baseSymbol.toLowerCase()}.svg`}
                    className={`mr-2.5`}
                  />
                  <span className="whitespace-nowrap">
                    {renderMarketName(market.config)}
                  </span>
                </div>
              </Td>
              <Td className="w-[14.286%]">
                <SideBadge side={order.side} />
              </Td>
              {editOrderIndex !== index ? (
                <>
                  <Td className="w-[14.286%]">
                    {order.size.toLocaleString(undefined, {
                      maximumFractionDigits: 4,
                    })}
                  </Td>
                  <Td className="w-[14.286%]">
                    {usdFormatter(order.price, decimals)}
                  </Td>
                </>
              ) : (
                <>
                  <Td className="w-[14.286%]">
                    <Input
                      className="default-transition h-7 rounded-none border-b-2 border-l-0 border-r-0 border-t-0 border-th-fgd-4 bg-transparent px-0 hover:border-th-fgd-3 focus:border-th-fgd-3 focus:outline-none"
                      type="number"
                      value={modifiedOrderSize}
                      onChange={(e) => setModifiedOrderSize(e.target.value)}
                    />
                  </Td>
                  <Td className="w-[14.286%]">
                    <Input
                      autoFocus
                      className="default-transition h-7 rounded-none border-b-2 border-l-0 border-r-0 border-t-0 border-th-fgd-4 bg-transparent px-0 hover:border-th-fgd-3 focus:border-th-fgd-3 focus:outline-none"
                      type="number"
                      value={modifiedOrderPrice}
                      onChange={(e) => setModifiedOrderPrice(e.target.value)}
                    />
                  </Td>
                </>
              )}
              <Td className="w-[14.286%]">
                {editThisOrder ? '' : formatUsdValue(order.price * order.size)}
              </Td>
              <Td className="w-[14.286%]">
                {order.perpTrigger &&
                  `${t(order.orderType)} ${t(
                    order.triggerCondition
                  )} $${order.triggerPrice.toFixed(2)}`}
              </Td>
              <Td className="w-[14.286%]">
                <div className={`flex justify-end space-x-3`}>
                  {editOrderIndex !== index ? (
                    <>
                      {!order.perpTrigger ? (
                        <Button
                          onClick={() => showEditOrderForm(index, order)}
                          className="-my-1 h-7 pt-0 pb-0 pl-3 pr-3 text-xs"
                        >
                          {t('edit')}
                        </Button>
                      ) : null}
                      <Button
                        onClick={() => handleCancelOrder(order, market.account)}
                        className="-my-1 h-7 pt-0 pb-0 pl-3 pr-3 text-xs"
                      >
                        {cancelledOrderId + '' === order.orderId + '' ? (
                          <Loading />
                        ) : (
                          <span>{t('cancel')}</span>
                        )}
                      </Button>
                      {openOrders.filter(
                        (o) => o.market.config.name === market.config.name
                      ).length > 1 ? (
                        <Button
                          onClick={() => handleCancelAllOrders(market.account)}
                          className="-my-1 h-7 pt-0 pb-0 pl-3 pr-3 text-xs text-th-red"
                        >
                          {t('cancel-all') + ' ' + market.config.name}
                        </Button>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <Button
                        className="h-7 pt-0 pb-0 pl-3 pr-3 text-xs"
                        onClick={() =>
                          handleModifyOrder(
                            order,
                            market.account,
                            modifiedOrderPrice || order.price,
                            modifiedOrderSize || order.size,
                            wallet
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
                        className="h-7 pt-0 pb-0 pl-3 pr-3 text-xs"
                        onClick={() => setEditOrderIndex(null)}
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

const MobileTable = ({
  cancelledOrderId,
  editOrderIndex,
  handleCancelOrder,
  handleCancelAllOrders,
  handleModifyOrder,
  modifiedOrderId,
  openOrders,
  setEditOrderIndex,
}) => {
  const { t } = useTranslation('common')
  const { wallet } = useWallet()
  const [modifiedOrderSize, setModifiedOrderSize] = useState('')
  const [modifiedOrderPrice, setModifiedOrderPrice] = useState('')

  const showEditOrderForm = (index) => {
    setEditOrderIndex(index)
    setModifiedOrderSize('')
    setModifiedOrderPrice('')
  }

  return (
    <div className="border-b border-th-bkg-3">
      {openOrders.map(({ market, order }, index) => {
        const editThisOrder = editOrderIndex === index
        return (
          <Row key={`${order.orderId}${order.side}`}>
            <div className="text-fgd-1 col-span-12 flex items-center justify-between text-left">
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
                  <div className="text-xs text-th-fgd-3">
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
                      ? `${order.size.toLocaleString(undefined, {
                          maximumFractionDigits: 4,
                        })} ${order.triggerCondition} ${formatUsdValue(
                          order.triggerPrice
                        )}`
                      : `${order.size.toLocaleString(undefined, {
                          maximumFractionDigits: 4,
                        })} at ${formatUsdValue(order.price)}`}
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                {!order.perpTrigger ? (
                  <IconButton
                    className={index % 2 === 0 ? 'bg-th-bkg-4' : 'bg-th-bkg-3'}
                    onClick={() =>
                      editThisOrder
                        ? setEditOrderIndex(null)
                        : showEditOrderForm(index)
                    }
                  >
                    {editThisOrder ? (
                      <XIcon className="h-5 w-5" />
                    ) : (
                      <PencilIcon className="h-5 w-5" />
                    )}
                  </IconButton>
                ) : null}
                <IconButton
                  className={index % 2 === 0 ? 'bg-th-bkg-4' : 'bg-th-bkg-3'}
                  onClick={() => handleCancelOrder(order, market.account)}
                >
                  {cancelledOrderId + '' === order.orderId + '' ? (
                    <Loading />
                  ) : (
                    <TrashIcon className="h-5 w-5" />
                  )}
                </IconButton>
                {openOrders.filter(
                  (o) => o.market.config.name === market.config.name
                ).length > 1 ? (
                  <IconButton
                    onClick={() => handleCancelAllOrders(market.account)}
                  >
                    <TrashIcon className="h-5 w-5 text-th-red" />
                  </IconButton>
                ) : null}
              </div>
            </div>
            {editThisOrder ? (
              <div className="flex flex-col pt-4 sm:flex-row sm:space-x-3">
                <div className="pb-3">
                  <Label className="text-xs">{t('size')}</Label>
                  <Input
                    className="default-transition h-7 w-full rounded-none border-b-2 border-l-0 border-r-0 border-t-0 border-th-fgd-4 bg-transparent px-0 hover:border-th-fgd-3 focus:border-th-fgd-3 focus:outline-none"
                    type="number"
                    value={modifiedOrderSize || order.size}
                    onChange={(e) => setModifiedOrderSize(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">{t('price')}</Label>
                  <Input
                    autoFocus
                    className="default-transition h-7 w-full rounded-none border-b-2 border-l-0 border-r-0 border-t-0 border-th-fgd-4 bg-transparent px-0 hover:border-th-fgd-3 focus:border-th-fgd-3 focus:outline-none"
                    type="number"
                    value={modifiedOrderPrice || order.price}
                    onChange={(e) => setModifiedOrderPrice(e.target.value)}
                  />
                </div>
                <Button
                  className={`${
                    index % 2 === 0 ? 'bg-th-bkg-4' : 'bg-th-bkg-3'
                  } mt-4 h-8 pt-0 pb-0 pl-3 pr-3 text-xs`}
                  onClick={() =>
                    handleModifyOrder(
                      order,
                      market.account,
                      modifiedOrderPrice || order.price,
                      modifiedOrderSize || order.size,
                      wallet
                    )
                  }
                >
                  {modifiedOrderId + '' === order.orderId + '' ? (
                    <Loading />
                  ) : (
                    <span>{t('save')}</span>
                  )}
                </Button>
              </div>
            ) : null}
          </Row>
        )
      })}
    </div>
  )
}

const OpenOrdersTable = () => {
  const { t } = useTranslation('common')
  const { asPath } = useRouter()
  const { wallet } = useWallet()
  const openOrders = useMangoStore((s) => s.selectedMangoAccount.openOrders)
  const [cancelId, setCancelId] = useState<any>(null)
  const [modifyId, setModifyId] = useState<any>(null)
  const [editOrderIndex, setEditOrderIndex] = useState(null)
  const actions = useMangoStore((s) => s.actions)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.md : false

  const handleCancelAllOrders = async (market: PerpMarket | Market) => {
    const selectedMangoGroup =
      useMangoStore.getState().selectedMangoGroup.current
    const selectedMangoAccount =
      useMangoStore.getState().selectedMangoAccount.current
    const mangoClient = useMangoStore.getState().connection.client
    try {
      if (!selectedMangoGroup || !selectedMangoAccount || !wallet) return

      if (market instanceof PerpMarket) {
        const txids = await mangoClient.cancelAllPerpOrders(
          selectedMangoGroup,
          [market],
          selectedMangoAccount,
          wallet.adapter
        )
        if (txids) {
          for (const txid of txids) {
            notify({
              title: t('cancel-all-success'),
              description: '',
              txid,
            })
          }
        } else {
          notify({
            title: t('cancel-all-error'),
            description: t('transaction-failed'),
          })
        }
        actions.reloadOrders()
      } else if (market instanceof Market) {
        const txid = await mangoClient.cancelAllSpotOrders(
          selectedMangoGroup,
          selectedMangoAccount,
          market,
          wallet.adapter,
          20
        )
        if (txid) {
          notify({
            title: t('cancel-all-success'),
            description: '',
            txid,
          })
        } else {
          notify({
            title: t('cancel-all-error'),
            description: t('transaction-failed'),
          })
        }
      }
    } catch (e) {
      notify({
        title: t('cancel-all-error'),
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
      console.log('error', `${e}`)
    } finally {
      actions.reloadMangoAccount()
      actions.updateOpenOrders()
    }
  }

  const handleCancelOrder = async (
    order: Order | PerpOrder | PerpTriggerOrder,
    market: Market | PerpMarket
  ) => {
    const selectedMangoGroup =
      useMangoStore.getState().selectedMangoGroup.current
    const selectedMangoAccount =
      useMangoStore.getState().selectedMangoAccount.current
    const mangoClient = useMangoStore.getState().connection.client
    setCancelId(order.orderId)
    let txid
    try {
      if (!selectedMangoGroup || !selectedMangoAccount || !wallet) return
      if (market instanceof Market) {
        txid = await mangoClient.cancelSpotOrder(
          selectedMangoGroup,
          selectedMangoAccount,
          wallet.adapter,
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
            wallet.adapter,
            (order as PerpTriggerOrder).orderId
          )
          actions.reloadOrders()
        } else {
          txid = await mangoClient.cancelPerpOrder(
            selectedMangoGroup,
            selectedMangoAccount,
            wallet.adapter,
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

  const handleModifyOrder = async (
    order: Order | PerpOrder,
    market: Market | PerpMarket,
    price: number,
    size: number,
    wallet: Wallet
  ) => {
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const mangoClient = useMangoStore.getState().connection.client
    const marketConfig = useMangoStore.getState().selectedMarket.config
    const askInfo =
      useMangoStore.getState().accountInfos[marketConfig.asksKey.toString()]
    const bidInfo =
      useMangoStore.getState().accountInfos[marketConfig.bidsKey.toString()]
    const referrerPk = useMangoStore.getState().referrerPk

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
          wallet?.adapter,
          order as Order,
          order.side,
          orderPrice,
          size,
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
          size,
          orderType,
          0,
          order.side === 'buy' ? askInfo : bidInfo,
          false,
          referrerPk ? referrerPk : undefined
        )
      }
      notify({ title: t('successfully-placed'), txid })
    } catch (e) {
      console.log('error: ', e.message, e.txid, e)

      notify({
        title: t('order-error'),
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
    } finally {
      actions.reloadMangoAccount()
      actions.reloadOrders()
      actions.updateOpenOrders()
      setModifyId(null)
      setEditOrderIndex(null)
    }
  }

  const tableProps = {
    openOrders,
    cancelledOrderId: cancelId,
    editOrderIndex,
    handleCancelOrder,
    handleCancelAllOrders,
    handleModifyOrder,
    modifiedOrderId: modifyId,
    setEditOrderIndex,
  }

  return (
    <div className={`flex flex-col sm:pb-4`}>
      <div className={`overflow-x-auto sm:-mx-6 lg:-mx-8`}>
        <div className={`inline-block min-w-full align-middle sm:px-6 lg:px-8`}>
          {openOrders && openOrders.length > 0 ? (
            !isMobile ? (
              <DesktopTable {...tableProps} />
            ) : (
              <MobileTable {...tableProps} />
            )
          ) : (
            <div
              className={`w-full rounded-md border border-th-bkg-3 py-6 text-center text-th-fgd-3`}
            >
              {t('no-orders')}
              {asPath === '/account' ? (
                <Link href={'/'} shallow={true}>
                  <a className={`ml-2 inline-flex py-0`}>{t('make-trade')}</a>
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
