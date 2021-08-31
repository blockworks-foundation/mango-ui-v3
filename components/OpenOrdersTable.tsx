import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowSmDownIcon } from '@heroicons/react/solid'
import { useRouter } from 'next/router'
import { useOpenOrders } from '../hooks/useOpenOrders'
import Button, { LinkButton } from './Button'
import Loading from './Loading'
import useMangoStore, { mangoClient } from '../stores/useMangoStore'
import { notify } from '../utils/notifications'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import SideBadge from './SideBadge'
import { useSortableData } from '../hooks/useSortableData'
import { Order, Market } from '@project-serum/serum/lib/market'
import { PerpOrder, PerpMarket } from '@blockworks-foundation/mango-client'
import { formatUsdValue, sleep } from '../utils'

const OpenOrdersTable = () => {
  const { asPath } = useRouter()
  const openOrders = useOpenOrders()
  const [sortableOpenOrders, setSortableOpenOrders] = useState([])
  const { items, requestSort, sortConfig } = useSortableData(sortableOpenOrders)
  const [cancelId, setCancelId] = useState(null)
  const actions = useMangoStore((s) => s.actions)

  useEffect(() => {
    const sortableOpenOrders = []
    openOrders.forEach((o) => {
      sortableOpenOrders.push({
        baseSymbol: o.market.config.baseSymbol,
        market: o.market.config.name,
        orderId: o.order.orderId,
        price: o.order.price,
        side: o.order.side,
        size: o.order.size,
        value: o.order.size * o.order.price,
      })
    })
    setSortableOpenOrders(sortableOpenOrders)
  }, [openOrders.length])

  const handleCancelOrder = async (
    order: Order | PerpOrder,
    market: Market | PerpMarket
  ) => {
    const wallet = useMangoStore.getState().wallet.current
    const selectedMangoGroup =
      useMangoStore.getState().selectedMangoGroup.current
    const selectedMangoAccount =
      useMangoStore.getState().selectedMangoAccount.current
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
        txid = await mangoClient.cancelPerpOrder(
          selectedMangoGroup,
          selectedMangoAccount,
          wallet,
          market,
          order as PerpOrder
        )
      }
      notify({ title: 'Successfully cancelled order', txid })
    } catch (e) {
      notify({
        title: 'Error cancelling order',
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
      console.log('error', `${e}`)
    } finally {
      sleep(500).then(() => {
        actions.fetchMangoAccounts()
        actions.updateOpenOrders()
      })
      setCancelId(null)
    }
  }

  return (
    <div className={`flex flex-col py-4`}>
      <div className={`-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8`}>
        <div className={`align-middle inline-block min-w-full sm:px-6 lg:px-8`}>
          {openOrders && sortableOpenOrders.length > 0 ? (
            <div className={`shadow overflow-hidden border-b border-th-bkg-2`}>
              <Table className={`min-w-full divide-y divide-th-bkg-2`}>
                <Thead>
                  <Tr className="text-th-fgd-3 text-xs">
                    <Th scope="col" className={`px-6 py-2`}>
                      <LinkButton
                        className="flex items-center no-underline font-normal"
                        onClick={() => requestSort('market')}
                      >
                        Market
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'market'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th scope="col" className={`px-6 py-2`}>
                      <LinkButton
                        className="flex items-center no-underline font-normal"
                        onClick={() => requestSort('side')}
                      >
                        Side
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'side'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th scope="col" className={`px-6 py-2`}>
                      <LinkButton
                        className="flex items-center no-underline font-normal"
                        onClick={() => requestSort('size')}
                      >
                        Size
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'size'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th scope="col" className={`px-6 py-2`}>
                      <LinkButton
                        className="flex items-center no-underline font-normal"
                        onClick={() => requestSort('price')}
                      >
                        Price
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'price'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th scope="col" className={`px-6 py-2`}>
                      <LinkButton
                        className="flex items-center no-underline font-normal"
                        onClick={() => requestSort('value')}
                      >
                        Value
                        <ArrowSmDownIcon
                          className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                            sortConfig?.key === 'value'
                              ? sortConfig.direction === 'ascending'
                                ? 'transform rotate-180'
                                : 'transform rotate-360'
                              : null
                          }`}
                        />
                      </LinkButton>
                    </Th>
                    <Th scope="col" className={`relative px-6 py-2.5`}>
                      <span className={`sr-only`}>Edit</span>
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {items.map((order, index) => {
                    return (
                      <Tr
                        key={`${order.orderId}${order.side}`}
                        className={`border-b border-th-bkg-3
                        ${index % 2 === 0 ? `bg-th-bkg-3` : `bg-th-bkg-2`}
                      `}
                      >
                        <Td
                          className={`px-6 py-2 whitespace-nowrap text-th-fgd-1`}
                        >
                          <div className="flex items-center">
                            <img
                              alt=""
                              width="20"
                              height="20"
                              src={`/assets/icons/${order.baseSymbol.toLowerCase()}.svg`}
                              className={`mr-2.5`}
                            />
                            <div>{order.market}</div>
                          </div>
                        </Td>
                        <Td
                          className={`px-6 py-2 whitespace-nowrap text-th-fgd-1`}
                        >
                          <SideBadge side={order.side} />
                        </Td>
                        <Td
                          className={`px-6 py-2 whitespace-nowrap text-th-fgd-1`}
                        >
                          {order.size}
                        </Td>
                        <Td
                          className={`px-6 py-2 whitespace-nowrap text-th-fgd-1`}
                        >
                          {formatUsdValue(order.price)}
                        </Td>
                        <Td
                          className={`px-6 py-2 whitespace-nowrap text-th-fgd-1`}
                        >
                          {formatUsdValue(order.price * order.size)}
                        </Td>
                        <Td className={`px-6 py-2 whitespace-nowrap`}>
                          <div className={`flex justify-end`}>
                            <Button
                              onClick={() =>
                                handleCancelOrder(
                                  openOrders[index].order,
                                  openOrders[index].market.account
                                )
                              }
                              className="ml-3 text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                            >
                              {cancelId + '' === order.orderId + '' ? (
                                <Loading />
                              ) : (
                                <span>Cancel</span>
                              )}
                            </Button>
                          </div>
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </div>
          ) : (
            <div
              className={`w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md`}
            >
              No open orders
              {asPath === '/account' ? (
                <Link href={'/'}>
                  <a
                    className={`inline-flex ml-2 py-0
        `}
                  >
                    Make a trade
                  </a>
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
