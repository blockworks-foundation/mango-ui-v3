import { ChevronDownIcon } from '@heroicons/react/solid'
import React, { Fragment, useState } from 'react'
import { settlePnl, settlePosPnl } from 'components/MarketPosition'
import Button from 'components/Button'
import { Transition } from '@headlessui/react'
import { useTranslation } from 'next-i18next'
import Loading from 'components/Loading'
import useMangoStore from 'stores/useMangoStore'
import { useWallet } from '@solana/wallet-adapter-react'

const MenuButton: React.FC<{
  onClick: () => void
  text: string
  disabled?: boolean
}> = ({ onClick, text, disabled }) => {
  return (
    <div
      className={`default-transition flex items-center justify-end whitespace-nowrap pb-2.5 text-xs tracking-wider hover:cursor-pointer hover:text-th-primary ${
        disabled ? 'pointer-events-none text-th-fgd-4' : 'text-th-fgd-1'
      }`}
      onClick={disabled ? () => null : onClick}
    >
      {text}
    </div>
  )
}

export const RedeemDropdown: React.FC = () => {
  const { t } = useTranslation('common')
  const { reloadMangoAccount } = useMangoStore((s) => s.actions)
  const [settling, setSettling] = useState(false)
  const { wallet } = useWallet()
  const [settlingPosPnl, setSettlingPosPnl] = useState(false)
  const [open, setOpen] = useState(false)
  const unsettledPositions =
    useMangoStore.getState().selectedMangoAccount.unsettledPerpPositions
  const unsettledPositivePositions = useMangoStore
    .getState()
    .selectedMangoAccount.unsettledPerpPositions?.filter(
      (p) => p.unsettledPnl > 0
    )

  const loading = settling || settlingPosPnl

  const handleSettleAll = async () => {
    if (!wallet) return
    setOpen(false)
    setSettling(true)
    for (const p of unsettledPositions) {
      await settlePnl(p.perpMarket, p.perpAccount, t, undefined, wallet)
    }

    reloadMangoAccount()
    setSettling(false)
  }

  const handleSettlePosPnl = async () => {
    if (!wallet) return
    setOpen(false)
    setSettlingPosPnl(true)
    for (const p of unsettledPositivePositions) {
      await settlePosPnl([p.perpMarket], p.perpAccount, t, undefined, wallet)
    }
    setSettlingPosPnl(false)
  }

  const buttons = [
    { onClick: handleSettleAll, disabled: false, text: t('redeem-all') },
    {
      onClick: handleSettlePosPnl,
      disabled: !unsettledPositivePositions?.length,
      text: t('redeem-positive'),
    },
  ]

  return (
    <div
      className="relative"
      onMouseOver={() => setOpen(true)}
      onMouseOut={() => setOpen(false)}
    >
      <Button
        className="flex h-8 w-full items-center justify-center rounded-full bg-th-bkg-button pt-0 pb-0 pl-3 pr-2 text-xs font-bold hover:brightness-[1.1] hover:filter sm:w-auto"
        disabled={!unsettledPositions?.length}
      >
        {loading ? (
          <Loading />
        ) : (
          <>
            {t('redeem-pnl')}
            <ChevronDownIcon
              className={`default-transition h-5 w-5 ${
                open ? 'rotate-180 transform' : 'rotate-360 transform'
              }`}
            />
          </>
        )}
      </Button>
      <Transition
        appear={true}
        show={open}
        as={Fragment}
        enter="transition-all ease-in duration-200"
        enterFrom="opacity-0 transform scale-75"
        enterTo="opacity-100 transform scale-100"
        leave="transition ease-out duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="absolute right-0 rounded-md bg-th-bkg-3 px-4 pt-2.5">
          {buttons.map((b) => {
            return (
              <MenuButton
                key={b.text}
                onClick={b.onClick}
                text={b.text}
                disabled={b.disabled}
              />
            )
          })}
        </div>
      </Transition>
    </div>
  )
}
