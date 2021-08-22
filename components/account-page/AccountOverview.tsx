import { useEffect, useCallback, useMemo, useState } from 'react'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import styled from '@emotion/styled'
import { Menu } from '@headlessui/react'
import Link from 'next/link'
import {
  // ChartBarIcon,
  ScaleIcon,
  CurrencyDollarIcon,
  ExclamationIcon,
  DotsHorizontalIcon,
  GiftIcon,
  HeartIcon,
  XIcon,
} from '@heroicons/react/outline'
import { ArrowSmDownIcon } from '@heroicons/react/solid'
import {
  getTokenBySymbol,
  nativeToUi,
  ZERO_BN,
  I80F48,
} from '@blockworks-foundation/mango-client'
import useMangoStore, {
  mangoClient,
  MNGO_INDEX,
} from '../../stores/useMangoStore'
import { useBalances } from '../../hooks/useBalances'
import { useSortableData } from '../../hooks/useSortableData'
import useLocalStorageState from '../../hooks/useLocalStorageState'
import { sleep, tokenPrecision, formatUsdValue } from '../../utils'
import { notify } from '../../utils/notifications'
import { Market } from '@project-serum/serum'
import Button, { LinkButton } from '../Button'
import Switch from '../Switch'
import PositionsTable from '../PerpPositionsTable'
import DepositModal from '../DepositModal'
import WithdrawModal from '../WithdrawModal'

const StyledAccountValue = styled.div`
  font-size: 1.8rem;
  line-height: 1.2;
`

