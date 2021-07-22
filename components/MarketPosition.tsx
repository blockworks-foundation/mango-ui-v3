import { useCallback, useState } from 'react'
import FloatingElement from './FloatingElement'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import { i80f48ToPercent, tokenPrecision } from '../utils/index'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
// import BorrowModal from './BorrowModal'
import Button, { LinkButton } from './Button'
import Tooltip from './Tooltip'
// import AccountsModal from './AccountsModal'
import SideBadge from './SideBadge'

export default function MarketPosition() {
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)
  const baseSymbol = marketConfig.baseSymbol
  const selectedMarketName = marketConfig.name
  const selectedMangoGroupConfig = useMangoStore(
    (s) => s.selectedMangoGroup.config
  )
  const selectedMangoGroupCache = useMangoStore(
    (s) => s.selectedMangoGroup.cache
  )
  const selectedMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.current
  )
  const loadingMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.initialLoad
  )
  const connected = useMangoStore((s) => s.wallet.connected)

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  // const [showAccountsModal, setShowAccountsModal] = useState(false)
  // const [showBorrowModal, setShowBorrowModal] = useState(false)

  const handleCloseDeposit = useCallback(() => {
    setShowDepositModal(false)
  }, [])

  const handleCloseWithdraw = useCallback(() => {
    setShowWithdrawModal(false)
  }, [])

  // const handleCloseBorrow = useCallback(() => {
  //   setShowBorrowModal(false)
  // }, [])

  // const handleCloseAccounts = useCallback(() => {
  //   setShowAccountsModal(false)
  // }, [])

  return selectedMarketName.includes('PERP') ? (
    <FloatingElement showConnect>
      <div className={!connected && 'filter blur-sm'}>
        <ElementTitle>Position</ElementTitle>
        <div className={`flex items-center justify-between pt-1 pb-2`}>
          <div className="font-normal text-th-fgd-3 leading-4">Side</div>
          <SideBadge side="long" />
        </div>
        <div className={`flex justify-between pt-2 pb-2`}>
          <div className="font-normal text-th-fgd-3 leading-4">Size</div>
          <div className={`text-th-fgd-1`}>X.XXX BTC</div>
        </div>
        <div className={`flex justify-between pt-2 pb-2`}>
          <div className="font-normal text-th-fgd-3 leading-4">
            Notional Size
          </div>
          <div className={`text-th-fgd-1`}>$XXX.XX</div>
        </div>
        <div className={`flex justify-between pt-2 pb-2`}>
          <div className="font-normal text-th-fgd-3 leading-4">PNL</div>
          <div className={`text-th-fgd-1`}>$XX.XX</div>
        </div>
        <div className={`flex justify-between pt-2 pb-2`}>
          <div className="font-normal text-th-fgd-3 leading-4">
            Break-even Price
          </div>
          <div className={`text-th-fgd-1`}>$XX,XXX.XX</div>
        </div>
        <div className={`flex justify-between pt-2 pb-2`}>
          <Tooltip content="Leverage">
            <div
              className={`cursor-help font-normal text-th-fgd-3 border-b border-th-fgd-3 border-dashed border-opacity-20 leading-4 default-transition hover:border-th-bkg-2 hover:text-th-fgd-3`}
            >
              Estimated Liquidation Price
            </div>
          </Tooltip>
          <div className={`text-th-fgd-1`}>$XX,XXX.XX</div>
        </div>
        <Button
          className="mt-4 w-full"
          disabled={!connected}
          onClick={() => console.log('close position')}
        >
          Market Close Position
        </Button>
      </div>
    </FloatingElement>
  ) : (
    <>
      <FloatingElement showConnect>
        <div className={!connected && 'filter blur'}>
          <ElementTitle>Balances</ElementTitle>
          {selectedMangoGroup ? (
            <div className="pt-2">
              {selectedMangoGroupConfig.tokens
                .filter((t) => t.symbol === baseSymbol || t.symbol === 'USDC')
                .reverse()
                .map(({ symbol, mintKey }) => {
                  const tokenIndex = selectedMangoGroup.getTokenIndex(mintKey)
                  return (
                    <div
                      className="border border-th-bkg-3 mb-4 p-3 rounded-md"
                      key={mintKey.toString()}
                    >
                      <div className="border-b border-th-bkg-3 flex items-center justify-between mb-3 pb-3">
                        <div className="flex items-center">
                          <img
                            alt=""
                            src={`/assets/icons/${symbol.toLowerCase()}.svg`}
                            className={`h-5 mr-2.5 w-auto`}
                          />
                          <span className="text-th-fgd-2">{symbol}</span>
                        </div>
                        <div className="flex">
                          <LinkButton
                            className="text-th-fgd-3 text-xs"
                            onClick={() => setShowDepositModal(true)}
                            disabled={!connected || loadingMangoAccount}
                          >
                            Deposit
                          </LinkButton>
                          <LinkButton
                            className="ml-4 text-th-fgd-3 text-xs"
                            onClick={() => setShowWithdrawModal(true)}
                            disabled={
                              !connected ||
                              !selectedMangoAccount ||
                              loadingMangoAccount
                            }
                          >
                            Withdraw
                          </LinkButton>
                        </div>
                      </div>
                      <div className="flex">
                        <div className="w-1/4">
                          <div className="text-th-fgd-3 tiny-text">
                            Deposits
                          </div>
                          <div className={`text-th-fgd-1`}>
                            {selectedMangoAccount
                              ? selectedMangoAccount
                                  .getUiDeposit(
                                    selectedMangoGroupCache.rootBankCache[
                                      tokenIndex
                                    ],
                                    selectedMangoGroup,
                                    tokenIndex
                                  )
                                  .toFixed(tokenPrecision[symbol])
                              : (0).toFixed(tokenPrecision[symbol])}
                          </div>
                        </div>
                        <div className="w-1/4">
                          <div className="text-th-fgd-3 tiny-text">Borrows</div>
                          <div className={`text-th-fgd-1`}>
                            {selectedMangoAccount
                              ? selectedMangoAccount
                                  .getUiBorrow(
                                    selectedMangoGroupCache.rootBankCache[
                                      tokenIndex
                                    ],
                                    selectedMangoGroup,
                                    tokenIndex
                                  )
                                  .toFixed(tokenPrecision[symbol])
                              : (0).toFixed(tokenPrecision[symbol])}
                          </div>
                        </div>
                        <div className="w-1/4">
                          <Tooltip content="Maximum available with leverage">
                            <div
                              className={`cursor-help font-normal pb-0.5 text-th-fgd-3 tiny-text default-transition hover:border-th-bkg-2 hover:text-th-fgd-3`}
                            >
                              Available
                            </div>
                          </Tooltip>
                          <div className={`text-th-fgd-1`}>0.00</div>
                        </div>
                        <div className="w-1/4">
                          <Tooltip content="Deposit APY and Borrow APR">
                            <div
                              className={`cursor-help font-normal pb-0.5 text-th-fgd-3 tiny-text default-transition hover:border-th-bkg-2 hover:text-th-fgd-3`}
                            >
                              Interest Rates
                            </div>
                          </Tooltip>
                          <div className={`text-th-fgd-1`}>
                            <span className={`text-th-green`}>
                              {i80f48ToPercent(
                                selectedMangoGroup.getDepositRate(tokenIndex)
                              ).toFixed(2)}
                              %
                            </span>
                            <span className={`text-th-fgd-4`}>{'  /  '}</span>
                            <span className={`text-th-red`}>
                              {i80f48ToPercent(
                                selectedMangoGroup.getBorrowRate(tokenIndex)
                              ).toFixed(2)}
                              %
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          ) : null}
        </div>
      </FloatingElement>
      {showDepositModal && (
        <DepositModal isOpen={showDepositModal} onClose={handleCloseDeposit} />
      )}
      {showWithdrawModal && (
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={handleCloseWithdraw}
        />
      )}

      {/* {showBorrowModal && (
        <BorrowModal isOpen={showBorrowModal} onClose={handleCloseBorrow} />
      )} */}
      {/* {showAccountsModal ? (
        <AccountsModal
          onClose={handleCloseAccounts}
          isOpen={showAccountsModal}
        />
      ) : null} */}
    </>
  )
}
