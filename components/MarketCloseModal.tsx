import { FunctionComponent, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import {
  MarketConfig,
  PerpMarket,
  ZERO_BN,
} from '@blockworks-foundation/mango-client'
import Button, { LinkButton } from './Button'
import { notify } from '../utils/notifications'
import Loading from './Loading'
import { sleep } from '../utils'
import Modal from './Modal'
import { useTranslation } from 'next-i18next'
import { useWallet } from '@solana/wallet-adapter-react'

interface MarketCloseModalProps {
  onClose: () => void
  isOpen: boolean
  position: {
    marketConfig: MarketConfig
    perpMarket: PerpMarket
  }
}

const MarketCloseModal: FunctionComponent<MarketCloseModalProps> = ({
  onClose,
  isOpen,
  position,
}) => {
  const { t } = useTranslation('common')
  const [submitting, setSubmitting] = useState(false)
  const { wallet } = useWallet()
  const actions = useMangoStore((s) => s.actions)
  const { marketConfig, perpMarket } = position

  async function handleMarketClose() {
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const mangoClient = useMangoStore.getState().connection.client
    const askInfo =
      useMangoStore.getState().accountInfos[marketConfig.asksKey.toString()]
    const bidInfo =
      useMangoStore.getState().accountInfos[marketConfig.bidsKey.toString()]

    const orderbook = useMangoStore.getState().selectedMarket.orderBook
    const markPrice = useMangoStore.getState().selectedMarket.markPrice
    const referrerPk = useMangoStore.getState().referrerPk

    // The reference price is the book mid if book is double sided; else mark price
    const bb = orderbook?.bids?.length > 0 && Number(orderbook.bids[0][0])
    const ba = orderbook?.asks?.length > 0 && Number(orderbook.asks[0][0])
    const referencePrice = bb && ba ? (bb + ba) / 2 : markPrice

    if (!wallet || !mangoGroup || !mangoAccount) return
    setSubmitting(true)

    try {
      const perpAccount = mangoAccount.perpAccounts[marketConfig.marketIndex]
      const side = perpAccount.basePosition.gt(ZERO_BN) ? 'sell' : 'buy'
      // send a large size to ensure we are reducing the entire position
      const size =
        Math.abs(perpMarket.baseLotsToNumber(perpAccount.basePosition)) * 2

      // hard coded for now; market orders are very dangerous and fault prone
      const maxSlippage: number | undefined = 0.025

      const txid = await mangoClient.placePerpOrder2(
        mangoGroup,
        mangoAccount,
        perpMarket,
        wallet?.adapter,
        side,
        referencePrice * (1 + (side === 'buy' ? 1 : -1) * maxSlippage),
        size,
        {
          orderType: 'ioc',
          bookSideInfo: side === 'buy' ? askInfo : bidInfo,
          reduceOnly: true,
          referrerMangoAccountPk: referrerPk ? referrerPk : undefined,
        }
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
      <h2 className="mb-2">
        {t('close-confirm', { config_name: marketConfig.name })}
      </h2>
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