export default function AccountOverview() {
  const [spotPortfolio, setSpotPortfolio] = useState([])
  const [unsettled, setUnsettled] = useState([])
  const [filteredSpotPortfolio, setFilteredSpotPortfolio] = useState([])
  const [showZeroBalances, setShowZeroBalances] = useLocalStorageState(
    'showZeroAccountBalances',
    false
  )
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [actionSymbol, setActionSymbol] = useState('')
  const balances = useBalances()
  const actions = useMangoStore((s) => s.actions)
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const { items, requestSort, sortConfig } = useSortableData(
    filteredSpotPortfolio
  )

  useEffect(() => {
    const spotPortfolio = []
    const unsettled = []
    balances.forEach((b) => {
      const token = getTokenBySymbol(groupConfig, b.symbol)
      const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)
      if (+b.deposits > 0) {
        spotPortfolio.push({
          market: b.symbol,
          balance: +b.deposits,
          borrowRate: mangoGroup
            .getBorrowRate(tokenIndex)
            .mul(I80F48.fromNumber(100)),
          depositRate: mangoGroup
            .getDepositRate(tokenIndex)
            .mul(I80F48.fromNumber(100)),
          orders: b.orders ? b.orders : 0,
          price: mangoGroup.getPrice(tokenIndex, mangoCache).toNumber(),
          symbol: b.symbol,
          value:
            +b.deposits *
            mangoGroup.getPrice(tokenIndex, mangoCache).toNumber(),
        })
      } else if (+b.borrows > 0) {
        spotPortfolio.push({
          market: b.symbol,
          balance: +b.borrows * -1,
          borrowRate: mangoGroup
            .getBorrowRate(tokenIndex)
            .mul(I80F48.fromNumber(100)),
          depositRate: mangoGroup
            .getDepositRate(tokenIndex)
            .mul(I80F48.fromNumber(100)),
          orders: b.orders ? b.orders : 0,
          price: mangoGroup.getPrice(tokenIndex, mangoCache).toNumber(),
          symbol: b.symbol,
          value:
            +b.borrows.mul(mangoGroup.getPrice(tokenIndex, mangoCache)) * -1,
        })
      } else {
        spotPortfolio.push({
          market: b.symbol,
          balance: 0,
          borrowRate: mangoGroup
            .getBorrowRate(tokenIndex)
            .mul(I80F48.fromNumber(100)),
          depositRate: mangoGroup
            .getDepositRate(tokenIndex)
            .mul(I80F48.fromNumber(100)),
          orders: b.orders ? b.orders : 0,
          price: mangoGroup.getPrice(tokenIndex, mangoCache).toNumber(),
          symbol: b.symbol,
          value: 0,
        })
      }
      if (b.unsettled > 0) {
        unsettled.push({
          market: b.symbol,
          balance: b.unsettled,
          symbol: b.symbol,
          value:
            b.unsettled *
            mangoGroup.getPrice(tokenIndex, mangoCache).toNumber(),
        })
      }
    })
    setSpotPortfolio(spotPortfolio.sort((a, b) => b.value - a.value))
    setFilteredSpotPortfolio(
      !showZeroBalances
        ? spotPortfolio
            .filter((pos) => pos.balance !== 0)
            .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
        : spotPortfolio.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    )

    setUnsettled(unsettled)
  }, [mangoAccount])

  const maintHealthRatio = useMemo(() => {
    return mangoAccount
      ? mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Maint')
      : 100
  }, [mangoAccount, mangoGroup, mangoCache])

  const initHealthRatio = useMemo(() => {
    return mangoAccount
      ? mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Init')
      : 100
  }, [mangoAccount, mangoGroup, mangoCache])

  const mngoAccrued = useMemo(() => {
    return mangoAccount
      ? mangoAccount.perpAccounts.reduce((acc, perpAcct) => {
          return perpAcct.mngoAccrued.add(acc)
        }, ZERO_BN)
      : ZERO_BN
  }, [mangoAccount])

  const handleShowZeroBalances = (checked) => {
    if (checked) {
      setFilteredSpotPortfolio(spotPortfolio)
    } else {
      setFilteredSpotPortfolio(spotPortfolio.filter((pos) => pos.balance !== 0))
    }
    setShowZeroBalances(checked)
  }

  async function handleSettleAll() {
    const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const markets = useMangoStore.getState().selectedMangoGroup.markets
    const wallet = useMangoStore.getState().wallet.current

    try {
      const spotMarkets = Object.values(markets).filter(
        (mkt) => mkt instanceof Market
      ) as Market[]
      // @ts-ignore
      await mangoClient.settleAll(mangoGroup, mangoAccount, spotMarkets, wallet)
      notify({ title: 'Successfully settled funds' })
      await sleep(250)
      actions.fetchMangoAccounts()
    } catch (e) {
      console.warn('Error settling all:', e)
      if (e.message === 'No unsettled funds') {
        notify({
          title: 'There are no unsettled funds',
          type: 'error',
        })
      } else {
        notify({
          title: 'Error settling funds',
          description: e.message,
          txid: e.txid,
          type: 'error',
        })
      }
    }
  }

  const handleRedeemMngo = async () => {
    const wallet = useMangoStore.getState().wallet.current
    const mngoNodeBank =
      mangoGroup.rootBankAccounts[MNGO_INDEX].nodeBankAccounts[0]

    try {
      const txid = await mangoClient.redeemAllMngo(
        mangoGroup,
        mangoAccount,
        wallet,
        mangoGroup.tokens[MNGO_INDEX].rootBank,
        mngoNodeBank.publicKey,
        mngoNodeBank.vault
      )
      actions.fetchMangoAccounts()
      notify({
        title: 'Successfully redeemed MNGO',
        description: '',
        txid,
      })
    } catch (e) {
      notify({
        title: 'Error redeeming MNGO',
        description: e.message,
        txid: e.txid,
        type: 'error',
      })
    }
  }

  const handleOpenDepositModal = useCallback((symbol) => {
    setActionSymbol(symbol)
    setShowDepositModal(true)
  }, [])

  const handleOpenWithdrawModal = useCallback((symbol) => {
    setActionSymbol(symbol)
    setShowWithdrawModal(true)
  }, [])

  return mangoAccount ? (
    <>
      <div className="grid grid-flow-col grid-cols-1 grid-rows-4 md:grid-cols-4 md:grid-rows-1 gap-4 pb-8">
        <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-2 text-th-fgd-3">Account Value</div>
          <div className="flex items-center pb-3">
            <CurrencyDollarIcon className="flex-shrink-0 h-7 w-7 mr-1.5 text-th-primary" />
            <StyledAccountValue className="font-bold text-th-fgd-1">
              {formatUsdValue(
                +mangoAccount.computeValue(mangoGroup, mangoCache)
              )}
            </StyledAccountValue>
          </div>
        </div>
        {/* <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-2 text-th-fgd-3">PNL</div>
          <div className="flex items-center pb-3">
            <ChartBarIcon className="flex-shrink-0 h-7 w-7 mr-1.5 text-th-primary" />
            <StyledAccountValue className="font-bold text-th-fgd-1">
              {formatUsdValue(
                +mangoAccount.computeValue(mangoGroup, mangoCache)
              )}
            </StyledAccountValue>
          </div>
        </div> */}
        <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-2 text-th-fgd-3">Leverage</div>
          <div className="flex items-center pb-3">
            <ScaleIcon className="flex-shrink-0 h-7 w-7 mr-1.5 text-th-primary" />
            <StyledAccountValue className="font-bold text-th-fgd-1">
              {mangoAccount.getLeverage(mangoGroup, mangoCache).toFixed(2)}x
            </StyledAccountValue>
          </div>
        </div>
        <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-2 text-th-fgd-3">Health Ratio</div>
          <div className="flex items-center pb-4">
            <HeartIcon className="flex-shrink-0 h-7 w-7 mr-1.5 text-th-primary" />
            <StyledAccountValue className="font-bold text-th-fgd-1">
              {maintHealthRatio < 1000 ? maintHealthRatio.toFixed(2) : '>999'}%
            </StyledAccountValue>
          </div>
          <div className="h-1.5 flex rounded bg-th-bkg-3">
            <div
              style={{
                width: `${maintHealthRatio}%`,
              }}
              className={`flex rounded ${
                maintHealthRatio > 30
                  ? 'bg-th-green'
                  : initHealthRatio > 0
                  ? 'bg-th-orange'
                  : 'bg-th-red'
              }`}
            ></div>
          </div>
        </div>
        <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-2 text-th-fgd-3">MNGO Rewards</div>
          <div className="flex items-center pb-2">
            <GiftIcon className="flex-shrink-0 h-7 w-7 mr-1.5 text-th-primary" />
            <StyledAccountValue className="font-bold text-th-fgd-1">
              {mangoGroup
                ? nativeToUi(
                    mngoAccrued.toNumber(),
                    mangoGroup.tokens[MNGO_INDEX].decimals
                  )
                : 0}
            </StyledAccountValue>
          </div>
          <LinkButton
            onClick={handleRedeemMngo}
            disabled={mngoAccrued.eq(ZERO_BN)}
            className="text-th-primary text-xs"
          >
            Claim Reward
          </LinkButton>
        </div>
      </div>
      {unsettled.length > 0 ? (
        <div className="border border-th-bkg-3 rounded-lg mb-8 p-6">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center text-lg">
              <ExclamationIcon className="h-5 mr-1.5 mt-0.5 text-th-primary w-5" />
              Unsettled Balances
            </div>
            <Button
              className="text-xs pt-0 pb-0 h-8 pl-3 pr-3"
              onClick={handleSettleAll}
            >
              Settle All
            </Button>
          </div>
          {unsettled.map((a) => (
            <div
              className="border-b border-th-bkg-4 flex items-center justify-between py-4 last:border-b-0 last:pb-0"
              key={a.symbol}
            >
              <div className="flex items-center">
                <img
                  alt=""
                  width="20"
                  height="20"
                  src={`/assets/icons/${a.symbol.toLowerCase()}.svg`}
                  className={`mr-2.5`}
                />
                <div>{a.symbol}</div>
              </div>
              {a.balance.toFixed(tokenPrecision[a.symbol])}
            </div>
          ))}
        </div>
      ) : null}
      <div className="pb-8">
        <div className="pb-4 text-th-fgd-1 text-lg">Perp Positions</div>
        <PositionsTable />
      </div>
      <div className="pb-4 text-th-fgd-1 text-lg">Assets & Liabilities</div>

      <div className="grid grid-flow-col grid-cols-1 grid-rows-2 md:grid-cols-2 md:grid-rows-1 gap-4 pb-4">
        <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-0.5 text-xs text-th-fgd-3">Total Assets Value</div>
          <div className="flex items-center">
            <div className="text-lg text-th-fgd-1">
              {formatUsdValue(
                +mangoAccount.getAssetsVal(mangoGroup, mangoCache)
              )}
            </div>
          </div>
        </div>
        <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-0.5 text-xs text-th-fgd-3">
            Total Liabilities Value
          </div>
          <div className="flex items-center">
            <div className="text-lg text-th-fgd-1">
              {formatUsdValue(
                +mangoAccount.getLiabsVal(mangoGroup, mangoCache)
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end pb-4">
        <Switch
          checked={showZeroBalances}
          className="text-xs"
          onChange={handleShowZeroBalances}
        >
          Show zero balances
        </Switch>
      </div>
      {filteredSpotPortfolio.length > 0 ? (
        <Table className="min-w-full divide-y divide-th-bkg-2">
          <Thead>
            <Tr className="text-th-fgd-3 text-xs">
              <Th scope="col" className={`px-6 py-2 text-left`}>
                <LinkButton
                  className="flex font-normal items-center no-underline"
                  onClick={() => requestSort('market')}
                >
                  Asset
                  <ArrowSmDownIcon
                    className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                      sortConfig?.key === 'market'
                        ? sortConfig.direction === 'ascending'
                          ? 'transform rotate-180'
                          : 'transform rotate-360'
                        : null
                    }`}
                  />
                </LinkButton>
              </Th>
              <Th scope="col" className={`px-6 py-2 text-left`}>
                <LinkButton
                  className="flex font-normal items-center no-underline"
                  onClick={() => requestSort('balance')}
                >
                  Balance
                  <ArrowSmDownIcon
                    className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                      sortConfig?.key === 'balance'
                        ? sortConfig.direction === 'ascending'
                          ? 'transform rotate-180'
                          : 'transform rotate-360'
                        : null
                    }`}
                  />
                </LinkButton>
              </Th>
              <Th scope="col" className={`px-6 py-2 text-left`}>
                <LinkButton
                  className="flex font-normal items-center no-underline"
                  onClick={() => requestSort('orders')}
                >
                  In Orders
                  <ArrowSmDownIcon
                    className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                      sortConfig?.key === 'orders'
                        ? sortConfig.direction === 'ascending'
                          ? 'transform rotate-180'
                          : 'transform rotate-360'
                        : null
                    }`}
                  />
                </LinkButton>
              </Th>
              <Th scope="col" className={`px-6 py-2 text-left`}>
                <LinkButton
                  className="flex font-normal items-center no-underline"
                  onClick={() => requestSort('price')}
                >
                  Price
                  <ArrowSmDownIcon
                    className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                      sortConfig?.key === 'price'
                        ? sortConfig.direction === 'ascending'
                          ? 'transform rotate-180'
                          : 'transform rotate-360'
                        : null
                    }`}
                  />
                </LinkButton>
              </Th>
              <Th scope="col" className="px-6 py-2 text-left">
                <LinkButton
                  className="flex font-normal items-center no-underline"
                  onClick={() => requestSort('value')}
                >
                  Value
                  <ArrowSmDownIcon
                    className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                      sortConfig?.key === 'value'
                        ? sortConfig.direction === 'ascending'
                          ? 'transform rotate-180'
                          : 'transform rotate-360'
                        : null
                    }`}
                  />
                </LinkButton>
              </Th>
              <Th scope="col" className="px-6 py-2 text-left">
                <LinkButton
                  className="flex font-normal items-center no-underline"
                  onClick={() => requestSort('depositRate')}
                >
                  Deposit Rate
                  <ArrowSmDownIcon
                    className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                      sortConfig?.key === 'depositRate'
                        ? sortConfig.direction === 'ascending'
                          ? 'transform rotate-180'
                          : 'transform rotate-360'
                        : null
                    }`}
                  />
                </LinkButton>
              </Th>
              <Th scope="col" className="px-6 py-2 text-left">
                <LinkButton
                  className="flex font-normal items-center no-underline"
                  onClick={() => requestSort('borrowRate')}
                >
                  Borrow Rate
                  <ArrowSmDownIcon
                    className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                      sortConfig?.key === 'borrowRate'
                        ? sortConfig.direction === 'ascending'
                          ? 'transform rotate-180'
                          : 'transform rotate-360'
                        : null
                    }`}
                  />
                </LinkButton>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {items.map((pos, i) => (
              <Tr
                key={i}
                className={`border-b border-th-bkg-3
                  ${i % 2 === 0 ? `bg-th-bkg-3` : `bg-th-bkg-2`}
                `}
              >
                <Td
                  className={`px-6 py-2 whitespace-nowrap text-sm text-th-fgd-1`}
                >
                  <div className="flex items-center">
                    <img
                      alt=""
                      width="20"
                      height="20"
                      src={`/assets/icons/${pos.symbol.toLowerCase()}.svg`}
                      className={`mr-2.5`}
                    />
                    <div>{pos.market}</div>
                  </div>
                </Td>
                <Td
                  className={`px-6 py-2 whitespace-nowrap text-sm text-th-fgd-1`}
                >
                  {pos.balance !== 0
                    ? pos.balance.toFixed(tokenPrecision[pos.symbol])
                    : 0}
                </Td>
                <Td
                  className={`px-6 py-2 whitespace-nowrap text-sm text-th-fgd-1`}
                >
                  {pos.orders !== 0
                    ? pos.orders.toFixed(tokenPrecision[pos.symbol])
                    : 0}
                </Td>
                <Td
                  className={`px-6 py-2 whitespace-nowrap text-sm text-th-fgd-1`}
                >
                  {formatUsdValue(pos.price)}
                </Td>
                <Td
                  className={`px-6 py-2 whitespace-nowrap text-sm text-th-fgd-1`}
                >
                  {formatUsdValue(pos.value)}
                </Td>
                <Td
                  className={`px-6 py-2 whitespace-nowrap text-sm text-th-green`}
                >
                  {pos.depositRate.toFixed(2)}%
                </Td>
                <Td
                  className={`px-6 py-2 whitespace-nowrap text-sm text-th-red`}
                >
                  {pos.borrowRate.toFixed(2)}%
                </Td>
                <Td className={`px-6 py-2 flex justify-end`}>
                  <Menu>
                    {({ open }) => (
                      <div className="relative h-full">
                        <Menu.Button className="bg-th-bkg-4 flex items-center justify-center rounded-full w-8 h-8 text-th-fgd-1 focus:outline-none hover:text-th-primary">
                          {open ? (
                            <XIcon className="h-5 w-5" />
                          ) : (
                            <DotsHorizontalIcon className="h-5 w-5" />
                          )}
                        </Menu.Button>
                        <Menu.Items className="bg-th-bkg-1 mt-2 p-1 absolute right-0 bottom-10 shadow-lg outline-none rounded-md w-32 z-20">
                          <div className="border-b border-th-bkg-3 flex items-center p-2 text-th-fgd-3 text-xs">
                            <img
                              alt=""
                              width="12"
                              height="12"
                              src={`/assets/icons/${pos.symbol.toLowerCase()}.svg`}
                              className={`mr-1.5`}
                            />
                            {pos.symbol}
                          </div>
                          {pos.symbol !== 'USDC' ? (
                            <Menu.Item>
                              <Link
                                href={`/spot/${pos.symbol}`}
                                key={pos.symbol}
                              >
                                <a className="block font-normal p-2 rounded-none text-th-fgd-1 w-full hover:bg-th-bkg-2 hover:cursor-pointer hover:text-th-fgd-1 focus:outline-none">
                                  <div className="text-left">Trade</div>
                                </a>
                              </Link>
                            </Menu.Item>
                          ) : null}
                          <Menu.Item>
                            <button
                              className="font-normal rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none"
                              onClick={() => handleOpenDepositModal(pos.symbol)}
                            >
                              <div className="text-left">Deposit</div>
                            </button>
                          </Menu.Item>
                          <Menu.Item>
                            <button
                              className="font-normal rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none"
                              onClick={() =>
                                handleOpenWithdrawModal(pos.symbol)
                              }
                            >
                              <div className="text-left">Withdraw</div>
                            </button>
                          </Menu.Item>
                        </Menu.Items>
                      </div>
                    )}
                  </Menu>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      ) : (
        <div
          className={`w-full text-center py-6 bg-th-bkg-1 text-th-fgd-3 rounded-md`}
        >
          No assets
        </div>
      )}
      {showDepositModal && (
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
          tokenSymbol={actionSymbol}
        />
      )}
      {showWithdrawModal && (
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          tokenSymbol={actionSymbol}
        />
      )}
    </>
  ) : null
}
