import { ChevronDownIcon } from '@heroicons/react/solid'
import React, { Fragment, useState } from 'react'
import { settlePnl, settlePosPnl } from 'components/MarketPosition'
import Button from 'components/Button'
import { Transition } from '@headlessui/react'
import { useTranslation } from 'next-i18next'
import Loading from 'components/Loading'
import useMangoStore from 'stores/useMangoStore'

const MenuButton = ({ onClick, text }) => {
  return (
    <div
      className="default-transition flex items-center justify-end whitespace-nowrap pb-2.5 text-xs tracking-wider text-th-fgd-1 hover:cursor-pointer hover:text-th-primary"
      onClick={onClick}
    >
      {text}
    </div>
  )
}

export const RedeemDropdown: React.FC = () => {
  const { t } = useTranslation('common')
  const { reloadMangoAccount } = useMangoStore((s) => s.actions)
  const [settling, setSettling] = useState(false)
  const [settlingPosPnl, setSettlingPosPnl] = useState(false)
  const [open, setOpen] = useState(false)
  const unsettledPositions =
    useMangoStore.getState().selectedMangoAccount.unsettledPerpPositions
  const openPositions = useMangoStore(
    (s) => s.selectedMangoAccount.openPerpPositions
  )

  const loading = settling || settlingPosPnl

  const handleSettleAll = async () => {
    setOpen(false)
    setSettling(true)
    for (const p of unsettledPositions) {
      await settlePnl(p.perpMarket, p.perpAccount, t, undefined)
    }

    reloadMangoAccount()
    setSettling(false)
  }

  const handleSettlePosPnl = async () => {
    setOpen(false)
    setSettlingPosPnl(true)
    for (const p of openPositions) {
      if (p.unsettledPnl > 0) {
        console.log('settlePosPnl', settlePosPnl)
        // await settlePosPnl([p.perpMarket], p.perpAccount, t, undefined)
      }
    }
    setTimeout(() => {
      setSettlingPosPnl(false)
    }, 2000)
  }

  return (
    <div
      className="relative"
      onMouseOver={() => setOpen(true)}
      onMouseOut={() => setOpen(false)}
    >
      <Button className="flex h-8 w-full items-center justify-center rounded-full bg-th-bkg-button pt-0 pb-0 pl-3 pr-2 text-xs font-bold hover:brightness-[1.1] hover:filter sm:w-auto">
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
          <MenuButton onClick={handleSettleAll} text={t('redeem-all')} />
          <MenuButton
            onClick={handleSettlePosPnl}
            text={t('redeem-positive')}
          />
        </div>
      </Transition>
    </div>
  )
}
