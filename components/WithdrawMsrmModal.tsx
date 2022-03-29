import { useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import Button, { LinkButton } from './Button'
import { notify } from '../utils/notifications'
import Loading from './Loading'
import Modal from './Modal'
import { msrmMints } from '@blockworks-foundation/mango-client'
import { useTranslation } from 'next-i18next'
import { useWallet } from '@solana/wallet-adapter-react'

const WithdrawMsrmModal = ({ onClose, isOpen }) => {
  const { t } = useTranslation('common')
  const [submitting, setSubmitting] = useState(false)
  const actions = useMangoStore((s) => s.actions)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const walletTokens = useMangoStore((s) => s.wallet.tokens)
  const { wallet } = useWallet()
  const cluster = useMangoStore.getState().connection.cluster

  const handleMsrmWithdraw = async () => {
    if (!mangoGroup || !mangoAccount || !wallet) {
      return
    }
    setSubmitting(true)
    const mangoClient = useMangoStore.getState().connection.client
    const ownerMsrmAccount = walletTokens.find((t) =>
      t.account.mint.equals(msrmMints[cluster])
    )
    try {
      const txid = await mangoClient.withdrawMsrm(
        mangoGroup,
        mangoAccount,
        wallet?.adapter,
        ownerMsrmAccount.account.publicKey,
        1
      )
      notify({
        title: t('msrm-withdrawal'),
        txid,
      })
    } catch (e) {
      console.log('error:', e)
      notify({
        type: 'error',
        title: t('msrm-withdraw-error'),
        description: e.message,
      })
    } finally {
      setSubmitting(false)
      actions.fetchMangoGroup()
      actions.reloadMangoAccount()
      onClose()
    }
  }

  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <div className="flex justify-center text-lg text-th-fgd-1">
        {t('withdraw')}
      </div>
      <div className="mt-4 border border-th-bkg-3 bg-th-bkg-1 p-6 text-center text-lg text-th-fgd-1">
        1 MSRM
      </div>
      <div className="mt-6 flex items-center justify-center">
        <Button onClick={handleMsrmWithdraw}>
          {submitting ? <Loading /> : <span>{t('confirm')}</span>}
        </Button>
        <LinkButton className="ml-4 text-th-fgd-1" onClick={onClose}>
          {t('cancel')}
        </LinkButton>
      </div>
    </Modal>
  )
}

export default WithdrawMsrmModal
