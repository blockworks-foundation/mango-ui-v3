import { useCallback, useState } from 'react'
import {
  getTokenBySymbol,
  ZERO_I80F48,
  I80F48,
} from '@blockworks-foundation/mango-client'
import useMangoStore from '../../stores/useMangoStore'
import { useBalances } from '../../hooks/useBalances'
import {
  floorToDecimal,
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

export default function AccountBorrows() {
  const { t } = useTranslation('common')
  const balances = useBalances()
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const mangoConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const loadingMangoAccount = useMangoStore(
    (s) => s.selectedMangoAccount.initialLoad
  )
  const connected = useMangoStore((s) => s.wallet.connected)

  const [borrowSymbol, setBorrowSymbol] = useState('')
  const [depositToSettle, setDepositToSettle] = useState(null)
  const [showBorrowModal, setShowBorrowModal] = useState(false)
  const [showDepositModal, setShowDepositModal] = useState(false)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

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

  const handleShowDeposit = (symbol) => {
    setDepositToSettle({ symbol: symbol })
    setShowDepositModal(true)
  }

  return (
    <>
      <div className="pb-2 text-th-fgd-1 text-lg">{t('your-borrows')}</div>
      {/* TODO: calculate LiabsVal without perp markets
        <div className="border border-th-red flex items-center justify-between p-2 rounded">
          <div className="pr-4 text-xs text-th-fgd-3">{t('total-borrow-value')}:</div>
          <span>
            {formatUsdValue(+mangoAccount.getLiabsVal(mangoGroup, mangoCache))}
          </span>
        </div> */}
      <div className="flex flex-col pb-2 pt-4">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="align-middle inline-block min-w-full sm:px-6 lg:px-8">
            {mangoGroup ? (
              balances.find((b) => b.borrows.gt(ZERO_I80F48)) ? (
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
                        .filter((assets) => assets.borrows.gt(ZERO_I80F48))
                        .map((asset, i) => {
                          const token = getTokenBySymbol(
                            mangoConfig,
                            asset.symbol
                          )
                          const tokenIndex = mangoGroup.getTokenIndex(
                            token.mintKey
                          )
                          return (
                            <TrBody index={i} key={tokenIndex}>
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
                              <Td>
                                {asset.borrows.toFixed(
                                  tokenPrecision[asset.symbol]
                                )}
                              </Td>
                              <Td>
                                {formatUsdValue(
                                  asset.borrows.mul(
                                    mangoGroup.getPrice(tokenIndex, mangoCache)
                                  )
                                )}
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
                                      handleShowDeposit(asset.symbol)
                                    }
                                    className="ml-3 text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                                    disabled={!connected || loadingMangoAccount}
                                  >
                                    {t('deposit')}
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleShowBorrow(asset.symbol)
                                    }
                                    className="ml-3 text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                                    disabled={!connected || loadingMangoAccount}
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
                  <>
                    <MobileTableHeader
                      headerTemplate={
                        <>
                          <div className="col-span-7">{t('asset')}</div>
                          <div className="col-span-4 text-right">
                            {t('balance')}
                          </div>
                        </>
                      }
                    />
                    {balances
                      .filter((assets) => assets.borrows.gt(ZERO_I80F48))
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
                              <>
                                <div className="col-span-7 flex items-center text-fgd-1">
                                  <img
                                    alt=""
                                    width="20"
                                    height="20"
                                    src={`/assets/icons/${asset.symbol.toLowerCase()}.svg`}
                                    className={`mr-2.5`}
                                  />

                                  {asset.symbol}
                                </div>
                                <div className="col-span-4 text-fgd-1 text-right">
                                  {asset.borrows.toFixed(
                                    tokenPrecision[asset.symbol]
                                  )}
                                </div>
                              </>
                            }
                            key={`${asset.symbol}${i}`}
                            index={i}
                            panelTemplate={
                              <>
                                <div className="col-span-1 text-left">
                                  <div className="pb-0.5 text-th-fgd-3 text-xs">
                                    {t('value')}
                                  </div>
                                  {formatUsdValue(
                                    asset.borrows.mul(
                                      mangoGroup.getPrice(
                                        tokenIndex,
                                        mangoCache
                                      )
                                    )
                                  )}
                                </div>
                                <div className="col-span-1 text-left">
                                  <div className="pb-0.5 text-th-fgd-3 text-xs">
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

                                <div className="col-span-1">
                                  <Button
                                    onClick={() =>
                                      handleShowDeposit(asset.symbol)
                                    }
                                    className="text-xs pt-0 pb-0 h-8 w-full"
                                    disabled={!connected || loadingMangoAccount}
                                  >
                                    {t('deposit')}
                                  </Button>
                                </div>
                                <div className="col-span-1">
                                  <Button
                                    onClick={() =>
                                      handleShowBorrow(asset.symbol)
                                    }
                                    className="text-xs pt-0 pb-0 h-8 w-full"
                                    disabled={!connected || loadingMangoAccount}
                                  >
                                    {t('borrow')}
                                  </Button>
                                </div>
                              </>
                            }
                          />
                        )
                      })}
                  </>
                )
              ) : (
                <div
                  className={`w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md`}
                >
                  {t('no-borrows')}
                </div>
              )
            ) : null}
          </div>
        </div>
      </div>
      <div className="pb-2 pt-8 text-th-fgd-1 text-lg">{t('all-assets')}</div>
      <div className="flex flex-col pb-2 pt-4">
        <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="align-middle inline-block min-w-full sm:px-6 lg:px-8">
            {!isMobile ? (
              <Table>
                <thead>
                  <TrHead>
                    <Th>{t('asset')}</Th>
                    <Th>{t('price')}</Th>
                    <Th>{t('borrow-rate')} (APR)</Th>
                    <Th>{t('max-borrow')}</Th>
                    <Th>{t('liquidity')}</Th>
                  </TrHead>
                </thead>
                <tbody>
                  {mangoConfig.tokens.map((token, i) => {
                    const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)
                    return (
                      <TrBody index={i} key={`${token.symbol}${i}`}>
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
                          {formatUsdValue(
                            mangoGroup.getPrice(tokenIndex, mangoCache)
                          )}
                        </Td>
                        <Td>
                          <span className={`text-th-red`}>
                            {i80f48ToPercent(
                              mangoGroup.getBorrowRate(tokenIndex)
                            ).toFixed(2)}
                            %
                          </span>
                        </Td>
                        <Td>
                          {mangoAccount
                            .getMaxWithBorrowForToken(
                              mangoGroup,
                              mangoCache,
                              tokenIndex
                            )
                            .mul(I80F48.fromString('0.995'))
                            .toNumber() > 0
                            ? floorToDecimal(
                                mangoAccount
                                  .getMaxWithBorrowForToken(
                                    mangoGroup,
                                    mangoCache,
                                    tokenIndex
                                  )
                                  .mul(I80F48.fromString('0.995'))
                                  .toNumber(),
                                mangoGroup.tokens[tokenIndex].decimals
                              )
                            : 0}
                          {/* floorToDecimal(parseFloat(maxWithdraw.toFixed()), token.decimals) */}
                        </Td>
                        <Td>
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
                        </Td>
                        <Td>
                          <div className={`flex justify-end`}>
                            <Button
                              onClick={() => handleShowBorrow(token.symbol)}
                              className="text-xs pt-0 pb-0 h-8 pl-3 pr-3"
                              disabled={!connected || loadingMangoAccount}
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
              <>
                <MobileTableHeader
                  headerTemplate={
                    <>
                      <div className="col-span-5">{t('asset')}</div>
                      <div className="col-span-6 text-right">
                        {t('borrow-rate')} (APR)
                      </div>
                    </>
                  }
                />
                {mangoConfig.tokens.map((token, i) => {
                  const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)
                  return (
                    <ExpandableRow
                      buttonTemplate={
                        <>
                          <div className="col-span-7 flex items-center text-fgd-1">
                            <img
                              alt=""
                              width="20"
                              height="20"
                              src={`/assets/icons/${token.symbol.toLowerCase()}.svg`}
                              className={`mr-2.5`}
                            />

                            {token.symbol}
                          </div>
                          <div className="col-span-4 text-fgd-1 text-right">
                            <span className={`text-th-red`}>
                              {i80f48ToPercent(
                                mangoGroup.getBorrowRate(tokenIndex)
                              ).toFixed(2)}
                              %
                            </span>
                          </div>
                        </>
                      }
                      key={`${token.symbol}${i}`}
                      index={i}
                      panelTemplate={
                        <>
                          <div className="col-span-1 text-left">
                            <div className="pb-0.5 text-th-fgd-3 text-xs">
                              {t('price')}
                            </div>
                            {formatUsdValue(
                              mangoGroup.getPrice(tokenIndex, mangoCache)
                            )}
                          </div>
                          <div className="col-span-1 text-left">
                            <div className="pb-0.5 text-th-fgd-3 text-xs">
                              {t('max-borrow')}
                            </div>
                            {mangoAccount
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
                              })}
                          </div>
                          <div className="col-span-1 text-left">
                            <div className="pb-0.5 text-th-fgd-3 text-xs">
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
                          <div className="col-span-1" />
                          <div className="col-span-1">
                            <Button
                              onClick={() => handleShowBorrow(token.symbol)}
                              className="text-xs pt-0 pb-0 h-8 w-full"
                              disabled={!connected || loadingMangoAccount}
                            >
                              {t('borrow')}
                            </Button>
                          </div>
                        </>
                      }
                    />
                  )
                })}
              </>
            )}
          </div>
        </div>
      </div>
      {showBorrowModal && (
        <WithdrawModal
          isOpen={showBorrowModal}
          onClose={handleCloseWithdraw}
          tokenSymbol={borrowSymbol}
          title={t('borrow-withdraw')}
          borrow
        />
      )}
      {showDepositModal && (
        <DepositModal
          isOpen={showDepositModal}
          onClose={handleCloseDeposit}
          // settleDeficit={depositToSettle.deficit.toString()}
          tokenSymbol={depositToSettle.symbol}
        />
      )}
    </>
  )
}
