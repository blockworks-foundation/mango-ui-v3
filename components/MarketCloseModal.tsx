import { FunctionComponent, useEffect, useRef, useState } from 'react'
import useMangoStore, { mangoClient } from '../stores/useMangoStore'
import { PerpMarket } from '@blockworks-foundation/mango-client'
import Button, { LinkButton } from './Button'
import { notify } from '../utils/notifications'
import Loading from './Loading'
import { calculateTradePrice, sleep } from '../utils'
import Modal from './Modal'
// import useLocalStorageState from '../hooks/useLocalStorageState'

interface MarketCloseModalProps {
  onClose: () => void
  isOpen: boolean
  market: PerpMarket
  marketName: string
  pnl: number
  side: string
  size: number
}

const MarketCloseModal: FunctionComponent<MarketCloseModalProps> = ({
  onClose,
  isOpen,
  market,
  marketName,
  pnl,
  side,
  size,
}) => {
  const [submitting, setSubmitting] = useState(false)
  const actions = useMangoStore((s) => s.actions)
  const orderBookRef = useRef(useMangoStore.getState().selectedMarket.orderBook)
  const orderbook = orderBookRef.current
  //   const [hideMarketCloseWarning, setHideMarketCloseWarning] =
  //     useLocalStorageState('hideMarketCloseWarning', false)
  useEffect(
    () =>
      useMangoStore.subscribe(
        // @ts-ignore
        (orderBook) => (orderBookRef.current = orderBook),
        (state) => state.selectedMarket.orderBook
      ),
    []
  )
  async function handleMarketClose(side, size) {
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const { askInfo, bidInfo } = useMangoStore.getState().selectedMarket
    const wallet = useMangoStore.getState().wallet.current

    if (!wallet || !mangoGroup || !mangoAccount) return
    setSubmitting(true)

    try {
      const orderPrice = calculateTradePrice(
        'Market',
        orderbook,
        size,
        side,
        ''
      )

      if (!orderPrice) {
        notify({
          title: 'Price not available',
          description: 'Please try again',
          type: 'error',
        })
      }

      const txid = await mangoClient.placePerpOrder(
        mangoGroup,
        mangoAccount,
        mangoGroup.mangoCache,
        market,
        wallet,
        side,
        orderPrice,
        size,
        'ioc',
        0,
        side === 'buy' ? askInfo : bidInfo
      )

      notify({ title: 'Successfully placed trade', txid })
    } catch (e) {
      notify({
        title: 'Error placing order',
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
    } finally {
      sleep(500).then(() => {
        actions.fetchMangoAccounts()
      })
      setSubmitting(false)
      onClose()
    }
  }
  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <div className="pb-2 text-th-fgd-1 text-lg">
        Are you sure you want to market close your <br /> {marketName} position?
      </div>
      <div className="pb-6 text-th-fgd-3">
        The price you receive may be more or less than you expect.
      </div>
      <div className="flex items-center">
        <Button onClick={() => handleMarketClose(side, size)}>
          {submitting ? (
            <Loading />
          ) : (
            <span>{pnl <= 0 ? 'Dump It' : 'Cash In'}</span>
          )}
        </Button>
        <LinkButton className="ml-4 text-th-fgd-1" onClick={onClose}>
          Cancel
        </LinkButton>
      </div>
      {/* <div className="pt-6">
        <label className="cursor-pointer inline-flex items-center">
          <input
            type="checkbox"
            checked={hideMarketCloseWarning}
            onChange={() => setHideMarketCloseWarning(!hideMarketCloseWarning)}
          />
          <span className="ml-2 text-th-fgd-1">Don't show this again</span>
        </label>
      </div> */}
    </Modal>
  )
}

export default MarketCloseModal
