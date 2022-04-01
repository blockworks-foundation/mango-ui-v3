import React, { FunctionComponent, useCallback } from 'react'
import { LinkIcon } from '@heroicons/react/outline'
import useMangoStore from '../stores/useMangoStore'
import { MoveIcon } from './icons'
import EmptyState from './EmptyState'
import { useTranslation } from 'next-i18next'
import { handleWalletConnect } from 'components/ConnectWalletButton'
import { useWallet } from '@solana/wallet-adapter-react'

interface FloatingElementProps {
  className?: string
  showConnect?: boolean
}

const FloatingElement: FunctionComponent<FloatingElementProps> = ({
  className,
  children,
  showConnect,
}) => {
  const { t } = useTranslation('common')
  const { wallet, connected } = useWallet()
  const { uiLocked } = useMangoStore((s) => s.settings)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)

  const handleConnect = useCallback(() => {
    if (wallet) {
      handleWalletConnect(wallet)
    }
  }, [wallet])

  return (
    <div
      className={`thin-scroll relative overflow-auto overflow-x-hidden rounded-lg bg-th-bkg-2 p-2.5 md:p-4 ${className}`}
    >
      {!connected && showConnect ? (
        <div className="absolute top-0 left-0 z-10 h-full w-full">
          <div className="relative z-10 flex h-full flex-col items-center justify-center">
            <EmptyState
              disabled={!wallet || !mangoGroup}
              buttonText={t('connect')}
              icon={<LinkIcon />}
              onClickButton={handleConnect}
              title={t('connect-wallet')}
            />
          </div>
          <div className="absolute top-0 left-0 h-full w-full rounded-lg bg-th-bkg-2 opacity-50" />
        </div>
      ) : null}
      {!uiLocked ? (
        <div className="absolute top-0 left-0 z-50 h-full w-full cursor-move opacity-80">
          <div className="relative z-50 flex h-full flex-col items-center justify-center text-th-fgd-1">
            <MoveIcon className="h-8 w-8" />
            <div className="mt-2">{t('reposition')}</div>
          </div>
          <div className="absolute top-0 left-0 h-full w-full rounded-lg bg-th-bkg-3" />
        </div>
      ) : null}
      {children}
    </div>
  )
}

export default FloatingElement
