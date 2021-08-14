import useMangoStore, { mangoClient } from '../stores/useMangoStore'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import {
  getMarketByPublicKey,
  nativeI80F48ToUi,
  PerpAccount,
  PerpMarket,
  QUOTE_INDEX,
  ZERO_I80F48,
} from '@blockworks-foundation/mango-client'
import { useMemo } from 'react'
import Button from './Button'
import { notify } from '../utils/notifications'

import BN from 'bn.js'
import SideBadge from './SideBadge'
import { useState } from 'react'
import Loading from './Loading'
import { usdFormatter } from '../utils'
import useTradeHistory from '../hooks/useTradeHistory'

function getAvgEntryPrice(
  mangoAccount,
  perpAccount,
  perpMarket,
  perpTradeHistory
) {
  let avgEntryPrice = '--'
  if (perpTradeHistory.length) {
    try {
      avgEntryPrice = perpAccount
        .getAverageOpenPrice(mangoAccount, perpMarket, perpTradeHistory)
        .toFixed(2)
    } catch {
      avgEntryPrice = '--'
    }
  }
  return avgEntryPrice
}

function getBreakEvenPrice(
  mangoAccount,
  perpAccount,
  perpMarket,
  perpTradeHistory
) {
  let breakEvenPrice = '--'
  if (perpTradeHistory.length) {
    try {
      breakEvenPrice = perpAccount
        .getBreakEvenPrice(mangoAccount, perpMarket, perpTradeHistory)
        .toFixed(2)
    } catch {
      breakEvenPrice = '--'
    }
  }
  return breakEvenPrice
}

const PositionsTable = () => {
  const actions = useMangoStore((s) => s.actions)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const allMarkets = useMangoStore((s) => s.selectedMangoGroup.markets)
  const [settlingPerpAcc, setSettlingPerpAcc] = useState(null)
  const tradeHistory = useTradeHistory()

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
    ? groupConfig.perpMarkets.map((m) => {
        return {
          perpAccount: mangoAccount.perpAccounts[m.marketIndex],
          marketIndex: m.marketIndex,
        }
      })
    : []
  const filteredPerpAccounts = perpAccounts.filter(
    ({ perpAccount }) =>
      !(
        perpAccount.quotePosition.eq(ZERO_I80F48) &&
        perpAccount.basePosition.eq(new BN(0)) &&
        perpAccount.mngoAccrued.eq(new BN(0))
      )
  )

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
          {filteredPerpAccounts.length ? (
            <div className="overflow-hidden border-b border-th-bkg-2 sm:rounded-m">
              <Table className="min-w-full divide-y divide-th-bkg-2">
                <Thead>
                  <Tr className="text-th-fgd-3 text-xs">
                    <Th scope="col" className="px-6 py-2 text-left font-normal">
                      Market
                    </Th>
                    <Th scope="col" className="px-2 py-2 text-left font-normal">
                      Side
                    </Th>
                    <Th scope="col" className="px-2 py-2 text-left font-normal">
                      Position Size
                    </Th>
                    <Th scope="col" className="px-2 py-2 text-left font-normal">
                      Notional Size
                    </Th>
                    <Th scope="col" className="px-2 py-2 text-left font-normal">
                      Avg entry price
                    </Th>
                    <Th scope="col" className="px-2 py-2 text-left font-normal">
                      Break-even price
                    </Th>
                    <Th scope="col" className="px-2 py-2 text-left font-normal">
                      Unsettled PnL
                    </Th>
                    <Th scope="col" className={`relative px-6 py-2.5`}>
                      <span className={`sr-only`}>Edit</span>
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredPerpAccounts.map(
                    ({ perpAccount, marketIndex }, index) => {
                      const perpMarketInfo = perpMarkets[marketIndex]
                      const marketConfig = getMarketByPublicKey(
                        groupConfig,
                        perpMarketInfo.perpMarket
                      )
                      const price = mangoCache.priceCache[marketIndex].price
                      const perpMarket = allMarkets[
                        marketConfig.publicKey.toString()
                      ] as PerpMarket
                      const perpTradeHistory = tradeHistory.filter(
                        (t) => t.marketName === marketConfig.name
                      )

                      return (
                        <Tr
                          key={`${marketIndex}`}
                          className={`border-b border-th-bkg-3
                        ${index % 2 === 0 ? `bg-th-bkg-3` : `bg-th-bkg-2`}
                      `}
                        >
                          <Td className="px-6 py-2 whitespace-nowrap text-sm text-th-fgd-1">
                            <div className="flex items-center">
                              <img
                                alt=""
                                width="20"
                                height="20"
                                src={`/assets/icons/${marketConfig.baseSymbol.toLowerCase()}.svg`}
                                className={`mr-2.5`}
                              />
                              <div>{marketConfig.name}</div>
                            </div>
                          </Td>
                          <Td className="px-2 py-2 whitespace-nowrap text-sm text-th-fgd-1">
                            <SideBadge
                              side={
                                perpAccount.basePosition.gt(new BN(0))
                                  ? 'long'
                                  : 'short'
                              }
                            />
                          </Td>
                          <Td className="px-2 py-2 whitespace-nowrap text-sm text-th-fgd-1">
                            {perpMarket.baseLotsToNumber(
                              perpAccount.basePosition
                            )}
                          </Td>
                          <Th
                            scope="col"
                            className="px-2 py-2 text-left font-normal"
                          >
                            {usdFormatter.format(
                              perpMarket.baseLotsToNumber(
                                perpAccount.basePosition
                              ) *
                                mangoGroup
                                  .getPrice(marketIndex, mangoCache)
                                  .toNumber()
                            )}
                          </Th>
                          <Td className="px-2 py-2 whitespace-nowrap text-sm text-th-fgd-1">
                            $
                            {getAvgEntryPrice(
                              mangoAccount,
                              perpAccount,
                              perpMarket,
                              perpTradeHistory
                            )}
                          </Td>
                          <Td className="px-2 py-2 whitespace-nowrap text-sm text-th-fgd-1">
                            $
                            {getBreakEvenPrice(
                              mangoAccount,
                              perpAccount,
                              perpMarket,
                              perpTradeHistory
                            )}
                          </Td>
                          <Td className="px-2 py-2 whitespace-nowrap text-sm text-th-fgd-1">
                            {usdFormatter.format(
                              +nativeI80F48ToUi(
                                perpAccount.getPnl(perpMarketInfo, price),
                                marketConfig.quoteDecimals
                              )
                            )}
                          </Td>
                          <Td className="px-2 py-2 whitespace-nowrap text-sm text-th-fgd-1">
                            <div className="flex justify-end">
                              <Button
                                onClick={() =>
                                  handleSettlePnl(perpMarket, perpAccount)
                                }
                                className="ml-3 text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                              >
                                {settlingPerpAcc == perpAccount ? (
                                  <Loading />
                                ) : (
                                  <span>Settle PNL</span>
                                )}
                              </Button>
                            </div>
                          </Td>
                        </Tr>
                      )
                    }
                  )}
                </Tbody>
              </Table>
            </div>
          ) : (
            <div
              className={`w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md`}
            >
              No perp positions
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PositionsTable
