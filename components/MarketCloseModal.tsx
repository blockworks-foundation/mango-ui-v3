import { FunctionComponent, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import {
  getMarketByBaseSymbolAndKind,
  PerpMarket,
  ZERO_BN,
} from '@blockworks-foundation/mango-client'
import Button, { LinkButton } from './Button'
import { notify } from '../utils/notifications'
import Loading from './Loading'
import { sleep } from '../utils'
import Modal from './Modal'
import { useTranslation } from 'next-i18next'

interface MarketCloseModalProps {
  baseSymbol: string
  isOpen: boolean
  onClose: () => void
  market: PerpMarket
  marketIndex: number
}

const MarketCloseModal: FunctionComponent<MarketCloseModalProps> = ({
  baseSymbol,
  isOpen,
  onClose,
  market,
  marketIndex,
}) => {
  const { t } = useTranslation('common')
  const [submitting, setSubmitting] = useState(false)
  const actions = useMangoStore((s) => s.actions)
  const mangoClient = useMangoStore((s) => s.connection.client)
  const config = useMangoStore.getState().selectedMarket.config
  const groupConfig = useMangoStore.getState().selectedMangoGroup.config
  const marketConfig = getMarketByBaseSymbolAndKind(
    groupConfig,
    baseSymbol,
    'perp'
  )

  async function handleMarketClose() {
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const askInfo =
      useMangoStore.getState().accountInfos[marketConfig.asksKey.toString()]
    const bidInfo =
      useMangoStore.getState().accountInfos[marketConfig.bidsKey.toString()]
    const wallet = useMangoStore.getState().wallet.current

    let referencePrice
    // The reference price is the book mid if book is double sided; else mark price
    if (config.baseSymbol === marketConfig.baseSymbol) {
      const orderbook = useMangoStore.getState().selectedMarket.orderBook
      const markPrice = useMangoStore.getState().selectedMarket.markPrice
      const bb = orderbook?.bids?.length > 0 && Number(orderbook.bids[0][0])
      const ba = orderbook?.asks?.length > 0 && Number(orderbook.asks[0][0])
      referencePrice = bb && ba ? (bb + ba) / 2 : markPrice
    } else {
      const connection = useMangoStore.getState().connection.current
      const perpMarket = await mangoGroup.loadPerpMarket(
        connection,
        marketConfig.marketIndex,
        marketConfig.baseDecimals,
        marketConfig.quoteDecimals
      )

      const bids = await perpMarket.loadBids(connection)
      const asks = await perpMarket.loadAsks(connection)

      const l2Bid = bids.getBest().price
      const l2Ask = asks.getBest().price

      referencePrice = l2Ask && l2Bid ? (l2Bid + l2Ask) / 2 : 0 // update to markprice if necessary or add a better fallback/handling
    }

    if (!wallet || !mangoGroup || !mangoAccount) return
    setSubmitting(true)

    try {
      const perpAccount = mangoAccount.perpAccounts[marketIndex]
      const side = perpAccount.basePosition.gt(ZERO_BN) ? 'sell' : 'buy'
      // send a large size to ensure we are reducing the entire position
      const size =
        Math.abs(market.baseLotsToNumber(perpAccount.basePosition)) * 2

      // hard coded for now; market orders are very dangerous and fault prone
      const maxSlippage: number | undefined = 0.025

      const txid = await mangoClient.placePerpOrder(
        mangoGroup,
        mangoAccount,
        mangoGroup.mangoCache,
        market,
        wallet,
        side,
        referencePrice * (1 + (side === 'buy' ? 1 : -1) * maxSlippage),
        size,
        'ioc',
        0, // client order id
        side === 'buy' ? askInfo : bidInfo,
        true // reduce only
      )
      await sleep(500)
      actions.reloadMangoAccount()
      notify({ title: t('transaction-sent'), txid })
    } catch (e) {
      notify({
        title: t('order-error'),
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
    } finally {
      setSubmitting(false)
      onClose()
    }
  }

  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <div className="pb-2 text-th-fgd-1 text-lg">
        {t('close-confirm', { config_name: marketConfig.name })}
      </div>
      <div className="pb-6 text-th-fgd-3">{t('price-expect')}</div>
      <div className="flex items-center">
        <Button onClick={handleMarketClose}>
          {submitting ? <Loading /> : <span>{t('close-position')}</span>}
        </Button>
        <LinkButton className="ml-4 text-th-fgd-1" onClick={onClose}>
          {t('cancel')}
        </LinkButton>
      </div>
    </Modal>
  )
}

export default MarketCloseModal
