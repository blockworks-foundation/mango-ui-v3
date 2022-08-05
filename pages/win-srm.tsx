import { useEffect, useMemo, useState, useCallback } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import useMangoStore from '../stores/useMangoStore'
import { mangoGroupSelector } from '../stores/selectors'
import { formatUsdValue } from '../utils'
import { notify } from '../utils/notifications'
import { useTranslation } from 'next-i18next'
import EmptyState from '../components/EmptyState'
import {
  CurrencyDollarIcon,
  InformationCircleIcon,
  LinkIcon,
  XIcon,
} from '@heroicons/react/solid'
import { Row, Table, Td, Th, TrBody, TrHead } from '../components/TableElements'
import AccountsModal from '../components/AccountsModal'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from '../components/TradePageGrid'
import useMangoAccount from '../hooks/useMangoAccount'
import { useWallet } from '@solana/wallet-adapter-react'
import { handleWalletConnect } from 'components/ConnectWalletButton'
import Tooltip from 'components/Tooltip'
import Tabs from 'components/Tabs'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'delegate',
        'referrals',
        'profile',
      ])),
      // Will be passed to the page component as props
    },
  }
}

const TABS = ['maker', 'taker', 'pnl']

export default function SerumComp() {
  const { t } = useTranslation(['common', 'referrals'])
  const mangoGroup = useMangoStore(mangoGroupSelector)
  const { mangoAccount } = useMangoAccount()
  const { wallet, connected } = useWallet()
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const [activeTab, setActiveTab] = useState('maker')
  const [makerData, setMakerData] = useState<any>([])
  const [takerData, setTakerData] = useState<any>([])
  const [pnlData, setPnlData] = useState<any>([])
  const [accountPnlData, setAccountPnlData] = useState<any>([])
  const [accountPnl, setAccountPnl] = useState(0)
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const startDay = dayjs()
    .utc()
    .hour(0)
    .minute(0)
    .subtract((new Date().getUTCDay() + 6) % 7, 'day')

  const endDay = startDay.add(startDay.get('day') + 6, 'day')

  const fetchVolumeData = async () => {
    try {
      const response = await fetch(
        'https://mango-transaction-log.herokuapp.com/v3/stats/serum-volume-leaderboard'
      )
      const parsedResponse = await response.json()
      setMakerData(parsedResponse.volumes[0].mango_accounts)
      setTakerData(parsedResponse.volumes[1].mango_accounts)
    } catch {
      notify({ type: 'error', title: 'Failed to fetch competition data' })
    }
  }

  const fetchSpotPnlData = async () => {
    try {
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/serum-pnl-leaderboard`
      )
      const parsedResponse = await response.json()
      setPnlData(parsedResponse.participants)
    } catch {
      notify({ type: 'error', title: 'Failed to fetch competition data' })
    }
  }

  const fetchAccountPnlData = async (mangoAccountPk: string) => {
    try {
      const response = await fetch(
        `https://mango-transaction-log.herokuapp.com/v3/stats/account-performance-detailed?mango-account=${mangoAccountPk}&start-date=${startDay.format(
          'YYYY-MM-DD'
        )}`
      )
      const parsedResponse = await response.json()
      const entries: any = Object.entries(parsedResponse).sort((a, b) =>
        b[0].localeCompare(a[0])
      )
      setAccountPnlData(entries)
    } catch {
      notify({ type: 'error', title: 'Failed to fetch account PnL' })
    }
  }

  useEffect(() => {
    if (accountPnlData.length) {
      const currentPnl =
        accountPnlData[0][1].pnl - accountPnlData[0][1].perp_pnl
      const startPnl =
        accountPnlData[accountPnlData.length - 1][1].pnl -
        accountPnlData[accountPnlData.length - 1][1].perp_pnl
      setAccountPnl(currentPnl - startPnl)
    }
  }, [accountPnlData])

  useEffect(() => {
    if (mangoAccount) {
      fetchAccountPnlData(mangoAccount.publicKey.toString())
    }
  }, [mangoAccount])

  useEffect(() => {
    fetchVolumeData()
    fetchSpotPnlData()
  }, [])

  const handleTabChange = (tabName) => {
    setActiveTab(tabName)
  }

  const handleConnect = useCallback(() => {
    if (wallet) {
      handleWalletConnect(wallet)
    }
  }, [wallet])

  const filterForQualified = (accounts) => accounts.filter((a) => a.qualifies)

  const volumeTableData = useMemo(() => {
    if (makerData.length && takerData.length) {
      return activeTab === 'maker'
        ? filterForQualified(makerData)
        : filterForQualified(takerData)
    }
    return []
  }, [makerData, takerData, activeTab])

  const accountMakerVolume = useMemo(() => {
    if (mangoAccount && makerData.length) {
      const found = makerData.find(
        (acc) => acc.mango_account === mangoAccount.publicKey.toString()
      )
      return found
        ? found
        : {
            mango_account_volume: 0,
            ratio_to_total_volume: 0,
            qualifies: false,
          }
    }
    return null
  }, [mangoAccount, makerData])

  const accountTakerVolume = useMemo(() => {
    if (mangoAccount && takerData.length) {
      const found = takerData.find(
        (acc) => acc.mango_account === mangoAccount.publicKey.toString()
      )
      return found
        ? found
        : {
            mango_account_volume: 0,
            ratio_to_total_volume: 0,
            qualifies: false,
          }
    }
    return null
  }, [mangoAccount, takerData])

  const accountPnlQualifies = useMemo(() => {
    if (mangoAccount && pnlData.length) {
      const found = pnlData
        .slice(0, 10)
        .find((acc) => acc.mango_account === mangoAccount.publicKey.toString())
      return found
    }
    return null
  }, [mangoAccount, pnlData])

  return (
    <div className="grid grid-cols-12">
      <div className="col-span-12 py-6 lg:col-span-10 lg:col-start-2">
        <div className="mb-2 flex items-center justify-center space-x-4">
          <img
            className={`h-10 w-auto`}
            src="/assets/icons/srm.svg"
            alt="next"
          />
          <XIcon className="h-5 w-5 text-th-primary" />
          <img
            className={`h-12 w-auto`}
            src="/assets/icons/logo.svg"
            alt="next"
          />
        </div>
        <div className="mb-4 flex flex-col items-center border-b border-th-bkg-3 pb-4">
          <h1 className="relative mb-2 w-max text-center">
            Win a Share in 400k SRM
          </h1>
          <p className="mb-4 text-lg text-th-fgd-2">
            50k SRM are up for grabs every week until 12 Sep
          </p>
        </div>
        <h2 className="mb-2">How it Works</h2>
        <ul className="list-disc pl-3">
          <li className="mb-1 text-base">
            Trade any spot market on Mango each week from Mon 00:00 UTC to the
            following Mon 00:00 UTC
          </li>
          <li className="mb-1 text-base">
            At the end of the week the traders who contribute at least 1% of
            total volume for both maker (limit orders) and taker (market orders)
            will win a proportianate share of 40k SRM
          </li>
          <li className="text-base">
            Also, the top 10 traders by PnL will win a share of 10k SRM
          </li>
        </ul>
      </div>
      <div className="col-span-12 lg:col-span-10 lg:col-start-2">
        {connected ? (
          mangoAccount ? (
            <div className="grid grid-cols-3 md:gap-4">
              <div className="col-span-3">
                <h2 className="mb-4 md:mb-0">
                  Your Account{' '}
                  <span className="text-sm font-normal text-th-fgd-3">
                    ({`${startDay.format('D MMM')} – ${endDay.format('D MMM')}`}
                    )
                  </span>
                </h2>
              </div>
              <div className="col-span-3 border-t border-th-bkg-3 p-4 md:col-span-1 md:border-b">
                <p className="mb-1">Maker Volume</p>
                <span className="text-2xl font-bold lg:text-4xl">
                  {formatUsdValue(accountMakerVolume?.mango_account_volume)}
                </span>
                <div
                  className={`mt-3 w-max rounded-full border ${
                    accountMakerVolume?.qualifies
                      ? 'border-th-green'
                      : 'border-th-red'
                  } py-1 px-3 text-th-fgd-1`}
                >
                  <div className="flex">
                    <span className="font-bold">
                      {(
                        accountMakerVolume?.ratio_to_total_volume * 100
                      ).toFixed(1)}
                      %
                    </span>
                    <span className="mx-1 text-th-fgd-4">|</span>
                    <span className="flex items-center text-th-fgd-3">
                      {accountMakerVolume?.qualifies
                        ? 'Qualified'
                        : 'Unqualified'}
                      <Tooltip
                        content="Percentage of total maker volume needs to be 1% or greater to qualify"
                        placement={'bottom'}
                      >
                        <InformationCircleIcon className="ml-1.5 h-4 w-4 text-th-fgd-4 hover:cursor-help" />
                      </Tooltip>
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-span-3 border-t border-th-bkg-3 p-4 md:col-span-1 md:border-b">
                <p className="mb-1">Taker Volume</p>
                <span className="text-2xl font-bold lg:text-4xl">
                  {formatUsdValue(accountTakerVolume?.mango_account_volume)}
                </span>
                <div
                  className={`mt-3 w-max rounded-full border ${
                    accountTakerVolume?.qualifies
                      ? 'border-th-green'
                      : 'border-th-red'
                  } py-1 px-3 text-th-fgd-1`}
                >
                  <div className="flex">
                    <span className="font-bold">
                      {(
                        accountTakerVolume?.ratio_to_total_volume * 100
                      ).toFixed(1)}
                      %
                    </span>
                    <span className="mx-1 text-th-fgd-4">|</span>
                    <span className="flex items-center text-th-fgd-3">
                      {accountTakerVolume?.qualifies
                        ? 'Qualified'
                        : 'Unqualified'}
                      <Tooltip
                        content="Percentage of total taker volume needs to be 1% or greater to qualify"
                        placement={'bottom'}
                      >
                        <InformationCircleIcon className="ml-1.5 h-4 w-4 text-th-fgd-4 hover:cursor-help" />
                      </Tooltip>
                    </span>
                  </div>
                </div>
              </div>
              <div className="col-span-3 border-y border-th-bkg-3 p-4 md:col-span-1">
                <p className="mb-1">PnL</p>
                <span className="text-2xl font-bold lg:text-4xl">
                  {formatUsdValue(accountPnl)}
                </span>
                <div
                  className={`mt-3 w-max rounded-full border ${
                    accountPnlQualifies ? 'border-th-green' : 'border-th-red'
                  } py-1 px-3 text-th-fgd-1`}
                >
                  <div className="flex">
                    <span className="flex items-center text-th-fgd-3">
                      {accountPnlQualifies ? 'Qualified' : 'Unqualified'}
                      <Tooltip
                        content="You need to be in the top 10 for spot PnL to qualify"
                        placement={'bottom'}
                      >
                        <InformationCircleIcon className="ml-1.5 h-4 w-4 text-th-fgd-4 hover:cursor-help" />
                      </Tooltip>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="col-span-12 flex items-center justify-center rounded-md border border-th-bkg-3 p-6">
              <EmptyState
                buttonText={t('create-account')}
                icon={<CurrencyDollarIcon />}
                onClickButton={() => setShowAccountsModal(true)}
                title={t('no-account-found')}
                disabled={!wallet || !mangoGroup}
              />
            </div>
          )
        ) : (
          <div className="col-span-12 flex items-center justify-center rounded-md border border-th-bkg-3 p-6">
            <EmptyState
              buttonText={t('connect')}
              disabled={!wallet || !mangoGroup}
              icon={<LinkIcon />}
              onClickButton={handleConnect}
              title={t('connect-wallet')}
              desc="Connect your wallet to see your competition status"
            />
          </div>
        )}
      </div>
      <div className="col-span-12 pt-8 lg:col-span-10 lg:col-start-2">
        <h2 className="mb-4">Current Results</h2>
        <Tabs activeTab={activeTab} onChange={handleTabChange} tabs={TABS} />
        {activeTab === 'maker' || activeTab === 'taker' ? (
          volumeTableData.length ? (
            !isMobile ? (
              <Table>
                <thead>
                  <TrHead>
                    <Th>Rank</Th>
                    <Th>Account</Th>
                    <Th>Volume</Th>
                    <Th>% of Total Volume</Th>
                    <Th>Current SRM Prize</Th>
                  </TrHead>
                </thead>
                <tbody>
                  {volumeTableData.map((a, i) => (
                    <TrBody key={a.mango_account}>
                      <Td>#{i + 1}</Td>
                      <Td>
                        <a
                          className="default-transition block"
                          href={`/account?pubkey=${a.mango_account}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >{`${a.mango_account.slice(
                          0,
                          5
                        )}...${a.mango_account.slice(-5)}`}</a>
                      </Td>
                      <Td>{formatUsdValue(a.mango_account_volume)}</Td>
                      <Td>{(a.ratio_to_total_volume * 100).toFixed(1)}%</Td>
                      <Td className="flex items-center">
                        <img
                          className={`mr-1.5 h-4 w-auto`}
                          src="/assets/icons/srm.svg"
                          alt="next"
                        />
                        {a.srm_payout.toLocaleString(undefined, {
                          maximumFractionDigits: 1,
                        })}
                      </Td>
                    </TrBody>
                  ))}
                </tbody>
              </Table>
            ) : (
              volumeTableData.map((a, i) => (
                <Row key={a.mango_account}>
                  <div className="flex w-full justify-between text-left">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold">#{i + 1}</span>
                      <div>
                        <a
                          className="default-transition block"
                          href={`/account?pubkey=${a.mango_account}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >{`${a.mango_account.slice(
                          0,
                          5
                        )}...${a.mango_account.slice(-5)}`}</a>
                        <p className="mb-0">{`${formatUsdValue(
                          a.mango_account_volume
                        )} | ${(a.ratio_to_total_volume * 100).toFixed(
                          1
                        )}%`}</p>
                      </div>
                    </div>
                    <p className="mb-0 flex items-center text-th-fgd-1">
                      <img
                        className={`mr-1.5 h-4 w-auto`}
                        src="/assets/icons/srm.svg"
                        alt="next"
                      />
                      {a.srm_payout.toLocaleString(undefined, {
                        maximumFractionDigits: 1,
                      })}
                    </p>
                  </div>
                </Row>
              ))
            )
          ) : null
        ) : null}
        {activeTab === 'pnl' ? (
          pnlData.length ? (
            !isMobile ? (
              <Table>
                <thead>
                  <TrHead>
                    <Th>Rank</Th>
                    <Th>Account</Th>
                    <Th>PnL</Th>
                    <Th>Current SRM Prize</Th>
                  </TrHead>
                </thead>
                <tbody>
                  {pnlData.slice(0, 10).map((a, i) => (
                    <TrBody key={a.mango_account}>
                      <Td>#{i + 1}</Td>
                      <Td>
                        <a
                          className="default-transition block"
                          href={`/account?pubkey=${a.mango_account}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >{`${a.mango_account.slice(
                          0,
                          5
                        )}...${a.mango_account.slice(-5)}`}</a>
                      </Td>
                      <Td>{formatUsdValue(a.spot_pnl)}</Td>
                      <Td className="flex items-center">
                        <img
                          className={`mr-1.5 h-4 w-auto`}
                          src="/assets/icons/srm.svg"
                          alt="next"
                        />
                        {i === 0
                          ? '3,500.0'
                          : i === 1
                          ? '2,000.0'
                          : i === 2
                          ? '1,500.0'
                          : '500.0'}
                      </Td>
                    </TrBody>
                  ))}
                </tbody>
              </Table>
            ) : (
              pnlData.slice(0, 10).map((a, i) => (
                <Row key={a.mango_account}>
                  <div className="flex w-full justify-between text-left">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold">#{i + 1}</span>
                      <div>
                        <a
                          className="default-transition block"
                          href={`/account?pubkey=${a.mango_account}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >{`${a.mango_account.slice(
                          0,
                          5
                        )}...${a.mango_account.slice(-5)}`}</a>
                        <p className="mb-0">{formatUsdValue(a.spot_pnl)}</p>
                      </div>
                    </div>
                    <p className="mb-0 flex items-center text-th-fgd-1">
                      <img
                        className={`mr-1.5 h-4 w-auto`}
                        src="/assets/icons/srm.svg"
                        alt="next"
                      />
                      {i === 0
                        ? '3,500.0'
                        : i === 1
                        ? '2,000.0'
                        : i === 2
                        ? '1,500.0'
                        : '500.0'}
                    </p>
                  </div>
                </Row>
              ))
            )
          ) : null
        ) : null}
      </div>
      {showAccountsModal ? (
        <AccountsModal
          onClose={() => setShowAccountsModal(false)}
          isOpen={showAccountsModal}
        />
      ) : null}
    </div>
  )
}
