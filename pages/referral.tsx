import { useEffect, useState, useCallback } from 'react'
import PageBodyContainer from '../components/PageBodyContainer'
import TopBar from '../components/TopBar'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import useMangoStore from '../stores/useMangoStore'
import {
  mangoAccountSelector,
  mangoClientSelector,
  mangoGroupConfigSelector,
  mangoGroupSelector,
  walletSelector,
} from '../stores/selectors'
import { IconButton, LinkButton } from '../components/Button'
import { abbreviateAddress, copyToClipboard } from '../utils'
import { notify } from '../utils/notifications'
import {
  getMarketIndexBySymbol,
  ReferrerIdRecord,
} from '@blockworks-foundation/mango-client'
import { useTranslation } from 'next-i18next'
import EmptyState from '../components/EmptyState'
import {
  CheckIcon,
  CurrencyDollarIcon,
  DuplicateIcon,
  LinkIcon,
} from '@heroicons/react/outline'
import { MngoMonoIcon } from '../components/icons'
import Link from 'next/link'
import Modal from '../components/Modal'
import { Table, Td, Th, TrBody, TrHead } from '../components/TableElements'
import dayjs from 'dayjs'
import AccountsModal from '../components/AccountsModal'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from '../components/TradePageGrid'
import { ExpandableRow } from '../components/TableElements'
import MobileTableHeader from '../components/mobile/MobileTableHeader'
import Input from '../components/Input'
import InlineNotification from '../components/InlineNotification'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      // Will be passed to the page component as props
    },
  }
}

const referralHistory = [
  {
    time: '2022-02-09T19:28:59Z',
    referralLink: 'test2',
    referee: '22JS1jkvkLcdxhHo1LpWXUh6sTErkt54j1YaszYWZoCi',
    fee: 0.22,
  },
  {
    time: '2022-02-08T19:28:59Z',
    referralLink: 'test2',
    referee: '22JS1jkvkLcdxhHo1LpWXUh6sTErkt54j1YaszYWZoCi',
    fee: 0.21,
  },
  {
    time: '2022-02-07T19:28:59Z',
    referralLink: 'test2',
    referee: '22JS1jkvkLcdxhHo1LpWXUh6sTErkt54j1YaszYWZoCi',
    fee: 0.15,
  },
]

