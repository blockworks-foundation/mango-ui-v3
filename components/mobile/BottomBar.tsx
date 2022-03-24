import Link from 'next/link'
import { useRouter } from 'next/router'
import { ChartBarIcon, CurrencyDollarIcon } from '@heroicons/react/solid'
import { BtcMonoIcon, TradeIcon } from '../icons'
import { useTranslation } from 'next-i18next'

const StyledBarItemLabel = ({ children, ...props }) => (
  <div style={{ fontSize: '0.6rem', lineHeight: 1 }} {...props}>
    {children}
  </div>
)

const BottomBar = () => {
  const { t } = useTranslation('common')
  const { asPath } = useRouter()

  return (
    <>
      <div className="default-transition grid grid-cols-4 grid-rows-1 bg-th-bkg-3 py-2.5">
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
      </div>
    </>
  )
}

export default BottomBar
