import { useEffect, useMemo, useState } from 'react'
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table'
import styled from '@emotion/styled'
import { Menu } from '@headlessui/react'
import {
  ArrowSmDownIcon,
  CurrencyDollarIcon,
  DotsHorizontalIcon,
  HeartIcon,
  XIcon,
} from '@heroicons/react/outline'
import {
  getTokenBySymbol,
  getMarketByPublicKey,
  I80F48,
  nativeI80F48ToUi,
  PerpMarket,
} from '@blockworks-foundation/mango-client'
import useMangoStore from '../../stores/useMangoStore'
import { useBalances } from '../../hooks/useBalances'
import { useSortableData } from '../../hooks/useSortableData'
import { usdFormatter, tokenPrecision } from '../../utils'
import SideBadge from '../SideBadge'
import Button, { LinkButton } from '../Button'
import Switch from '../Switch'
import PositionsTable from '../PositionsTable'

const StyledAccountValue = styled.div`
  font-size: 1.8rem;
  line-height: 1.2;
`

export default function AccountOverview() {
  const [spotPortfolio, setSpotPortfolio] = useState([])
  const [perpPositions, setPerpPositions] = useState([])
  const [filteredSpotPortfolio, setFilteredSpotPortfolio] = useState([])
  const [showZeroBalances, setShowZeroBalances] = useState(false)
  const allMarkets = useMangoStore((s) => s.selectedMangoGroup.markets)
  const balances = useBalances()
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  const { items, requestSort, sortConfig } = useSortableData(
    filteredSpotPortfolio
  )

  const perpMarkets = useMemo(
    () =>
      mangoGroup
        ? groupConfig.perpMarkets.map(
            (m) => mangoGroup.perpMarkets[m.marketIndex]
          )
        : [],
    [mangoGroup]
  )

  const perpAccounts = useMemo(
    () =>
      mangoAccount
        ? groupConfig.perpMarkets.map(
            (m) => mangoAccount.perpAccounts[m.marketIndex]
          )
        : [],
    [mangoAccount]
  )

  useEffect(() => {
    let positions = []
    perpAccounts.forEach((acc, index) => {
      const market = perpMarkets[index]
      const marketConfig = getMarketByPublicKey(groupConfig, market.perpMarket)
      const perpMarket = allMarkets[
        marketConfig.publicKey.toString()
      ] as PerpMarket
      if (
        +nativeI80F48ToUi(acc.quotePosition, marketConfig.quoteDecimals) !== 0
      ) {
        positions.push({
          market: marketConfig.name,
          balance: perpMarket.baseLotsToNumber(acc.basePosition),
          price: mangoGroup.getPrice(marketConfig.marketIndex, mangoCache),
          symbol: marketConfig.baseSymbol,
          value: +nativeI80F48ToUi(
            acc.quotePosition,
            marketConfig.quoteDecimals
          ),
          type:
            perpMarket.baseLotsToNumber(acc.basePosition) > 0
              ? 'Long'
              : 'Short',
        })
      }
    })
    setPerpPositions(positions.sort((a, b) => b.value - a.value))
  }, [])

  useEffect(() => {
    const spotPortfolio = []
    balances.forEach((b) => {
      const token = getTokenBySymbol(groupConfig, b.symbol)
      const tokenIndex = mangoGroup.getTokenIndex(token.mintKey)
      if (+b.marginDeposits > 0) {
        spotPortfolio.push({
          market: b.symbol,
          balance: +b.marginDeposits + b.orders + b.unsettled,
          borrowRate: mangoGroup
            .getBorrowRate(tokenIndex)
            .mul(I80F48.fromNumber(100)),
          depositRate: mangoGroup
            .getDepositRate(tokenIndex)
            .mul(I80F48.fromNumber(100)),
          price: mangoGroup.getPrice(tokenIndex, mangoCache).toNumber(),
          symbol: b.symbol,
          value:
            (+b.marginDeposits + b.orders + b.unsettled) *
            mangoGroup.getPrice(tokenIndex, mangoCache).toNumber(),
          type: 'Deposit',
        })
      } else if (+b.borrows > 0) {
        spotPortfolio.push({
          market: b.symbol,
          balance: +b.borrows,
          borrowRate: mangoGroup
            .getBorrowRate(tokenIndex)
            .mul(I80F48.fromNumber(100)),
          depositRate: mangoGroup
            .getDepositRate(tokenIndex)
            .mul(I80F48.fromNumber(100)),
          price: mangoGroup.getPrice(tokenIndex, mangoCache).toNumber(),
          symbol: b.symbol,
          value: b.borrows.mul(mangoGroup.getPrice(tokenIndex, mangoCache)),
          type: 'Borrow',
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
          price: mangoGroup.getPrice(tokenIndex, mangoCache).toNumber(),
          symbol: b.symbol,
          value: 0,
          type: '–',
        })
      }
    })
    setSpotPortfolio(spotPortfolio.sort((a, b) => b.value - a.value))
    setFilteredSpotPortfolio(
      spotPortfolio
        .filter((pos) => pos.balance > 0)
        .sort((a, b) => b.value - a.value)
    )
  }, [])

  const handleShowZeroBalances = (checked) => {
    if (checked) {
      setFilteredSpotPortfolio(spotPortfolio)
    } else {
      setFilteredSpotPortfolio(spotPortfolio.filter((pos) => pos.balance > 0))
    }
    setShowZeroBalances(checked)
  }

  return mangoAccount ? (
    <>
      <div className="pb-6">
        <div className="pb-1 text-th-fgd-3">Account Value</div>
        <div className="flex items-center">
          <CurrencyDollarIcon className="flex-shrink-0 h-7 w-7 mr-1.5 text-th-primary" />
          <StyledAccountValue className="text-th-fgd-1">
            {usdFormatter.format(
              +mangoAccount.computeValue(mangoGroup, mangoCache).toFixed(2)
            )}
          </StyledAccountValue>
        </div>
      </div>
      <div className="grid grid-flow-col grid-cols-1 grid-rows-4 sm:grid-cols-2 sm:grid-rows-2 md:grid-cols-4 md:grid-rows-1 gap-4 pb-10">
        <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-0.5 text-xs text-th-fgd-3">Positions</div>
          <div className="flex items-center">
            <div className="text-lg text-th-fgd-1">
              {spotPortfolio.length > 0
                ? usdFormatter.format(
                    spotPortfolio.reduce(
                      (acc, d) => d.market.includes('PERP') && acc + d.value,
                      0
                    )
                  )
                : 0}
            </div>
          </div>
        </div>
        <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-0.5 text-xs text-th-fgd-3">Deposits</div>
          <div className="flex items-center">
            <div className="text-lg text-th-fgd-1">
              {usdFormatter.format(
                +mangoAccount.getAssetsVal(mangoGroup, mangoCache)
              )}
            </div>
          </div>
        </div>
        <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-0.5 text-xs text-th-fgd-3">Borrows</div>
          <div className="flex items-center">
            <div className="text-lg text-th-fgd-1">
              {usdFormatter.format(
                +mangoAccount.getLiabsVal(mangoGroup, mangoCache)
              )}
            </div>
          </div>
        </div>
        <div className="border border-th-bkg-4 p-4 rounded-lg">
          <div className="pb-0.5 text-xs text-th-fgd-3">Health Ratio</div>
          <div className="flex items-center">
            <HeartIcon className="flex-shrink-0 h-5 w-5 mr-2 text-th-primary" />
            <div className="text-lg text-th-fgd-1">
              {mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Maint')}%
            </div>
          </div>
        </div>
      </div>
      <div className="pb-8">
        <div className="pb-4 text-th-fgd-1 text-lg">Perp Positions</div>
        <PositionsTable />
      </div>
      {spotPortfolio.length > 0 ? (
        <>
          <div className="flex items-center justify-between pb-4">
            <div className="text-th-fgd-1 text-lg">Assets</div>
            <Switch
              checked={showZeroBalances}
              className="text-xs"
              onChange={handleShowZeroBalances}
            >
              Show zero balances
            </Switch>
          </div>
          <Table className="min-w-full divide-y divide-th-bkg-2">
            <Thead>
              <Tr className="text-th-fgd-3 text-xs">
                <Th scope="col" className={`px-6 py-2 text-left font-normal`}>
                  <LinkButton
                    className="flex items-center no-underline"
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
                <Th scope="col" className={`px-6 py-2 text-left font-normal`}>
                  <LinkButton
                    className="flex items-center no-underline"
                    onClick={() => requestSort('type')}
                  >
                    Type
                    <ArrowSmDownIcon
                      className={`default-transition flex-shrink-0 h-4 w-4 ml-1 ${
                        sortConfig?.key === 'type'
                          ? sortConfig.direction === 'ascending'
                            ? 'transform rotate-180'
                            : 'transform rotate-360'
                          : null
                      }`}
                    />
                  </LinkButton>
                </Th>
                <Th scope="col" className={`px-6 py-2 text-left font-normal`}>
                  <LinkButton
                    className="flex items-center no-underline"
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
                <Th scope="col" className={`px-6 py-2 text-left font-normal`}>
                  <LinkButton
                    className="flex items-center no-underline"
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
                <Th scope="col" className="px-6 py-2 text-left font-normal">
                  <LinkButton
                    className="flex items-center no-underline"
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
                <Th scope="col" className="px-6 py-2 text-left font-normal">
                  <LinkButton
                    className="flex items-center no-underline"
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
                <Th scope="col" className="px-6 py-2 text-left font-normal">
                  <LinkButton
                    className="flex items-center no-underline"
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
                    {pos.type === 'Long' || pos.type === 'Short' ? (
                      <SideBadge side={pos.type} />
                    ) : (
                      pos.type
                    )}
                  </Td>
                  <Td
                    className={`px-6 py-2 whitespace-nowrap text-sm text-th-fgd-1`}
                  >
                    {pos.balance > 0
                      ? pos.balance.toFixed(tokenPrecision[pos.symbol])
                      : 0}
                  </Td>
                  <Td
                    className={`px-6 py-2 whitespace-nowrap text-sm text-th-fgd-1`}
                  >
                    {usdFormatter.format(pos.price)}
                  </Td>
                  <Td
                    className={`px-6 py-2 whitespace-nowrap text-sm text-th-fgd-1`}
                  >
                    {usdFormatter.format(pos.value)}
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
                            <Menu.Item>
                              <button
                                className="font-normal rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none"
                                onClick={() => console.log('true')}
                              >
                                <div className="text-left">Trade</div>
                              </button>
                            </Menu.Item>
                            <Menu.Item>
                              <button
                                className="font-normal rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none"
                                onClick={() => console.log('true')}
                              >
                                <div className="text-left">Deposit</div>
                              </button>
                            </Menu.Item>
                            <Menu.Item>
                              <button
                                className="font-normal rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none"
                                onClick={() => console.log('true')}
                              >
                                <div className="text-left">Withdraw</div>
                              </button>
                            </Menu.Item>
                            <Menu.Item>
                              <button
                                className="font-normal rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none"
                                onClick={() => console.log('true')}
                              >
                                <div className="text-left">Borrow</div>
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
        </>
      ) : null}
    </>
  ) : null
}