export default function Referral() {
  const { t } = useTranslation('common')
  const mangoGroup = useMangoStore(mangoGroupSelector)
  const mangoAccount = useMangoStore(mangoAccountSelector)
  const groupConfig = useMangoStore(mangoGroupConfigSelector)
  const client = useMangoStore(mangoClientSelector)
  const wallet = useMangoStore(walletSelector)
  const connected = useMangoStore((s) => s.wallet.connected)

  const [customRefLinkInput, setCustomRefLinkInput] = useState('')
  const [existingCustomRefLinks, setexistingCustomRefLinks] =
    useState<ReferrerIdRecord[]>()
  const [hasCopied, setHasCopied] = useState(null)
  const [showMoreInfoModal, setShowMoreInfoModal] = useState(false)
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  const [hasReferrals] = useState(true) // Placeholder to show/hide users referral stats
  const [loading, setLoading] = useState(false)
  const [inputError, setInputError] = useState('')
  const { width } = useViewport()
  const isMobile = width ? width < breakpoints.sm : false

  const fetchCustomReferralLinks = useCallback(async () => {
    setLoading(true)
    const referrerIds = await client.getReferrerIdsForMangoAccount(mangoAccount)

    setexistingCustomRefLinks(referrerIds)
    setLoading(false)
  }, [mangoAccount])

  useEffect(() => {
    if (mangoAccount) {
      fetchCustomReferralLinks()
    }
  }, [mangoAccount])

  useEffect(() => {
    let timer
    if (hasCopied) {
      timer = setTimeout(() => setHasCopied(null), 1000)
    }
    return () => {
      clearTimeout(timer)
    }
  }, [hasCopied])

  const onChangeRefIdInput = (value) => {
    const id = value.replace(/ /g, '')
    setCustomRefLinkInput(id)
    if (id.length > 32) {
      setInputError('Referral IDs must be less then 33 characters')
    } else {
      setInputError('')
    }
  }

  const validateRefIdInput = () => {
    if (customRefLinkInput.length >= 33) {
      setInputError('Referral IDs must be less then 33 characters')
    }
    if (customRefLinkInput.length === 0) {
      setInputError('Enter a referral ID')
    }
  }

  const submitRefLink = async () => {
    if (!inputError) {
      try {
        const txid = await client.registerReferrerId(
          mangoGroup,
          mangoAccount,
          wallet,
          customRefLinkInput
        )
        notify({
          txid,
          title: 'Custom referal link created',
        })
      } catch (e) {
        notify({
          type: 'error',
          title: 'Unable to create referral link',
          description: e.message,
          txid: e.txid,
        })
      }
    } else return
  }

  const handleCopyLink = (link, index) => {
    copyToClipboard(link)
    setHasCopied(index)
  }

  const mngoIndex = getMarketIndexBySymbol(groupConfig, 'MNGO')
  const hasRequiredMngo =
    mangoGroup && mangoAccount
      ? mangoAccount.deposits[mngoIndex].toNumber() > 10000
      : false
  const hasCustomRefLinks =
    existingCustomRefLinks && existingCustomRefLinks.length > 0

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="py-4 md:pb-4 md:pt-10">
          <h1 className={`mb-1 text-th-fgd-1 text-2xl font-semibold`}>
            Sow the Mango Seed
          </h1>
          <div className="flex flex-col sm:flex-row items-start">
            <p className="mb-0 mr-2 text-th-fgd-1">
              Earn 20% of the perp fees paid by anyone you refer. Plus, they get
              a 5% perp fee discount.
            </p>
            <LinkButton
              className="mt-1 sm:mt-0"
              onClick={() => setShowMoreInfoModal(true)}
            >
              More Info
            </LinkButton>
          </div>
        </div>
        <div className="bg-th-bkg-2 grid grid-cols-12 grid-flow-row gap-x-6 gap-y-8 p-4 sm:p-6 rounded-lg">
          {connected ? (
            mangoAccount ? (
              <>
                {hasReferrals ? (
                  <div className="col-span-12">
                    <h2 className="mb-4">Your Referrals</h2>
                    <div className="border-b border-th-bkg-4 sm:border-b-0 grid grid-cols-2 grid-row-flow sm:gap-6">
                      <div className="sm:border-b border-t border-th-bkg-4 col-span-2 sm:col-span-1 p-3 sm:p-4">
                        <div className="pb-0.5 text-th-fgd-3 text-xs sm:text-sm">
                          Total Earnings
                        </div>
                        <div className="font-bold text-th-fgd-1 text-xl sm:text-2xl">
                          $150.50
                        </div>
                      </div>
                      <div className="sm:border-b border-t border-th-bkg-4 col-span-2 sm:col-span-1 p-3 sm:p-4">
                        <div className="pb-0.5 text-th-fgd-3 text-xs sm:text-sm">
                          Total referrals
                        </div>
                        <div className="font-bold text-th-fgd-1 text-xl sm:text-2xl">
                          15
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
                <div className="col-span-12">
                  <div className="flex flex-col lg:flex-row lg:space-x-6 space-y-4 lg:space-y-0 w-full">
                    <div className="flex flex-col w-full">
                      <div className="flex items-center justify-between"></div>
                      {hasRequiredMngo ? (
                        <div className="bg-th-bkg-3 flex-1 p-6 rounded-md">
                          <h2 className="mb-4">Your Links</h2>
                          {!loading ? (
                            !hasCustomRefLinks ? (
                              <Table>
                                <thead>
                                  <TrHead>
                                    <Th>Link</Th>
                                    <Th>Copy Link</Th>
                                  </TrHead>
                                </thead>
                                <tbody>
                                  <TrBody>
                                    <Td>
                                      <div className="flex items-center">
                                        {!isMobile ? (
                                          <LinkIcon className="h-4 mr-1.5 w-4" />
                                        ) : null}
                                        <p className="mb-0 text-th-fgd-1">
                                          {isMobile
                                            ? abbreviateAddress(
                                                mangoAccount.publicKey
                                              )
                                            : `https://trade.mango.markets?ref=
                                      ${mangoAccount.publicKey.toString()}`}
                                        </p>
                                      </div>
                                    </Td>
                                    {/* <Td>5</Td> */}
                                    <Td className="flex items-center justify-end">
                                      <IconButton
                                        className={`flex-shrink-0 ${
                                          hasCopied === 1 && 'bg-th-green'
                                        }`}
                                        disabled={hasCopied}
                                        onClick={() =>
                                          handleCopyLink(
                                            `https://trade.mango.markets?ref=${mangoAccount.publicKey.toString()}`,
                                            1
                                          )
                                        }
                                      >
                                        {hasCopied === 1 ? (
                                          <CheckIcon className="h-5 w-5" />
                                        ) : (
                                          <DuplicateIcon className="h-4 w-4" />
                                        )}
                                      </IconButton>
                                    </Td>
                                  </TrBody>
                                </tbody>
                              </Table>
                            ) : (
                              <Table>
                                <thead>
                                  <TrHead>
                                    <Th>Link</Th>
                                    <Th>
                                      <div className="flex justify-end">
                                        Copy Link
                                      </div>
                                    </Th>
                                  </TrHead>
                                </thead>
                                <tbody>
                                  {existingCustomRefLinks.map(
                                    (customRefs, index) => (
                                      <TrBody key={customRefs.referrerId}>
                                        <Td>
                                          <div className="flex items-center">
                                            {!isMobile ? (
                                              <LinkIcon className="h-4 mr-1.5 w-4" />
                                            ) : null}
                                            <p className="mb-0 text-th-fgd-1">
                                              {isMobile
                                                ? customRefs.referrerId
                                                : `https://trade.mango.markets?ref=${customRefs.referrerId}`}
                                            </p>
                                          </div>
                                        </Td>
                                        {/* <Td>5</Td> */}
                                        <Td className="flex items-center justify-end">
                                          <IconButton
                                            className={`flex-shrink-0 ${
                                              hasCopied === index + 1 &&
                                              'bg-th-green'
                                            }`}
                                            disabled={hasCopied}
                                            onClick={() =>
                                              handleCopyLink(
                                                `https://trade.mango.markets?ref=${customRefs.referrerId}`,
                                                index + 1
                                              )
                                            }
                                          >
                                            {hasCopied === index + 1 ? (
                                              <CheckIcon className="h-5 w-5" />
                                            ) : (
                                              <DuplicateIcon className="h-4 w-4" />
                                            )}
                                          </IconButton>
                                        </Td>
                                      </TrBody>
                                    )
                                  )}
                                </tbody>
                              </Table>
                            )
                          ) : (
                            <div className="space-y-2">
                              <div className="animate-pulse bg-th-bkg-4 h-16" />
                              <div className="animate-pulse bg-th-bkg-4 h-16" />
                              <div className="animate-pulse bg-th-bkg-4 h-16" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-th-bkg-3 flex flex-col flex-1 items-center justify-center px-4 py-8 rounded-md text-center">
                          <MngoMonoIcon className="h-6 mb-2 text-th-fgd-2 w-6" />
                          <p className="mb-0">
                            You need 10,000 MNGO in your Mango Account
                          </p>

                          <Link href={'/?name=MNGO/USDC'} shallow={true}>
                            <a className="mt-4 px-6 py-2 bg-th-bkg-4 font-bold rounded-full text-th-fgd-1 hover:brightness-[1.15] hover:text-th-fgd-1 focus:outline-none">
                              Buy MNGO
                            </a>
                          </Link>
                        </div>
                      )}
                    </div>
                    {hasCustomRefLinks && existingCustomRefLinks.length < 5 ? (
                      <div className="bg-th-bkg-3 p-6 rounded-md w-full lg:w-1/3">
                        <h2 className="mb-1">Custom Referral ID</h2>
                        <p className="mb-4">
                          You can generate up to 5 custom IDs
                        </p>
                        <div className="pb-6">
                          <label className="block mb-2 text-th-fgd-3 text-xs">
                            Referral ID
                          </label>
                          <Input
                            className="bg-th-bkg-1 border border-th-fgd-4 default-transition font-bold pl-4 h-12 focus:outline-none rounded-md text-base tracking-wide w-full hover:border-th-primary focus:border-th-primary"
                            error={!!inputError}
                            type="text"
                            placeholder="ElonMusk"
                            onBlur={validateRefIdInput}
                            onChange={(e) => onChangeRefIdInput(e.target.value)}
                            value={customRefLinkInput}
                          />
                          {inputError ? (
                            <div className="pt-2">
                              <InlineNotification
                                type="error"
                                desc={inputError}
                              />
                            </div>
                          ) : null}
                        </div>
                        <button
                          className="bg-th-primary flex items-center justify-center text-th-bkg-1 text-sm px-4 py-2 rounded-full hover:brightness-[1.15] focus:outline-none disabled:bg-th-bkg-4 disabled:text-th-fgd-4 disabled:cursor-not-allowed disabled:hover:brightness-100"
                          onClick={submitRefLink}
                        >
                          <LinkIcon className="h-4 mr-1.5 w-4" />
                          Generate ID
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

                {referralHistory.length > 0 ? (
                  <div className="col-span-12">
                    <h2 className="mb-4">Earnings History</h2>
                    {!isMobile ? (
                      <Table>
                        <thead>
                          <TrHead>
                            <Th>{t('date')}</Th>
                            <Th>Referral ID</Th>
                            <Th>Referee</Th>
                            <Th>
                              <div className="flex justify-end">Fee Earned</div>
                            </Th>
                          </TrHead>
                        </thead>
                        <tbody>
                          {referralHistory.map((ref, index) => (
                            <TrBody key={ref.fee + index}>
                              <Td>
                                {dayjs(ref.time).format('DD MMM YYYY h:mma')}
                              </Td>
                              <Td>{ref.referralLink}</Td>
                              <Td>
                                <Link
                                  href={`/account?pubkey=${ref.referee}`}
                                  shallow={true}
                                >
                                  <a className="text-th-fgd-2 underline hover:no-underline hover:text-th-fgd-3">
                                    {abbreviateAddress(mangoAccount.publicKey)}
                                  </a>
                                </Link>
                              </Td>
                              <Td className="flex items-center justify-end">
                                ${ref.fee}
                              </Td>
                            </TrBody>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <>
                        <MobileTableHeader
                          colOneHeader={t('date')}
                          colTwoHeader="Fee Earned"
                        />
                        {referralHistory.map((ref, index) => (
                          <ExpandableRow
                            buttonTemplate={
                              <div className="flex items-center justify-between text-th-fgd-1 w-full">
                                <div>
                                  {dayjs(ref.time).format('DD MMM YYYY h:mma')}
                                </div>
                                <div className="text-right">${ref.fee}</div>
                              </div>
                            }
                            key={`${ref.fee + index}`}
                            index={index}
                            panelTemplate={
                              <>
                                <div className="grid grid-cols-2 grid-flow-row gap-4 pb-4">
                                  <div className="text-left">
                                    <div className="pb-0.5 text-th-fgd-3 text-xs">
                                      Referral ID
                                    </div>
                                    <div>{ref.referralLink}</div>
                                  </div>
                                  <div className="text-left">
                                    <div className="pb-0.5 text-th-fgd-3 text-xs">
                                      Referee
                                    </div>
                                    <Link
                                      href={`/account?pubkey=${ref.referee}`}
                                      shallow={true}
                                    >
                                      <a className="text-th-fgd-2 underline hover:no-underline hover:text-th-fgd-3">
                                        {abbreviateAddress(
                                          mangoAccount.publicKey
                                        )}
                                      </a>
                                    </Link>
                                  </div>
                                </div>
                              </>
                            }
                          />
                        ))}
                      </>
                    )}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="col-span-12">
                <EmptyState
                  buttonText={t('create-account')}
                  icon={<CurrencyDollarIcon />}
                  onClickButton={() => setShowAccountsModal(true)}
                  title={t('no-account-found')}
                />
              </div>
            )
          ) : (
            <div className="col-span-12">
              <EmptyState
                buttonText={t('connect')}
                icon={<LinkIcon />}
                onClickButton={() => wallet.connect()}
                title={t('connect-wallet')}
              />
            </div>
          )}
        </div>
      </PageBodyContainer>
      {showMoreInfoModal ? (
        <Modal
          isOpen={showMoreInfoModal}
          onClose={() => setShowMoreInfoModal(false)}
        >
          <h2 className="mb-4">Referral Program Details</h2>
          <ul className="list-disc pl-3">
            <li>
              Your referral code is automatically applied whenever your link is
              used to create an account.
            </li>
            <li>
              When any of your referrals trade Mango Perps, you earn 20% of
              their trade fees.
            </li>
            <li>
              Plus, for using your link they get a 5% discount off their Mango
              Perp fees.
            </li>
            <li>
              You must have at least 10,000 MNGO in your Mango Account to
              qualify for generating referrals and earning referral rewards.
            </li>
          </ul>
        </Modal>
      ) : null}
      {showAccountsModal ? (
        <AccountsModal
          onClose={() => setShowAccountsModal(false)}
          isOpen={showAccountsModal}
        />
      ) : null}
    </div>
  )
}
