import useMangoStore, { mangoClient } from '../stores/useMangoStore'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import {
  getMarketByPublicKey,
  nativeI80F48ToUi,
  PerpAccount,
  PerpMarket,
  ZERO_I80F48,
} from '@blockworks-foundation/mango-client'
import { useMemo } from 'react'
import Button from './Button'
import { notify } from '../utils/notifications'
import { QUOTE_INDEX } from '@blockworks-foundation/mango-client/lib/src/MangoGroup'
import BN from 'bn.js'
import SideBadge from './SideBadge'
import { useState } from 'react'
import Loading from './Loading'

const PositionsTable = () => {
  const actions = useMangoStore((s) => s.actions)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const allMarkets = useMangoStore((s) => s.selectedMangoGroup.markets)
  const [settlingPerpAcc, setSettlingPerpAcc] = useState(null)

  const perpMarkets = useMemo(
    () =>
      mangoGroup
        ? groupConfig.perpMarkets.map(
            (m) => mangoGroup.perpMarkets[m.marketIndex]
          )
        : [],
    [mangoGroup]
  )
  const perpAccounts = mangoAccount
    ? groupConfig.perpMarkets.map(
        (m) => mangoAccount.perpAccounts[m.marketIndex]
      )
    : []

  const handleSettlePnl = async (
    perpMarket: PerpMarket,
    perpAccount: PerpAccount
  ) => {
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const wallet = useMangoStore.getState().wallet.current
    const marketIndex = mangoGroup.getPerpMarketIndex(perpMarket.publicKey)
    setSettlingPerpAcc(perpAccount)
    try {
      const txid = await mangoClient.settlePnl(
        mangoGroup,
        mangoAccount,
        perpMarket,
        mangoGroup.rootBankAccounts[QUOTE_INDEX],
        mangoCache.priceCache[marketIndex].price,
        wallet
      )
      actions.fetchMangoAccounts()
      notify({
        title: 'Successfully settled PNL',
        description: '',
        txid,
      })
    } catch (e) {
      console.log('Error settling PNL: ', `${e}`, `${perpAccount}`)
      notify({
        title: 'Error settling PNL',
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
    } finally {
      setSettlingPerpAcc(null)
    }
  }

  return (
    <div className="flex flex-col py-4">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="align-middle inline-block min-w-full sm:px-6 lg:px-8">
          {perpAccounts.length ? (
            <div className="overflow-hidden border-b border-th-bkg-2 sm:rounded-m">
              <Table className="min-w-full divide-y divide-th-bkg-2">
                <Thead>
                  <Tr className="text-th-fgd-3">
                    <Th scope="col" className="px-6 py-2 text-left font-normal">
                      Market
                    </Th>
                    <Th scope="col" className="px-2 py-2 text-left font-normal">
                      Side
                    </Th>
                    <Th scope="col" className="px-2 py-2 text-left font-normal">
                      Base Position
                    </Th>
                    <Th scope="col" className="px-2 py-2 text-left font-normal">
                      Quote Position
                    </Th>
                    <Th scope="col" className="px-2 py-2 text-left font-normal">
                      Unrealized PnL
                    </Th>
                    <Th scope="col" className="px-2 py-2 text-left font-normal">
                      Health
                    </Th>
                    <Th scope="col" className={`relative px-6 py-2.5`}>
                      <span className={`sr-only`}>Edit</span>
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {perpAccounts.map((perpAcc, index) => {
                    const perpMarketInfo = perpMarkets[index]
                    const marketConfig = getMarketByPublicKey(
                      groupConfig,
                      perpMarketInfo.perpMarket
                    )

                    const marketCache =
                      mangoCache.perpMarketCache[marketConfig.marketIndex]
                    const price =
                      mangoCache.priceCache[marketConfig.marketIndex].price
                    const perpMarket = allMarkets[
                      marketConfig.publicKey.toString()
                    ] as PerpMarket

                    if (
                      perpAcc.quotePosition.eq(ZERO_I80F48) &&
                      perpAcc.basePosition.eq(new BN(0))
                    ) {
                      return null
                    }

                    return (
                      <Tr
                        key={`${index}`}
                        className={`border-b border-th-bkg-3
                        ${index % 2 === 0 ? `bg-th-bkg-2` : `bg-th-bkg-3`}
                      `}
                      >
                        <Td className="px-6 py-2.5 whitespace-nowrap text-sm text-th-fgd-1">
                          {marketConfig.name}
                        </Td>
                        <Td className="px-2 py-2.5 whitespace-nowrap text-sm text-th-fgd-1">
                          <SideBadge
                            side={
                              perpAcc.basePosition.gt(new BN(0))
                                ? 'long'
                                : 'short'
                            }
                          />
                        </Td>
                        <Td className="px-2 py-2.5 whitespace-nowrap text-sm text-th-fgd-1">
                          {perpMarket.baseLotsToNumber(perpAcc.basePosition)}
                        </Td>
                        <Td className="px-2 py-2.5 whitespace-nowrap text-sm text-th-fgd-1">
                          {nativeI80F48ToUi(
                            perpAcc.quotePosition,
                            marketConfig.quoteDecimals
                          ).toFixed()}
                        </Td>
                        <Td className="px-2 py-2.5 whitespace-nowrap text-sm text-th-fgd-1">
                          $
                          {nativeI80F48ToUi(
                            perpAcc.getPnl(perpMarketInfo, price),
                            marketConfig.quoteDecimals
                          ).toFixed()}
                        </Td>
                        <Td className="px-2 py-2.5 whitespace-nowrap text-sm text-th-fgd-1">
                          {perpAcc
                            .getHealth(
                              perpMarketInfo,
                              price,
                              perpMarketInfo.maintAssetWeight,
                              perpMarketInfo.maintLiabWeight,
                              marketCache.longFunding,
                              marketCache.shortFunding
                            )
                            .toFixed(3)}
                        </Td>
                        <Td className="px-6 whitespace-nowrap text-sm text-th-fgd-1">
                          <div className="flex justify-end">
                            <Button
                              onClick={() =>
                                handleSettlePnl(perpMarket, perpAcc)
                              }
                              className="ml-3 text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                            >
                              {settlingPerpAcc == perpAcc ? (
                                <Loading />
                              ) : (
                                <span>Settle PNL</span>
                              )}
                            </Button>
                          </div>
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </div>
          ) : (
            <div
              className={`w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md`}
            >
              No open positions
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PositionsTable
