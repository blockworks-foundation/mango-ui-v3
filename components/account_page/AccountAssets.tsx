import { useCallback, useState } from 'react'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import { InformationCircleIcon } from '@heroicons/react/outline'
import useMangoStore from '../../stores/useMangoStore'
import { useBalances } from '../../hooks/useBalances'
import { tokenPrecision } from '../../utils/index'
import DepositModal from '../DepositModal'
import WithdrawModal from '../WithdrawModal'
import Button from '../Button'
import Tooltip from '../Tooltip'
import { Market } from '@project-serum/serum'
import {
  getTokenBySymbol,
  I80F48,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import { notify } from '../../utils/notifications'
import { useTranslation } from 'next-i18next'

export default function AccountAssets() {
  const { t } = useTranslation('common')
  const balances = useBalances()
  const actions = useMangoStore((s) => s.actions)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoClient = useMangoStore((s) => s.connection.client)
  const loadingMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.initialLoad
  )
  const connected = useMangoStore((s) => s.wallet.connected)

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [withdrawSymbol, setWithdrawSymbol] = useState('')
  const [depositSymbol, setDepositSymbol] = useState('')

  const handleCloseDeposit = useCallback(() => {
    setShowDepositModal(false)
  }, [])

  const handleCloseWithdraw = useCallback(() => {
    setShowWithdrawModal(false)
  }, [])

  const handleShowWithdraw = (symbol) => {
    setWithdrawSymbol(symbol)
    setShowWithdrawModal(true)
  }

  const handleShowDeposit = (symbol) => {
    setDepositSymbol(symbol)
    setShowDepositModal(true)
  }

  async function handleSettleAllTrades() {
    const markets: Array<Market | PerpMarket> = Object.values(
      useMangoStore.getState().selectedMangoGroup.markets
    )
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const wallet = useMangoStore.getState().wallet.current
    const spotMarkets = markets.filter(
      (mkt) => mkt instanceof Market
    ) as Market[]

    try {
      await mangoClient.settleAll(mangoGroup, mangoAccount, spotMarkets, wallet)
      actions.reloadMangoAccount()
    } catch (e) {
      if (e.message === 'No unsettled funds') {
        notify({
          title: t('no-unsettled'),
          type: 'error',
        })
      } else {
        notify({
          title: t('settle-error'),
          description: e.message,
          txid: e.txid,
          type: 'error',
        })
      }
    }
  }

  return mangoAccount ? (
    <>
      <div className="sm:flex sm:items-center sm:justify-between pb-2">
        <div className="pb-2 sm:pb-0 text-th-fgd-1 text-lg">
          {t('your-assets')}
        </div>
        {balances.length > 0 ? (
          <div className="border border-th-green flex items-center justify-between p-2 rounded">
            <div className="pr-4 text-xs text-th-fgd-3">
              {t('total-assets')}:
            </div>
            <span>
              $ {mangoAccount.getAssetsVal(mangoGroup, mangoCache).toFixed(2)}
            </span>
          </div>
        ) : null}
      </div>
      {balances.length > 0 &&
      balances.find(({ unsettled }) => unsettled > 0) ? (
        <div
          className={`flex items-center justify-between px-6 py-4 my-2 rounded-md bg-th-bkg-1`}
        >
          <div className="flex items-center text-fgd-1 font-semibold pr-4">
            You have unsettled funds
            <Tooltip content="Use the Settle All button to move unsettled funds to your deposits.">
              <div>
                <InformationCircleIcon
                  className={`h-5 w-5 ml-2 text-th-primary cursor-help`}
                />
              </div>
            </Tooltip>
          </div>
          <Button onClick={handleSettleAllTrades}>{t('settle-all')}</Button>
        </div>
      ) : null}
      {mangoGroup && balances.length > 0 ? (
        <div className={`flex flex-col py-4`}>
          <div className={`-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8`}>
            <div
              className={`align-middle inline-block min-w-full sm:px-6 lg:px-8`}
            >
              <Table className="min-w-full divide-y divide-th-bkg-2">
                <Thead>
                  <Tr className="text-th-fgd-3 text-xs">
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      {t('asset')}
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      Available
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      {t('in-orders')}
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      {t('unsettled')}
                    </Th>
                    <Th
                      scope="col"
                      className={`px-6 py-3 text-left font-normal`}
                    >
                      {t('value')}
                    </Th>
                    <Th scope="col" className="px-6 py-3 text-left font-normal">
                      {t('interest')} APY
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {balances.map((bal, i) => {
                    const token = getTokenBySymbol(groupConfig, bal.symbol)
                    const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)

                    return (
                      <Tr
                        key={tokenIndex}
                        className={`border-b border-th-bkg-3
                  ${i % 2 === 0 ? `bg-th-bkg-3` : `bg-th-bkg-2`}
                `}
                      >
                        <Td
                          className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          <div className="flex items-center">
                            <img
                              alt=""
                              width="20"
                              height="20"
                              src={`/assets/icons/${bal.symbol.toLowerCase()}.svg`}
                              className={`mr-2.5`}
                            />
                            <div>{bal.symbol}</div>
                          </div>
                        </Td>
                        <Td
                          className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          {bal.deposits.toFixed(tokenPrecision[bal.symbol])}
                        </Td>
                        <Td
                          className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          {bal.orders.toFixed(tokenPrecision[bal.symbol])}
                        </Td>
                        <Td
                          className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          {bal.unsettled.toFixed(tokenPrecision[bal.symbol])}
                        </Td>
                        <Td
                          className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          $
                          {(
                            (bal.deposits.toNumber() +
                              bal.orders +
                              bal.unsettled) *
                            mangoGroup
                              .getPrice(tokenIndex, mangoCache)
                              .toNumber()
                          ).toFixed(2)}
                        </Td>
                        <Td
                          className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          <span className={`text-th-green`}>
                            {mangoGroup
                              .getDepositRate(tokenIndex)
                              .mul(I80F48.fromNumber(100))
                              .toFixed(2)}
                            %
                          </span>
                        </Td>
                        <Td
                          className={`px-6 py-3 whitespace-nowrap text-sm text-th-fgd-1`}
                        >
                          <div className={`flex justify-end`}>
                            <Button
                              onClick={() => handleShowDeposit(bal.symbol)}
                              className="text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                              disabled={!connected || loadingMangoAccount}
                            >
                              <span>{t('deposit')}</span>
                            </Button>
                            <Button
                              onClick={() => handleShowWithdraw(bal.symbol)}
                              className="ml-3 text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                              disabled={!connected || loadingMangoAccount}
                            >
                              <span>{t('withdraw')}</span>
                            </Button>
                          </div>
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md`}
        >
          No assets found.
        </div>
      )}
      {showDepositModal && (
        <DepositModal
          isOpen={showDepositModal}
          onClose={handleCloseDeposit}
          tokenSymbol={depositSymbol}
        />
      )}
      {showWithdrawModal && (
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={handleCloseWithdraw}
          tokenSymbol={withdrawSymbol}
        />
      )}
    </>
  ) : null
}
