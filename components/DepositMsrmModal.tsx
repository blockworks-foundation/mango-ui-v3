import { useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import Button, { LinkButton } from './Button'
import { notify } from '../utils/notifications'
import Loading from './Loading'
import Modal from './Modal'
import { msrmMints } from '@blockworks-foundation/mango-client'
import { useTranslation } from 'next-i18next'

const DepositMsrmModal = ({ onClose, isOpen }) => {
  const { t } = useTranslation('common')
  const [submitting, setSubmitting] = useState(false)
  const actions = useMangoStore((s) => s.actions)
  const mangoClient = useMangoStore((s) => s.connection.client)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const wallet = useMangoStore((s) => s.wallet.current)
  const walletTokens = useMangoStore((s) => s.wallet.tokens)
  const cluster = useMangoStore.getState().connection.cluster

  const handleMsrmDeposit = async () => {
    setSubmitting(true)
    const ownerMsrmAccount = walletTokens.find((t) =>
      t.account.mint.equals(msrmMints[cluster])
    )
    try {
      const txid = await mangoClient.depositMsrm(
        mangoGroup,
        mangoAccount,
        wallet,
        ownerMsrmAccount?.account?.publicKey,
        1
      )
      notify({
        title: t('msrm-deposited'),
        txid,
      })
    } catch (e) {
      console.log('error:', e)
      notify({
        type: 'error',
        title: t('msrm-deposit-error'),
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
      <div className="text-th-fgd-1 text-lg flex justify-center">
        {t('deposit')}
      </div>
      <div className="text-th-fgd-1 bg-th-bkg-1 text-lg text-center border border-th-bkg-3 p-6 mt-4">
        1 MSRM
      </div>
      <div className="flex items-center justify-center mt-6">
        <Button onClick={handleMsrmDeposit}>
          {submitting ? <Loading /> : <span>{t('confirm')}</span>}
        </Button>
        <LinkButton className="ml-4 text-th-fgd-1" onClick={onClose}>
          {t('cancel')}
        </LinkButton>
      </div>
    </Modal>
  )
}

export default DepositMsrmModal
