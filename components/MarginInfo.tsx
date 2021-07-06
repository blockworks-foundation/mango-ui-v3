import { HeartIcon } from '@heroicons/react/outline'
import useMangoStore from '../stores/useMangoStore'
import FloatingElement from './FloatingElement'
import Tooltip from './Tooltip'

export default function MarginInfo() {
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const selectedMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.current
  )

  const maintHealth = selectedMangoAccount
    ? selectedMangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Maint')
    : 0

  return (
    <FloatingElement>
      <div className="flex flex-col h-full justify-between">
        {selectedMangoAccount ? (
          <div>
            <div className={`flex justify-between pt-2 pb-2`}>
              <Tooltip content="Must be above 0% to borrow funds">
                <div
                  className={`cursor-help font-normal text-th-fgd-4 border-b border-th-fgd-4 border-dashed border-opacity-20 leading-4 default-transition hover:border-th-bkg-2 hover:text-th-fgd-3`}
                >
                  Init Ratio
                </div>
              </Tooltip>
              <div className={`text-th-fgd-1`}>
                {selectedMangoAccount
                  .getHealthRatio(mangoGroup, mangoCache, 'Init')
                  .toFixed(2)}
                %
              </div>
            </div>
          </div>
        ) : null}
        <div className="bg-th-bkg-1 p-4 rounded">
          <div className="flex flex-col">
            <div className="flex justify-between">
              <div className="flex items-center">
                <HeartIcon className="h-5 w-5" aria-hidden="true" />
                <span className="ml-2">Health Ratio</span>
              </div>
              <div className="text-right">{maintHealth.toFixed(2)}%</div>
            </div>
            <div className="mt-4">
              <div className="h-2 flex rounded bg-th-bkg-3">
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
