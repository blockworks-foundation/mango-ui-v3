import { useCallback, useState } from 'react'
import {
  getTokenBySymbol,
  ZERO_I80F48,
  I80F48,
} from '@blockworks-foundation/mango-client'
import useMangoStore from '../../stores/useMangoStore'
import { useBalances } from '../../hooks/useBalances'
import {
  formatUsdValue,
  i80f48ToPercent,
  tokenPrecision,
} from '../../utils/index'
import WithdrawModal from '../WithdrawModal'
import Button from '../Button'
import DepositModal from '../DepositModal'
import { useViewport } from '../../hooks/useViewport'
import { breakpoints } from '../TradePageGrid'
import { Table, Td, Th, TrBody, TrHead } from '../TableElements'
import { ExpandableRow } from '../TableElements'
import MobileTableHeader from '../mobile/MobileTableHeader'
import { useTranslation } from 'next-i18next'
import Tooltip from '../Tooltip'
import { useWallet } from '@solana/wallet-adapter-react'

export default function AccountBorrows() {
  const { t } = useTranslation('common')
  const balances = useBalances()
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const { publicKey, connected } = useWallet()
  const loadingMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.initialLoad
  )

  const [borrowSymbol, setBorrowSymbol] = useState('')
  const [depositToSettle, setDepositToSettle] = useState<any | null>(null)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false
  const canWithdraw = publicKey && mangoAccount?.owner.equals(publicKey)

  const handleCloseWithdraw = useCallback(() => {
    setShowBorrowModal(false)
  }, [])

  const handleCloseDeposit = useCallback(() => {
    setShowDepositModal(false)
    setDepositToSettle(null)
  }, [])

  const handleShowBorrow = (symbol) => {
    setBorrowSymbol(symbol)
    setShowBorrowModal(true)
  }

  const handleShowDeposit = (symbol, amount) => {
    setDepositToSettle({ symbol: symbol, amount: amount })
    setShowDepositModal(true)
  }

  return (
    <>
      {mangoGroup && mangoAccount ? (
        <>
          <h2 className="mb-0">{t('your-borrows')}</h2>
          {/* TODO: calculate LiabsVal without perp markets
        <div className="border border-th-red flex items-center justify-between p-2 rounded">
          <div className="pr-4 text-xs text-th-fgd-3">{t('total-borrow-value')}:</div>
          <span>
            {formatUsdValue(+mangoAccount.getLiabsVal(mangoGroup, mangoCache))}
          </span>
        </div> */}
          <div className="flex flex-col pb-8 pt-4">
            <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full align-middle sm:px-6 lg:px-8">
                {balances.find((b) => b?.borrows?.gt(ZERO_I80F48)) ? (
                  !isMobile ? (
                    <Table>
                      <thead>
                        <TrHead>
                          <Th>{t('asset')}</Th>
                          <Th>{t('balance')}</Th>
                          <Th>{t('value')}</Th>
                          <Th>{t('borrow-rate')} (APR)</Th>
                        </TrHead>
                      </thead>
                      <tbody>
                        {balances
                          .filter((assets) => assets?.borrows?.gt(ZERO_I80F48))
                          .map((asset) => {
                            const token = getTokenBySymbol(
                              mangoConfig,
                              asset.symbol
                            )
                            const tokenIndex = mangoGroup.getTokenIndex(
                              token.mintKey
                            )
                            return (
                              <TrBody key={tokenIndex}>
                                <Td>
                                  <div className="flex items-center">
                                    <img
                                      alt=""
                                      width="20"
                                      height="20"
                                      src={`/assets/icons/${asset.symbol.toLowerCase()}.svg`}
                                      className={`mr-2.5`}
                                    />
                                    <div>{asset.symbol}</div>
                                  </div>
                                </Td>
                                <Td>{asset?.borrows?.toFixed()}</Td>
                                <Td>
                                  {asset?.borrows && mangoCache && mangoGroup
                                    ? formatUsdValue(
                                        asset?.borrows
                                          ?.mul(
                                            mangoGroup.getPrice(
                                              tokenIndex,
                                              mangoCache
                                            )
                                          )
                                          ?.toNumber()
                                      )
                                    : null}
                                </Td>
                                <Td>
                                  <span className={`text-th-red`}>
                                    {(
                                      mangoGroup
                                        .getBorrowRate(tokenIndex)
                                        .toNumber() * 100
                                    ).toFixed(2)}
                                    %
                                  </span>
                                </Td>
                                <Td>
                                  <div className={`flex justify-end`}>
                                    <Button
                                      onClick={() =>
                                        handleShowDeposit(
                                          asset.symbol,
                                          asset?.borrows?.toFixed()
                                        )
                                      }
                                      className="ml-3 h-8 pt-0 pb-0 pl-3 pr-3 text-xs"
                                      disabled={
                                        !connected || loadingMangoAccount
                                      }
                                    >
                                      {t('repay')}
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handleShowBorrow(asset.symbol)
                                      }
                                      className="ml-3 h-8 pt-0 pb-0 pl-3 pr-3 text-xs"
                                      disabled={
                                        !connected ||
                                        loadingMangoAccount ||
                                        !canWithdraw
                                      }
                                    >
                                      {t('borrow')}
                                    </Button>
                                  </div>
                                </Td>
                              </TrBody>
                            )
                          })}
                      </tbody>
                    </Table>
                  ) : (
                    <div className="border-b border-th-bkg-4">
                      <MobileTableHeader
                        colOneHeader={t('asset')}
                        colTwoHeader={t('balance')}
                      />
                      {balances
                        .filter((assets) => assets?.borrows?.gt(ZERO_I80F48))
                        .map((asset, i) => {
                          const token = getTokenBySymbol(
                            mangoConfig,
                            asset.symbol
                          )
                          const tokenIndex = mangoGroup.getTokenIndex(
                            token.mintKey
                          )
                          return (
                            <ExpandableRow
                              buttonTemplate={
                                <div className="text-fgd-1 flex w-full items-center justify-between">
                                  <div className="text-fgd-1 flex items-center">
                                    <img
                                      alt=""
                                      width="20"
                                      height="20"
                                      src={`/assets/icons/${asset.symbol.toLowerCase()}.svg`}
                                      className={`mr-2.5`}
                                    />

                                    {asset.symbol}
                                  </div>
                                  <div className="text-fgd-1 text-right">
                                    {asset?.borrows?.toFixed(
                                      tokenPrecision[asset.symbol]
                                    )}
                                  </div>
                                </div>
                              }
                              key={`${asset.symbol}${i}`}
                              panelTemplate={
                                <>
                                  <div className="grid grid-flow-row grid-cols-2 gap-4 pb-4">
                                    {asset?.borrows && mangoCache ? (
                                      <div className="text-left">
                                        <div className="pb-0.5 text-xs text-th-fgd-3">
                                          {t('value')}
                                        </div>
                                        {formatUsdValue(
                                          asset.borrows
                                            .mul(
                                              mangoGroup.getPrice(
                                                tokenIndex,
                                                mangoCache
                                              )
                                            )
                                            .toNumber()
                                        )}
                                      </div>
                                    ) : null}
                                    <div className="text-left">
                                      <div className="pb-0.5 text-xs text-th-fgd-3">
                                        {t('borrow-rate')} (APR)
                                      </div>
                                      <span className={`text-th-red`}>
                                        {(
                                          mangoGroup
                                            .getBorrowRate(tokenIndex)
                                            .toNumber() * 100
                                        ).toFixed(2)}
                                        %
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex space-x-4">
                                    <Button
                                      onClick={() =>
                                        handleShowDeposit(
                                          asset.symbol,
                                          asset?.borrows?.toFixed()
                                        )
                                      }
                                      className="h-8 w-full pt-0 pb-0 text-xs"
                                      disabled={
                                        !connected || loadingMangoAccount
                                      }
                                    >
                                      {t('repay')}
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handleShowBorrow(asset.symbol)
                                      }
                                      className="h-8 w-full pt-0 pb-0 text-xs"
                                      disabled={
                                        !connected ||
                                        loadingMangoAccount ||
                                        !canWithdraw
                                      }
                                    >
                                      {t('borrow')}
                                    </Button>
                                  </div>
                                </>
                              }
                            />
                          )
                        })}
                    </div>
                  )
                ) : (
                  <div
                    className={`w-full rounded-md bg-th-bkg-1 py-6 text-center text-th-fgd-3`}
                  >
                    {t('no-borrows')}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
      <h2 className="mb-0">{t('all-assets')}</h2>
      <div className="flex flex-col pb-2 pt-4">
        <div className="overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full align-middle sm:px-6 lg:px-8">
            {!isMobile ? (
              <Table>
                <thead>
                  <TrHead>
                    <Th>{t('asset')}</Th>
                    <Th>{t('price')}</Th>
                    <Th>{t('deposit')} APR</Th>
                    <Th>{t('borrow')} APR</Th>
                    {mangoAccount ? <Th>{t('max-borrow')}</Th> : null}
                    <Th>{t('liquidity')}</Th>
                  </TrHead>
                </thead>
                <tbody>
                  {mangoGroup &&
                    mangoConfig.tokens.map((token, i) => {
                      const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)
                      return (
                        <TrBody key={`${token.symbol}${i}`}>
                          <Td>
                            <div className="flex items-center">
                              <img
                                alt=""
                                width="20"
                                height="20"
                                src={`/assets/icons/${token.symbol.toLowerCase()}.svg`}
                                className={`mr-2.5`}
                              />
                              <div>{token.symbol}</div>
                            </div>
                          </Td>
                          <Td>
                            {mangoGroup && mangoCache
                              ? formatUsdValue(
                                  mangoGroup
                                    .getPrice(tokenIndex, mangoCache)
                                    .toNumber()
                                )
                              : null}
                          </Td>
                          <Td>
                            {mangoGroup ? (
                              <span className={`text-th-green`}>
                                {i80f48ToPercent(
                                  mangoGroup.getDepositRate(tokenIndex)
                                ).toFixed(2)}
                                %
                              </span>
                            ) : null}
                          </Td>
                          <Td>
                            {mangoGroup ? (
                              <span className={`text-th-red`}>
                                {i80f48ToPercent(
                                  mangoGroup.getBorrowRate(tokenIndex)
                                ).toFixed(2)}
                                %
                              </span>
                            ) : null}
                          </Td>
                          {mangoAccount && mangoGroup && mangoCache ? (
                            <Td>
                              {mangoAccount
                                .getMaxWithBorrowForToken(
                                  mangoGroup,
                                  mangoCache,
                                  tokenIndex
                                )
                                .mul(I80F48.fromString('0.995'))
                                .toNumber() > 0
                                ? mangoAccount
                                    .getMaxWithBorrowForToken(
                                      mangoGroup,
                                      mangoCache,
                                      tokenIndex
                                    )
                                    .mul(I80F48.fromString('0.995'))
                                    .toNumber()
                                    .toLocaleString(undefined, {
                                      minimumFractionDigits:
                                        tokenPrecision[token.symbol],
                                      maximumFractionDigits:
                                        tokenPrecision[token.symbol],
                                    })
                                : 0}
                            </Td>
                          ) : null}
                          <Td>
                            {mangoGroup
                              ? mangoGroup
                                  .getUiTotalDeposit(tokenIndex)
                                  .sub(mangoGroup.getUiTotalBorrow(tokenIndex))
                                  .toNumber()
                                  .toLocaleString(undefined, {
                                    minimumFractionDigits:
                                      tokenPrecision[token.symbol],
                                    maximumFractionDigits:
                                      tokenPrecision[token.symbol],
                                  })
                              : null}
                          </Td>
                          <Td>
                            <div className={`flex justify-end`}>
                              <Tooltip
                                content={connected ? '' : t('connect-wallet')}
                              >
                                <Button
                                  onClick={() => handleShowBorrow(token.symbol)}
                                  className="ml-3 h-8 pt-0 pb-0 pl-3 pr-3 text-xs"
                                  disabled={
                                    !connected ||
                                    loadingMangoAccount ||
                                    !canWithdraw
                                  }
                                >
                                  {t('borrow')}
                                </Button>
                              </Tooltip>
                            </div>
                          </Td>
                        </TrBody>
                      )
                    })}
                </tbody>
              </Table>
            ) : (
              <div className="border-b border-th-bkg-4">
                <MobileTableHeader
                  colOneHeader={t('asset')}
                  colTwoHeader={`${t('deposit')}/${t('borrow-rate')}`}
                />
                {mangoGroup &&
                  mangoCache &&
                  mangoConfig.tokens.map((token, i) => {
                    const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)
                    return (
                      <ExpandableRow
                        buttonTemplate={
                          <div className="text-fgd-1 flex w-full items-center justify-between">
                            <div className="flex items-center">
                              <img
                                alt=""
                                width="20"
                                height="20"
                                src={`/assets/icons/${token.symbol.toLowerCase()}.svg`}
                                className={`mr-2.5`}
                              />

                              {token.symbol}
                            </div>
                            <div className="flex">
                              <span className="text-th-green">
                                {i80f48ToPercent(
                                  mangoGroup.getDepositRate(tokenIndex)
                                ).toFixed(2)}
                                %
                              </span>
                              <span className="px-0.5 text-th-fgd-4">/</span>
                              <span className="text-th-red">
                                {i80f48ToPercent(
                                  mangoGroup.getBorrowRate(tokenIndex)
                                ).toFixed(2)}
                                %
                              </span>
                            </div>
                          </div>
                        }
                        key={`${token.symbol}${i}`}
                        panelTemplate={
                          <div className="grid grid-flow-row grid-cols-2 gap-4">
                            <div className="text-left">
                              <div className="pb-0.5 text-xs text-th-fgd-3">
                                {t('price')}
                              </div>
                              {formatUsdValue(
                                mangoGroup
                                  .getPrice(tokenIndex, mangoCache)
                                  .toNumber()
                              )}
                            </div>
                            {mangoAccount ? (
                              <div className="text-left">
                                <div className="pb-0.5 text-xs text-th-fgd-3">
                                  {t('max-borrow')}
                                </div>
                                {mangoAccount
                                  ? mangoAccount
                                      .getMaxWithBorrowForToken(
                                        mangoGroup,
                                        mangoCache,
                                        tokenIndex
                                      )
                                      .mul(I80F48.fromString('0.995'))
                                      .toNumber()
                                      .toLocaleString(undefined, {
                                        minimumFractionDigits:
                                          tokenPrecision[token.symbol],
                                        maximumFractionDigits:
                                          tokenPrecision[token.symbol],
                                      })
                                  : null}
                              </div>
                            ) : null}
                            <div className="text-left">
                              <div className="pb-0.5 text-xs text-th-fgd-3">
                                {t('liquidity')}
                              </div>
                              {mangoGroup
                                .getUiTotalDeposit(tokenIndex)
                                .sub(mangoGroup.getUiTotalBorrow(tokenIndex))
                                .toNumber()
                                .toLocaleString(undefined, {
                                  minimumFractionDigits:
                                    tokenPrecision[token.symbol],
                                  maximumFractionDigits:
                                    tokenPrecision[token.symbol],
                                })}
                            </div>
                            <Button
                              onClick={() => handleShowBorrow(token.symbol)}
                              className="col-span-2 h-8 pt-0 pb-0 text-xs"
                              disabled={
                                !connected ||
                                loadingMangoAccount ||
                                !canWithdraw
                              }
                            >
                              {t('borrow')}
                            </Button>
                          </div>
                        }
                      />
                    )
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
      {showBorrowModal ? (
        <WithdrawModal
          isOpen={showBorrowModal}
          onClose={handleCloseWithdraw}
          tokenSymbol={borrowSymbol}
          title={t('borrow-withdraw')}
          borrow
        />
      ) : null}
      {showDepositModal ? (
        <DepositModal
          isOpen={showDepositModal}
          onClose={handleCloseDeposit}
          repayAmount={depositToSettle.amount}
          tokenSymbol={depositToSettle.symbol}
        />
      ) : null}
    </>
  )
}
