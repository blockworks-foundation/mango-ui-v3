import { FunctionComponent } from 'react'
import { PerpMarket } from '@blockworks-foundation/mango-client'
import useMangoStore from '../../stores/useMangoStore'
import { useTranslation } from 'next-i18next'
import { capitalize } from '../../utils'

interface OrderSideTabsProps {
  isSimpleForm?: boolean
  onChange: (x) => void
  side: string
}

const OrderSideTabs: FunctionComponent<OrderSideTabsProps> = ({
  isSimpleForm,
  onChange,
  side,
}) => {
  const { t } = useTranslation('common')
  const market = useMangoStore((s) => s.selectedMarket.current)
  return (
    <div className={`relative mb-3 md:-mt-2.5 md:border-b md:border-th-fgd-4`}>
      <div
        className={`absolute hidden md:block ${
          side === 'buy'
            ? 'translate-x-0 bg-th-green'
            : 'translate-x-full bg-th-red'
        } default-transition bottom-[-1px] left-0 h-0.5 w-1/2 transform`}
      />
      <nav className="-mb-px flex space-x-2" aria-label="Tabs">
        <button
          onClick={() => onChange('buy')}
          className={`default-transition relative flex w-1/2 cursor-pointer 
            items-center justify-center whitespace-nowrap py-1 text-sm font-semibold md:text-base md:hover:opacity-100
            ${
              side === 'buy'
                ? `border border-th-green text-th-green md:border-0`
                : `border border-th-fgd-4 text-th-fgd-4 md:border-0 md:hover:border-th-green md:hover:text-th-green`
            }
          `}
        >
          {market instanceof PerpMarket && isSimpleForm ? 'Long' : t('buy')}
        </button>
        <button
          onClick={() => onChange('sell')}
          className={`default-transition relative flex w-1/2 cursor-pointer 
            items-center justify-center whitespace-nowrap py-1 text-sm font-semibold md:text-base md:hover:opacity-100
            ${
              side === 'sell'
                ? `border border-th-red text-th-red md:border-0`
                : `border border-th-fgd-4 text-th-fgd-4 md:border-0 md:hover:border-th-red md:hover:text-th-red`
            }
          `}
        >
          {market instanceof PerpMarket && isSimpleForm
            ? capitalize(t('short'))
            : t('sell')}
        </button>
      </nav>
    </div>
  )
}

export default OrderSideTabs
