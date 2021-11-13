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
    <div className={`md:border-b md:border-th-fgd-4 mb-3 relative -mt-2.5`}>
      <div
        className={`absolute hidden md:block ${
          side === 'buy'
            ? 'bg-th-green translate-x-0'
            : 'bg-th-red translate-x-full'
        } bottom-[-1px] default-transition left-0 h-0.5 transform w-1/2`}
      />
      <nav className="-mb-px flex space-x-2" aria-label="Tabs">
        <button
          onClick={() => onChange('buy')}
          className={`cursor-pointer default-transition flex font-semibold items-center justify-center py-1.5 md:py-2 relative text-sm md:text-base w-1/2 whitespace-nowrap hover:opacity-100
                    ${
                      side === 'buy'
                        ? `border border-th-green md:border-0 text-th-green`
                        : `border border-th-fgd-4 md:border-0 text-th-fgd-4 hover:border-th-green hover:text-th-green`
                    }
                  `}
        >
          {market instanceof PerpMarket && isSimpleForm ? 'Long' : t('buy')}
        </button>
        <button
          onClick={() => onChange('sell')}
          className={`cursor-pointer default-transition flex font-semibold items-center justify-center py-1.5 md:py-2 relative text-sm md:text-base w-1/2 whitespace-nowrap hover:opacity-100
                    ${
                      side === 'sell'
                        ? `border border-th-red md:border-0 text-th-red`
                        : `border border-th-fgd-4 md:border-0 text-th-fgd-4 hover:border-th-red hover:text-th-red`
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
