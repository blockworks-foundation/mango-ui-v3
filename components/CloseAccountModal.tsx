import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import useMangoStore, { MNGO_INDEX } from '../stores/useMangoStore'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/outline'
import Button from './Button'
import Modal from './Modal'
import { ElementTitle } from './styles'
import { notify } from '../utils/notifications'
import { useTranslation } from 'next-i18next'
import {
  getMultipleAccounts,
  nativeToUi,
  zeroKey,
  ZERO_BN,
  ZERO_I80F48,
} from '@blockworks-foundation/mango-client'
import usePerpPositions from '../hooks/usePerpPositions'
import { useOpenOrders } from '../hooks/useOpenOrders'
import { formatUsdValue } from '../utils'

interface CloseAccountModalProps {
  accountName?: string
  lamports?: number
  isOpen: boolean
  onClose?: (x?) => void
}

const CloseAccountModal: FunctionComponent<CloseAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation(['common', 'close-account'])
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const { openPositions, unsettledPositions } = usePerpPositions()
  const [hasBorrows, setHasBorrows] = useState(false)
  const [hasOpenPositions, setHasOpenPositions] = useState(false)
  const [totalAccountSOL, setTotalAccountSOL] = useState(0)
  const actions = useMangoStore((s) => s.actions)
  const connection = useMangoStore((s) => s.connection.current)
  const client = useMangoStore((s) => s.connection.client)
  const openOrders = useOpenOrders()
  const setMangoStore = useMangoStore((s) => s.set)

  const fetchTotalAccountSOL = useCallback(async () => {
    if (!mangoAccount) {
      return
    }
    const accountKeys = [
      mangoAccount.publicKey,
      ...mangoAccount.spotOpenOrders.filter((oo) => !oo.equals(zeroKey)),
      ...(!mangoAccount.advancedOrdersKey.equals(zeroKey)
        ? [mangoAccount.advancedOrdersKey]
        : []),
    ]
    const accounts = await getMultipleAccounts(connection, accountKeys)
    const lamports =
      accounts.reduce((total, account) => {
        return total + account.accountInfo.lamports
      }, 0) * 0.000000001

    setTotalAccountSOL(lamports)
  }, [mangoAccount])

  useEffect(() => {
    if (mangoAccount) {
      if (mangoAccount.borrows.some((b) => b.gt(ZERO_I80F48))) {
        setHasBorrows(true)
      }
      if (openPositions.length || unsettledPositions.length) {
        setHasOpenPositions(true)
      }
    }

    fetchTotalAccountSOL()
  }, [mangoAccount])

  const mngoAccrued = useMemo(() => {
    return mangoAccount
      ? mangoAccount.perpAccounts.reduce((acc, perpAcct) => {
          return perpAcct.mngoAccrued.add(acc)
        }, ZERO_BN)
      : ZERO_BN
  }, [mangoAccount])

  const closeAccount = async () => {
    const wallet = useMangoStore.getState().wallet.current
    try {
      const txids = await client.emptyAndCloseMangoAccount(
        mangoGroup,
        mangoAccount,
        mangoCache,
        MNGO_INDEX,
        wallet
      )

      await actions.fetchAllMangoAccounts()
      const mangoAccounts = useMangoStore.getState().mangoAccounts

      setMangoStore((state) => {
        state.selectedMangoAccount.current = mangoAccounts.length
          ? mangoAccounts[0]
          : null
      })

      onClose()
      for (const txid of txids) {
        notify({
          title: t('transaction-confirmed'),
          txid,
        })
      }
    } catch (err) {
      console.warn('Error deleting account:', err)
      notify({
        title: t('error-deleting-account'),
        description: `${err.message}`,
        txid: err.txid,
        type: 'error',
      })
    }
  }

  const isDisabled =
    (openOrders && openOrders.length > 0) || hasBorrows || hasOpenPositions

  return (
    <Modal onClose={onClose} isOpen={isOpen && mangoAccount !== undefined}>
      <ElementTitle noMarignBottom>Are you sure?</ElementTitle>
      <p className="text-center mt-1">Closing your Mango Account will:</p>
      <div className="bg-th-bkg-4 overflow-wrap p-2 sm:p-4 rounded-md space-y-2">
        <div className="flex items-center text-th-fgd-2">
          <CheckCircleIcon className="h-4 w-4 mr-1.5 text-th-green" />
          Delete your Mango Account
        </div>
        {mangoAccount &&
        mangoAccount.getAssetsVal(mangoGroup, mangoCache).gt(ZERO_I80F48) ? (
          <div className="flex items-center text-th-fgd-2">
            <CheckCircleIcon className="h-4 w-4 mr-1.5 text-th-green" />
            {t('close-account:withdraw-assets-worth', {
              value: formatUsdValue(
                +mangoAccount.computeValue(mangoGroup, mangoCache)
              ),
            })}
          </div>
        ) : (
          ''
        )}
        <div className="flex items-center text-th-fgd-2">
          <CheckCircleIcon className="h-4 w-4 mr-1.5 text-th-green" />
          Recover {totalAccountSOL.toFixed(3)} SOL (rent for your account)
        </div>
        {!mngoAccrued.isZero() ? (
          <div className="flex items-center text-th-fgd-2">
            <CheckCircleIcon className="h-4 w-4 mr-1.5 text-th-green" />
            Claim{' '}
            {mangoGroup
              ? nativeToUi(
                  mngoAccrued.toNumber(),
                  mangoGroup.tokens[MNGO_INDEX].decimals
                ).toFixed(3)
              : 0}{' '}
            MNGO Rewards
          </div>
        ) : (
          ''
        )}
      </div>
      {isDisabled ? (
        <>
          <h3 className="text-center my-3">Before you can continue</h3>
          <div className="bg-th-bkg-4 overflow-none p-2 sm:p-4 rounded-md space-y-2">
            {hasBorrows ? (
              <div className="flex items-center text-th-fgd-2">
                <ExclamationCircleIcon className="h-4 w-4 mr-1.5 text-th-red" />
                Close all borrows
              </div>
            ) : null}
            {hasOpenPositions ? (
              <div className="flex items-center text-th-fgd-2">
                <ExclamationCircleIcon className="h-4 w-4 mr-1.5 text-th-red" />
                Close and settle all perp positons
              </div>
            ) : null}
            {openOrders && openOrders.length ? (
              <div className="flex items-center text-th-fgd-2">
                <ExclamationCircleIcon className="h-4 w-4 mr-1.5 text-th-red" />
                Close all open orders
              </div>
            ) : null}
          </div>
        </>
      ) : null}
      {!isDisabled ? (
        <div className="text-th-fgd-2 text-center mt-4">Until next time 👋</div>
      ) : null}
      <Button
        onClick={() => closeAccount()}
        disabled={isDisabled}
        className="mt-6 w-full"
      >
        {t('close-account:close-account')}
      </Button>
    </Modal>
  )
}

export default CloseAccountModal
