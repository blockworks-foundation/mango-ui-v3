import { ReactNode, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  MenuIcon,
  XIcon,
} from '@heroicons/react/solid'
import { BtcMonoIcon, TradeIcon } from '../icons'
import { useTranslation } from 'next-i18next'
import { IconButton } from '../Button'
import {
  CalculatorIcon,
  CashIcon,
  ChevronRightIcon,
  CurrencyDollarIcon as FeesIcon,
  LightBulbIcon,
  SwitchHorizontalIcon,
  UserAddIcon,
} from '@heroicons/react/outline'

const StyledBarItemLabel = ({ children, ...props }) => (
  <div style={{ fontSize: '0.6rem', lineHeight: 1 }} {...props}>
    {children}
  </div>
)

const BottomBar = () => {
  const { t } = useTranslation('common')
  const { asPath } = useRouter()
  const [showPanel, setShowPanel] = useState(false)

  return (
    <>
      <div className="default-transition grid grid-cols-5 grid-rows-1 bg-th-bkg-3 py-2.5">
        <Link
          href={{
            pathname: '/select',
          }}
        >
          <div
            className={`${
              asPath === '/select' ? 'text-th-primary' : 'text-th-fgd-3'
            } default-transition col-span-1 flex cursor-pointer flex-col items-center hover:text-th-primary`}
          >
            <BtcMonoIcon className="mb-1 h-4 w-4" />
            <StyledBarItemLabel>{t('markets')}</StyledBarItemLabel>
          </div>
        </Link>
        <Link
          href={{
            pathname: '/',
            query: { name: 'BTC-PERP' },
          }}
          shallow={true}
        >
          <div
            className={`${
              asPath === '/' || asPath.startsWith('/?name')
                ? 'text-th-primary'
                : 'text-th-fgd-3'
            } default-transition col-span-1 flex cursor-pointer flex-col items-center hover:text-th-primary`}
          >
            <TradeIcon className="mb-1 h-4 w-4" />
            <StyledBarItemLabel>{t('trade')}</StyledBarItemLabel>
          </div>
        </Link>
        <Link href="/account" shallow={true}>
          <div
            className={`${
              asPath === '/account' ? 'text-th-primary' : 'text-th-fgd-3'
            } default-transition col-span-1 flex cursor-pointer flex-col items-center hover:text-th-primary`}
          >
            <CurrencyDollarIcon className="mb-1 h-4 w-4" />
            <StyledBarItemLabel>{t('account')}</StyledBarItemLabel>
          </div>
        </Link>
        <Link href="/stats" shallow={true}>
          <div
            className={`${
              asPath === '/stats' ? 'text-th-primary' : 'text-th-fgd-3'
            } default-transition col-span-1 flex cursor-pointer flex-col items-center hover:text-th-primary`}
          >
            <ChartBarIcon className="mb-1 h-4 w-4" />
            <StyledBarItemLabel>{t('stats')}</StyledBarItemLabel>
          </div>
        </Link>
        <div
          className={`${
            showPanel ? 'text-th-primary' : 'text-th-fgd-3'
          } default-transition col-span-1 flex cursor-pointer flex-col items-center hover:text-th-primary`}
          onClick={() => setShowPanel(!showPanel)}
        >
          <MenuIcon className="mb-1 h-4 w-4" />
          <StyledBarItemLabel>{t('more')}</StyledBarItemLabel>
        </div>
      </div>
      <MoreMenuPanel showPanel={showPanel} setShowPanel={setShowPanel} />
    </>
  )
}

export default BottomBar

const MoreMenuPanel = ({
  showPanel,
  setShowPanel,
}: {
  showPanel: boolean
  setShowPanel: (showPanel: boolean) => void
}) => {
  const { t } = useTranslation('common')
  return (
    <div
      className={`fixed bottom-0 z-30 h-96 w-full transform overflow-hidden bg-th-bkg-4 px-4 transition-all duration-700 ease-in-out ${
        showPanel ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex justify-end py-4">
        <IconButton className="" onClick={() => setShowPanel(false)}>
          <XIcon className="h-5 w-5" />
        </IconButton>
      </div>
      <div
        className="border-b border-th-fgd-4"
        onClick={() => setShowPanel(false)}
      >
        <MoreMenuItem
          title={t('borrow')}
          path="/borrow"
          icon={<CashIcon className="h-5 w-5" />}
        />
        <MoreMenuItem
          title={t('calculator')}
          path="/risk-calculator"
          icon={<CalculatorIcon className="h-5 w-5" />}
        />
        <MoreMenuItem
          title={t('swap')}
          path="/swap"
          icon={<SwitchHorizontalIcon className="h-5 w-5" />}
        />
        <MoreMenuItem
          title={t('referrals')}
          path="/referral"
          icon={<UserAddIcon className="h-5 w-5" />}
        />
        <MoreMenuItem
          title={t('fees')}
          path="/fees"
          icon={<FeesIcon className="h-5 w-5" />}
        />
        <MoreMenuItem
          title={t('learn')}
          path="https://docs.mango.markets/"
          icon={<LightBulbIcon className="h-5 w-5" />}
          isExternal
        />
      </div>
    </div>
  )
}

const MoreMenuItem = ({
  title,
  path,
  icon,
  isExternal,
}: {
  title: string
  path: string
  icon: ReactNode
  isExternal?: boolean
}) =>
  isExternal ? (
    <a
      className="default-transition flex w-full items-center justify-between border-t border-th-fgd-4 px-2 py-3 text-th-fgd-2 hover:text-th-fgd-1"
      href={path}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className="flex items-center">
        {icon}
        <span className="ml-1.5">{title}</span>
      </div>
      <ChevronRightIcon className="h-5 w-5" />
    </a>
  ) : (
    <Link href={path} shallow={true}>
      <a className="default-transition flex w-full items-center justify-between border-t border-th-fgd-4 px-2 py-3 text-th-fgd-2 hover:text-th-fgd-1">
        <div className="flex items-center">
          {icon}
          <span className="ml-1.5">{title}</span>
        </div>
        <ChevronRightIcon className="h-5 w-5" />
      </a>
    </Link>
  )
