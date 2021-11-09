import {
  FunctionComponent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import useMangoStore, { MNGO_INDEX } from '../stores/useMangoStore'
import { XCircleIcon } from '@heroicons/react/outline'
import Button from './Button'
import Modal from './Modal'
import { ElementTitle } from './styles'
import { notify } from '../utils/notifications'
//import { useTranslation } from 'next-i18next'
import { CheckCircleIcon } from '@heroicons/react/solid'
import {
  getMultipleAccounts,
  nativeToUi,
  zeroKey,
  ZERO_BN,
  ZERO_I80F48,
} from '@blockworks-foundation/mango-client'
import usePerpPositions from '../hooks/usePerpPositions'
import { useOpenOrders } from '../hooks/useOpenOrders'

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
  //const { t } = useTranslation('common')
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
  const mangoAccounts = useMangoStore((s) => s.mangoAccounts)

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
      await client.emptyAndCloseMangoAccount(
        mangoGroup,
        mangoAccount,
        mangoCache,
        wallet
      )

      actions.fetchAllMangoAccounts()
      setMangoStore((state) => {
        state.selectedMangoAccount.current = mangoAccounts[0]
      })
      actions.reloadMangoAccount()
      onClose()
      notify({
        title: 'Account Deleted',
      })
    } catch (err) {
      console.warn('Error deleting account:', err)
      notify({
        title: 'Error deleting account',
        description: `${err}`,
        txid: err.txid,
        type: 'error',
      })
    }
  }

  return (
    <Modal onClose={onClose} isOpen={isOpen && mangoAccount !== undefined}>
      <Modal.Header>
        <div className="flex items-center">
          <ElementTitle noMarignBottom>Close your account</ElementTitle>
        </div>
      </Modal.Header>
      <div className="text-th-fgd-2 text-center my-4">
        You can close your Mango account and recover the small amount of SOL
        used to cover rent exemption.
      </div>
      <div className="text-th-fgd-2 text-center my-4">
        To close your account you must:
      </div>

      <div className="bg-th-bkg-4 overflow-none p-2 sm:p-6 rounded-lg">
        <div className="flex items-center text-th-fgd-2 mb-4 ">
          {!hasBorrows ? (
            <CheckCircleIcon className="h-4 w-4 mr-1.5 text-th-green" />
          ) : (
            <XCircleIcon className="h-4 w-4 mr-1.5 text-th-red" />
          )}{' '}
          Close all borrows
        </div>
        <div className="flex items-center text-th-fgd-2 mb-4">
          {!hasOpenPositions ? (
            <CheckCircleIcon className="h-4 w-4 mr-1.5 text-th-green" />
          ) : (
            <XCircleIcon className="h-4 w-4 mr-1.5 text-th-red" />
          )}{' '}
          Close and settle all Perp positons
        </div>
        <div className="flex items-center text-th-fgd-2">
          {openOrders && !openOrders.length ? (
            <CheckCircleIcon className="h-4 w-4 mr-1.5 text-th-green" />
          ) : (
            <XCircleIcon className="h-4 w-4 mr-1.5 text-th-red" />
          )}{' '}
          Close all open orders
        </div>
      </div>

      <div className="text-th-fgd-2 text-center my-4">
        By closing your account you will:
      </div>
      <div className="bg-th-bkg-4 overflow-wrap p-2 sm:p-6 rounded-lg">
        <div className="flex items-center text-th-fgd-2">
          <CheckCircleIcon className="h-4 w-4 mr-1.5 text-th-green" />
          Delete your Mango account
        </div>
        {mangoAccount &&
        mangoAccount.getAssetsVal(mangoGroup, mangoCache).gt(ZERO_I80F48) ? (
          <div className="flex items-center text-th-fgd-2 mt-4">
            <CheckCircleIcon className="h-4 w-4 mr-1.5 text-th-green" />
            Withdraw assets worth $
            {mangoAccount.getAssetsVal(mangoGroup, mangoCache).toFixed(2)}
          </div>
        ) : (
          ''
        )}
        <div className="flex items-center text-th-fgd-2 mt-4">
          <CheckCircleIcon className="h-4 w-4 mr-1.5 text-th-green" />
          Recover {totalAccountSOL.toFixed(3)} SOL
        </div>
        {!mngoAccrued.isZero() ? (
          <div className="flex items-center text-th-fgd-2 mt-4">
            <CheckCircleIcon className="h-4 w-4 mr-1.5 text-th-green" />
            Claim{' '}
            {mangoGroup
              ? nativeToUi(
                  mngoAccrued.toNumber(),
                  mangoGroup.tokens[MNGO_INDEX].decimals
                ).toFixed(3)
              : 0}{' '}
            MNGO in unclaimed rewards
          </div>
        ) : (
          ''
        )}
      </div>
      <div className="text-th-fgd-2 text-center my-4">
        Goodbye and good luck 🙏
      </div>
      <Button
        onClick={() => closeAccount()}
        disabled={
          (openOrders && openOrders.length > 0) ||
          hasBorrows ||
          hasOpenPositions
        }
        className="mt-4 w-full"
      >
        Close Account
      </Button>
    </Modal>
  )
}

export default CloseAccountModal
