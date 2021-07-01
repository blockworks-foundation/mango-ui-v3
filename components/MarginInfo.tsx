// import { useEffect, useState, useMemo } from 'react'
// import { groupBy } from '../utils'
// import useTradeHistory from '../hooks/useTradeHistory'
import { I80F48 } from '@blockworks-foundation/mango-client/lib/src/fixednum'
import useMangoStore, { mangoClient } from '../stores/useMangoStore'
import FloatingElement from './FloatingElement'
import Tooltip from './Tooltip'
// import Button from './Button'
// import AlertsModal from './AlertsModal'

export default function MarginInfo() {
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const selectedMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.current
  )

  // TODO move out of component
  let initHealth = I80F48.fromString('0')
  let maintHealth = I80F48.fromString('0')
  if (selectedMangoAccount) {
    initHealth = selectedMangoAccount.getHealth(mangoGroup, mangoCache, 'Init')
    maintHealth = selectedMangoAccount.getHealth(
      mangoGroup,
      mangoCache,
      'Maint'
    )
  }

  // const tradeHistory = useTradeHistory()
  // const tradeHistoryLength = useMemo(() => tradeHistory.length, [tradeHistory])

  return (
    <FloatingElement>
      <>
        <div className={`flex justify-between pt-2 pb-2`}>
          <Tooltip content="Account health">
            <div
              className={`cursor-help font-normal text-th-fgd-4 border-b border-th-fgd-4 border-dashed border-opacity-20 leading-4 default-transition hover:border-th-bkg-2 hover:text-th-fgd-3`}
            >
              Init Health
            </div>
          </Tooltip>
          <div className={`text-th-fgd-1`}>{initHealth.toFixed(3)}</div>
        </div>

        <div className={`flex justify-between pt-2 pb-2`}>
          <Tooltip content="Account health">
            <div
              className={`cursor-help font-normal text-th-fgd-4 border-b border-th-fgd-4 border-dashed border-opacity-20 leading-4 default-transition hover:border-th-bkg-2 hover:text-th-fgd-3`}
            >
              Maint Health
            </div>
          </Tooltip>
          <div className={`text-th-fgd-1`}>{maintHealth.toFixed(3)}</div>
        </div>

        {selectedMangoAccount ? (
          <>
            <div className={`flex justify-between pt-2 pb-2`}>
              <Tooltip content="Account health">
                <div
                  className={`cursor-help font-normal text-th-fgd-4 border-b border-th-fgd-4 border-dashed border-opacity-20 leading-4 default-transition hover:border-th-bkg-2 hover:text-th-fgd-3`}
                >
                  Assets Val
                </div>
              </Tooltip>
              <div className={`text-th-fgd-1`}>
                {selectedMangoAccount
                  .getAssetsVal(mangoGroup, mangoCache)
                  .toString()}
              </div>
            </div>
            <div className={`flex justify-between pt-2 pb-2`}>
              <Tooltip content="Account health">
                <div
                  className={`cursor-help font-normal text-th-fgd-4 border-b border-th-fgd-4 border-dashed border-opacity-20 leading-4 default-transition hover:border-th-bkg-2 hover:text-th-fgd-3`}
                >
                  Liabs Val
                </div>
              </Tooltip>
              <div className={`text-th-fgd-1`}>
                {selectedMangoAccount
                  .getLiabsVal(mangoGroup, mangoCache)
                  .toString()}
              </div>
            </div>
            <div className={`flex justify-between pt-2 pb-2`}>
              <Tooltip content="Account health">
                <div
                  className={`cursor-help font-normal text-th-fgd-4 border-b border-th-fgd-4 border-dashed border-opacity-20 leading-4 default-transition hover:border-th-bkg-2 hover:text-th-fgd-3`}
                >
                  Equity
                </div>
              </Tooltip>
              <div className={`text-th-fgd-1`}>
                {selectedMangoAccount
                  .computeValue(mangoGroup, mangoCache)
                  .toString()}
              </div>
            </div>
            <div className={`flex justify-between pt-2 pb-2`}>
              <Tooltip content="Account health">
                <div
                  className={`cursor-help font-normal text-th-fgd-4 border-b border-th-fgd-4 border-dashed border-opacity-20 leading-4 default-transition hover:border-th-bkg-2 hover:text-th-fgd-3`}
                >
                  BTC Price
                </div>
              </Tooltip>
              <div className={`text-th-fgd-1`}>
                {mangoGroup.getPrice(0, mangoCache).toString()}
              </div>
            </div>
          </>
        ) : null}

        {/* <Button
          className="mt-4 w-full"
          disabled={!connected}
          onClick={() => setOpenAlertModal(true)}
        >
          Create Liquidation Alert
        </Button>
        {openAlertModal ? (
          <AlertsModal
            isOpen={openAlertModal}
            onClose={() => setOpenAlertModal(false)}
            mangoAccount={selectedMangoAccount}
          />
        ) : null} */}
      </>
    </FloatingElement>
  )
}
