import { FunctionComponent, useEffect, useRef, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import { PerpMarket, ZERO_BN } from '@blockworks-foundation/mango-client'
import Button, { LinkButton } from './Button'
import { notify } from '../utils/notifications'
import Loading from './Loading'
import { sleep } from '../utils'
import Modal from './Modal'
import { useTranslation } from 'next-i18next'

interface MarketCloseModalProps {
  onClose: () => void
  isOpen: boolean
  market: PerpMarket
  marketIndex: number
}

const MarketCloseModal: FunctionComponent<MarketCloseModalProps> = ({
  onClose,
  isOpen,
  market,
  marketIndex,
}) => {
  const { t } = useTranslation('common')
  const [submitting, setSubmitting] = useState(false)
  const actions = useMangoStore((s) => s.actions)
  const mangoClient = useMangoStore((s) => s.connection.client)
  const orderBookRef = useRef(useMangoStore.getState().selectedMarket.orderBook)
  const config = useMangoStore.getState().selectedMarket.config

  useEffect(
    () =>
      useMangoStore.subscribe(
        // @ts-ignore
        (orderBook) => (orderBookRef.current = orderBook),
        (state) => state.selectedMarket.orderBook
      ),
    []
  )

  async function handleMarketClose() {
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const marketConfig = useMangoStore.getState().selectedMarket.config
    const askInfo =
      useMangoStore.getState().accountInfos[marketConfig.asksKey.toString()]
    const bidInfo =
      useMangoStore.getState().accountInfos[marketConfig.bidsKey.toString()]
    const wallet = useMangoStore.getState().wallet.current

    if (!wallet || !mangoGroup || !mangoAccount) return
    setSubmitting(true)

    try {
      const perpAccount = mangoAccount.perpAccounts[marketIndex]
      const side = perpAccount.basePosition.gt(ZERO_BN) ? 'sell' : 'buy'
      const price = 1
      // send a large size to ensure we are reducing the entire position
      const size =
        Math.abs(market.baseLotsToNumber(perpAccount.basePosition)) * 2

      const txid = await mangoClient.placePerpOrder(
        mangoGroup,
        mangoAccount,
        mangoGroup.mangoCache,
        market,
        wallet,
        side,
        price,
        size,
        'market',
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
        {t('close-confirm', { config_name: config.name })}
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
