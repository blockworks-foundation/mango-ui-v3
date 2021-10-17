import { percentFormat } from '../utils/index'
import useSrmAccount from '../hooks/useSrmAccount'
import { SRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'
import Tooltip from './Tooltip'
import { InformationCircleIcon } from '@heroicons/react/outline'
import { useTranslation } from 'next-i18next'

const FeeDiscountsTable = () => {
  const { t } = useTranslation('common')
  const { totalSrm, rates } = useSrmAccount()

  return (
    <div
      className={`flex flex-col items-center bg-th-bkg-1 py-6 mt-4 rounded-md`}
    >
      <div
        className={`flex flex-col sm:flex-row justify-between text-th-fgd-4 text-center`}
      >
        <div className="px-4">
          <div>{t('total-srm')}</div>
          <div className="text-th-fgd-1 text-lg font-semibold">
            {totalSrm.toLocaleString(undefined, {
              maximumFractionDigits: SRM_DECIMALS,
            })}
          </div>
        </div>
        <div className="px-4 mt-4 sm:mt-0">
          <div>{t('maker-fee')}</div>
          <div className="text-th-fgd-1 text-lg font-semibold">
            {rates ? percentFormat.format(rates.maker) : null}
          </div>
        </div>
        <div className="px-4 mt-4 sm:mt-0">
          <div className="flex items-center">
            <div>{t('taker-fee')}</div>
            <div className="flex items-center">
              <Tooltip
                content={t('tooltip-gui-rebate', {
                  taker_rate: percentFormat.format(rates.taker),
                })}
              >
                <div>
                  <InformationCircleIcon
                    className={`h-5 w-5 ml-2 text-th-fgd-4 cursor-help`}
                  />
                </div>
              </Tooltip>
            </div>
          </div>
          <div className="text-th-fgd-1 text-lg font-semibold">
            {rates ? percentFormat.format(rates.taker * 0.8) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeeDiscountsTable
