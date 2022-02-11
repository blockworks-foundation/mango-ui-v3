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
import { copyToClipboard } from '../utils'
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

  const submitRefLink = async () => {
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
          <div className="flex">
            <p className="mb-0 mr-2 text-th-fgd-1">
              Earn 20% of the perp trading fees paid by anyone you refer.
            </p>
            <LinkButton onClick={() => setShowMoreInfoModal(true)}>
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
                    <div className="grid grid-cols-2 grid-row-flow gap-6">
                      <div className="border-b border-t border-th-bkg-4 col-span-1 p-3 sm:p-4">
                        <div className="pb-0.5 text-th-fgd-3 text-xs sm:text-sm">
                          Total Earnings
                        </div>
                        <div className="font-bold text-th-fgd-1 text-xl sm:text-2xl">
                          $150.50
                        </div>
                      </div>
                      <div className="border-b border-t border-th-bkg-4 col-span-1 p-3 sm:p-4">
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
                  <div className="flex space-x-6 w-full">
                    {hasCustomRefLinks && existingCustomRefLinks.length < 5 ? (
                      <div className="bg-th-bkg-3 p-6 rounded-md w-1/3">
                        <h2 className="mb-1">Custom Referral ID</h2>
                        <p className="mb-4">
                          You can generate up to 5 custom IDs
                        </p>
                        <div className="pb-6">
                          <label className="block mb-2 text-th-fgd-3 text-xs">
                            Referral ID
                          </label>
                          <input
                            className="bg-th-bkg-1 border border-th-fgd-4 default-transition font-bold pl-4 h-12 focus:outline-none rounded-md text-base tracking-wide w-full hover:border-th-primary focus:border-th-primary"
                            type="text"
                            placeholder="ElonMusk"
                            onChange={(e) =>
                              setCustomRefLinkInput(e.target.value)
                            }
                            value={customRefLinkInput}
                          />
                        </div>
                        <button
                          className="bg-th-primary flex items-center justify-center text-th-bkg-1 text-sm px-4 py-2 rounded-full hover:brightness-[1.15] focus:outline-none disabled:bg-th-bkg-4 disabled:text-th-fgd-4 disabled:cursor-not-allowed disabled:hover:brightness-100"
                          onClick={submitRefLink}
                        >
                          <LinkIcon className="h-4 mr-1.5 w-4" />
                          Generate Referral ID
                        </button>
                      </div>
                    ) : null}

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
                                    <Th>Copy</Th>
                                  </TrHead>
                                </thead>
                                <tbody>
                                  <TrBody>
                                    <Td>
                                      https://trade.mango.markets?ref=
                                      {mangoAccount.publicKey.toString()}
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
                                        Copy
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
                                            <LinkIcon className="h-4 mr-1.5 w-4" />
                                            <p className="mb-0 text-th-fgd-1">
                                              {`https://trade.mango.markets?ref=${customRefs.referrerId}`}
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
                        <div className="bg-th-bkg-3 flex flex-col flex-1 items-center justify-center py-8 rounded-md">
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
                  </div>
                </div>

                {referralHistory.length > 0 ? (
                  <div className="col-span-12">
                    <h2 className="mb-4">{t('history')}</h2>
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
                                  {ref.referee}
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
