import { ZERO_I80F48 } from '@blockworks-foundation/mango-client'
import { HeartIcon } from '@heroicons/react/outline'
import useMangoStore from '../stores/useMangoStore'
import FloatingElement from './FloatingElement'
import { ElementTitle } from './styles'
import Tooltip from './Tooltip'

export default function MarginInfo() {
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)

  const maintHealth = mangoAccount
    ? mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Maint')
    : 0

  const equity = mangoAccount
    ? mangoAccount.computeValue(mangoGroup, mangoCache)
    : ZERO_I80F48

  const leverage =
    mangoAccount && equity.gt(ZERO_I80F48)
      ? mangoAccount.getLiabsVal(mangoGroup, mangoCache).div(equity)
      : 0.0

  return (
    <FloatingElement>
      <ElementTitle>Account</ElementTitle>
      <div>
        {mangoAccount ? (
          <div>
            <div className={`flex justify-between pt-2 pb-2`}>
              <Tooltip content="Account value">
                <div
                  className={`cursor-help font-normal text-th-fgd-3 border-b border-th-fgd-3 border-dashed border-opacity-20 leading-4 default-transition hover:border-th-bkg-2 hover:text-th-fgd-3`}
                >
                  Equity
                </div>
              </Tooltip>
              <div className={`text-th-fgd-1`}>${equity.toFixed(2)}</div>
            </div>
            <div className={`flex justify-between pt-2 pb-2`}>
              <div className="font-normal text-th-fgd-3 leading-4">
                Leverage
              </div>
              <div className={`text-th-fgd-1`}>{leverage.toFixed(2)}x</div>
            </div>
            <div className={`flex justify-between pt-2 pb-2`}>
              <Tooltip content="Leverage">
                <div className="font-normal text-th-fgd-3 leading-4">
                  Total Assets Value
                </div>
              </Tooltip>
              <div className={`text-th-fgd-1`}>
                ${mangoAccount.getAssetsVal(mangoGroup, mangoCache).toFixed(2)}
              </div>
            </div>
            <div className={`flex justify-between pt-2 pb-2`}>
              <Tooltip content="Leverage">
                <div className="font-normal text-th-fgd-3 leading-4">
                  Total Liabilities Value
                </div>
              </Tooltip>
              <div className={`text-th-fgd-1`}>
                ${mangoAccount.getLiabsVal(mangoGroup, mangoCache).toFixed(2)}
              </div>
            </div>
            <div className={`flex justify-between pt-2 pb-2`}>
              <Tooltip content="Must be above 0% to borrow funds">
                <div
                  className={`cursor-help font-normal text-th-fgd-3 border-b border-th-fgd-3 border-dashed border-opacity-20 leading-4 default-transition hover:border-th-bkg-2 hover:text-th-fgd-3`}
                >
                  Init Ratio
                </div>
              </Tooltip>
              <div className={`text-th-fgd-1`}>
                {mangoAccount
                  .getHealthRatio(mangoGroup, mangoCache, 'Init')
                  .toFixed(2)}
                %
              </div>
            </div>
          </div>
        ) : null}
        <div className="bg-th-bkg-3 mt-4 p-4 rounded">
          <div className="flex flex-col">
            <div className="flex justify-between">
              <div className="flex items-center">
                <HeartIcon className="h-5 w-5" aria-hidden="true" />
                <span className="ml-2">Health Ratio</span>
              </div>
              <div className="text-right">{maintHealth.toFixed(2)}%</div>
            </div>
            <div className="mt-4">
              <div className="h-1.5 flex rounded bg-th-fgd-4">
                <div
                  style={{
                    width: `${maintHealth}%`,
                  }}
                  className="flex rounded bg-th-primary"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FloatingElement>
  )
}
