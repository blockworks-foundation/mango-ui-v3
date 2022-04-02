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
import { formatUsdValue } from '../utils'
import { useWallet } from '@solana/wallet-adapter-react'

interface CloseAccountModalProps {
  lamports?: number
  isOpen: boolean
  onClose?: (x?) => void
}

const CloseAccountModal: FunctionComponent<CloseAccountModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation(['common', 'close-account'])
  const { wallet } = useWallet()
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const openPositions = useMangoStore(
    (s) => s.selectedMangoAccount.openPerpPositions
  )
  const unsettledPositions = useMangoStore(
    (s) => s.selectedMangoAccount.unsettledPerpPositions
  )
  const [hasBorrows, setHasBorrows] = useState(false)
  const [hasOpenPositions, setHasOpenPositions] = useState(false)
  const [totalAccountSOL, setTotalAccountSOL] = useState(0)
  const actions = useMangoStore((s) => s.actions)
  const connection = useMangoStore((s) => s.connection.current)
  const openOrders = useMangoStore((s) => s.selectedMangoAccount.openOrders)
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
    const mangoClient = useMangoStore.getState().connection.client

    if (!mangoGroup || !mangoAccount || !mangoCache || !wallet) {
      return
    }

    try {
      const txids = await mangoClient.emptyAndCloseMangoAccount(
        mangoGroup,
        mangoAccount,
        mangoCache,
        MNGO_INDEX,
        wallet.adapter
      )

      await actions.fetchAllMangoAccounts(wallet)
      const mangoAccounts = useMangoStore.getState().mangoAccounts

      setMangoStore((state) => {
        state.selectedMangoAccount.current = mangoAccounts.length
          ? mangoAccounts[0]
          : null
      })

      onClose?.()
      if (txids) {
        for (const txid of txids) {
          notify({
            title: t('close-account:transaction-confirmed'),
            txid,
          })
        }
      } else {
        notify({
          title: t('close-account:error-deleting-account'),
          description: t('transaction-failed'),
          type: 'error',
        })
      }
    } catch (err) {
      console.warn('Error deleting account:', err)
      notify({
        title: t('close-account:error-deleting-account'),
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
      <Modal.Header>
        <ElementTitle noMarginBottom>
          {t('close-account:are-you-sure')}
        </ElementTitle>
        <p className="mt-1 text-center">
          {t('close-account:closing-account-will')}
        </p>
      </Modal.Header>
      <div className="overflow-wrap space-y-2 rounded-md bg-th-bkg-4 p-2 sm:p-4">
        <div className="flex items-center text-th-fgd-2">
          <CheckCircleIcon className="mr-1.5 h-4 w-4 text-th-green" />
          {t('close-account:delete-your-account')}
        </div>
        {mangoAccount &&
        mangoGroup &&
        mangoCache &&
        mangoAccount.getAssetsVal(mangoGroup, mangoCache).gt(ZERO_I80F48) ? (
          <div className="flex items-center text-th-fgd-2">
            <CheckCircleIcon className="mr-1.5 h-4 w-4 text-th-green" />
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
          <CheckCircleIcon className="mr-1.5 h-4 w-4 text-th-green" />
          {t('close-account:recover-x-sol', {
            amount: totalAccountSOL.toFixed(3),
          })}
        </div>
        {!mngoAccrued.isZero() ? (
          <div className="flex items-center text-th-fgd-2">
            <CheckCircleIcon className="mr-1.5 h-4 w-4 text-th-green" />
            {t('close-account:claim-x-mngo-rewards', {
              amount: mangoGroup
                ? nativeToUi(
                    mngoAccrued.toNumber(),
                    mangoGroup.tokens[MNGO_INDEX].decimals
                  ).toFixed(3)
                : 0,
            })}
          </div>
        ) : (
          ''
        )}
      </div>
      {isDisabled ? (
        <>
          <h3 className="my-3 text-center">
            {t('close-account:before-you-continue')}
          </h3>
          <div className="overflow-none space-y-2 rounded-md bg-th-bkg-4 p-2 sm:p-4">
            {hasBorrows ? (
              <div className="flex items-center text-th-fgd-2">
                <ExclamationCircleIcon className="mr-1.5 h-4 w-4 text-th-red" />
                {t('close-account:close-all-borrows')}
              </div>
            ) : null}
            {hasOpenPositions ? (
              <div className="flex items-center text-th-fgd-2">
                <ExclamationCircleIcon className="mr-1.5 h-4 w-4 text-th-red" />
                {t('close-account:close-perp-positions')}
              </div>
            ) : null}
            {openOrders && openOrders.length ? (
              <div className="flex items-center text-th-fgd-2">
                <ExclamationCircleIcon className="mr-1.5 h-4 w-4 text-th-red" />
                {t('close-account:close-open-orders')}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
      {!isDisabled ? (
        <div className="mt-4 text-center text-th-fgd-2">
          {t('close-account:goodbye')}
        </div>
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
