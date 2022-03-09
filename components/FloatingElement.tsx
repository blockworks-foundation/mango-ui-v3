import React, { FunctionComponent } from 'react'
// import styled from '@emotion/styled'
import { LinkIcon } from '@heroicons/react/outline'
import useMangoStore from '../stores/useMangoStore'
import { MoveIcon } from './icons'
import EmptyState from './EmptyState'
import { useTranslation } from 'next-i18next'

// const StyledDragWrapperContent = styled.div`
//   transition: all 0.25s ease-in;
//   opacity: 0;
// `

// const StyledDragBkg = styled.div`
//   transition: all 0.25s ease-in;
//   opacity: 0;
// `

// const StyledDragWrapper = styled.div`
//   :hover {
//     ${StyledDragWrapperContent} {
//       opacity: 1;
//     }
//     ${StyledDragBkg} {
//       opacity: 0.9;
//     }
//   }
// `

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
  const { uiLocked } = useMangoStore((s) => s.settings)
  const connected = useMangoStore((s) => s.wallet.connected)
  const wallet = useMangoStore((s) => s.wallet.current)
  return (
    <div
      className={`thin-scroll relative overflow-auto overflow-x-hidden rounded-lg bg-th-bkg-2 p-2.5 md:p-4 ${className}`}
    >
      {!connected && showConnect ? (
        <div className="absolute top-0 left-0 z-10 h-full w-full">
          <div className="relative z-10 flex h-full flex-col items-center justify-center">
            <EmptyState
              buttonText={t('connect')}
              icon={<LinkIcon />}
              onClickButton={() => (wallet ? wallet.connect() : null)}
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
