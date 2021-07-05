import { HeartIcon } from '@heroicons/react/outline'
import { ZERO_I80F48 } from '@blockworks-foundation/mango-client/lib/src/fixednum'
import useMangoStore from '../stores/useMangoStore'
import FloatingElement from './FloatingElement'
import Tooltip from './Tooltip'

let initHealth = ZERO_I80F48
let maintHealth = ZERO_I80F48
let maintHealthRatio = 0
let initHealthRatio = 0

export default function MarginInfo() {
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const selectedMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.current
  )

  // TODO move out of component
  if (selectedMangoAccount) {
    initHealth = selectedMangoAccount.getHealth(mangoGroup, mangoCache, 'Init')
    maintHealth = selectedMangoAccount.getHealth(
      mangoGroup,
      mangoCache,
      'Maint'
    )
    console.log('init health: ', initHealth.toString())
    console.log('maint health: ', maintHealth.toString())

    const initliabsVal = selectedMangoAccount.getNativeLiabsVal(
      mangoGroup,
      mangoCache,
      'Init'
    )

    const maintliabsVal = selectedMangoAccount.getNativeLiabsVal(
      mangoGroup,
      mangoCache,
      'Init'
    )

    maintHealthRatio = maintliabsVal.gt(ZERO_I80F48)
      ? maintHealth.div(maintliabsVal).toNumber() * 100
      : 100

    initHealthRatio = initliabsVal.gt(ZERO_I80F48)
      ? initHealth.div(initliabsVal).toNumber() * 100
      : 100

    console.log('init health ratio: ', `${initHealthRatio.toFixed(1)}%`)
  }

  return (
    <FloatingElement>
      <div className="flex flex-col h-full justify-between">
        {selectedMangoAccount ? (
          <div>
            <div className={`flex justify-between pt-2 pb-2`}>
              <Tooltip content="Account health">
                <div
                  className={`cursor-help font-normal text-th-fgd-4 border-b border-th-fgd-4 border-dashed border-opacity-20 leading-4 default-transition hover:border-th-bkg-2 hover:text-th-fgd-3`}
                >
                  Init Ratio
                </div>
              </Tooltip>
              <div className={`text-th-fgd-1`}>
                {initHealthRatio.toFixed(2)}%
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
              <div className="text-right">{maintHealthRatio.toFixed(1)}%</div>
            </div>
            <div className="mt-4">
              <div className="h-2 flex rounded bg-th-bkg-3">
                <div
                  style={{ width: `${maintHealthRatio.toFixed(1)}%` }}
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
