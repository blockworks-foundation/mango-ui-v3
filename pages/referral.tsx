import { useEffect, useState, useCallback } from 'react'
import PageBodyContainer from '../components/PageBodyContainer'
import TopBar from '../components/TopBar'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import useMangoStore from '../stores/useMangoStore'
import {
  mangoCacheSelector,
  mangoClientSelector,
  mangoGroupConfigSelector,
  mangoGroupSelector,
  walletSelector,
} from '../stores/selectors'
import Button, { IconButton } from '../components/Button'
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
import { Table, Td, Th, TrBody, TrHead } from '../components/TableElements'
import dayjs from 'dayjs'
import AccountsModal from '../components/AccountsModal'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from '../components/TradePageGrid'
import { ExpandableRow } from '../components/TableElements'
import MobileTableHeader from '../components/mobile/MobileTableHeader'
import Input, { Label } from '../components/Input'
import InlineNotification from '../components/InlineNotification'
import useMangoAccount from '../hooks/useMangoAccount'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'referrals'])),
      // Will be passed to the page component as props
    },
  }
}

const referralHistory = []
// [
//   {
//     time: '2022-02-09T19:28:59Z',
//     referralLink: 'test2',
//     referee: '22JS1jkvkLcdxhHo1LpWXUh6sTErkt54j1YaszYWZoCi',
//     fee: 0.22,
//   },
//   {
//     time: '2022-02-08T19:28:59Z',
//     referralLink: 'test2',
//     referee: '22JS1jkvkLcdxhHo1LpWXUh6sTErkt54j1YaszYWZoCi',
//     fee: 0.21,
//   },
//   {
//     time: '2022-02-07T19:28:59Z',
//     referralLink: 'test2',
//     referee: '22JS1jkvkLcdxhHo1LpWXUh6sTErkt54j1YaszYWZoCi',
//     fee: 0.15,
//   },
// ]

const ProgramDetails = () => {
  const { t } = useTranslation('referrals')
  return (
    <>
      <h2 className="mb-4">{t('referrals:program-details')}</h2>
      <ul className="list-disc pl-3">
        <li>{t('referrals:program-details-1')}</li>
        <li>{t('referrals:program-details-2')}</li>
        <li>{t('referrals:program-details-3')}</li>
        <li>{t('referrals:program-details-4')}</li>
      </ul>
    </>
  )
}

export default function Referral() {
  const { t } = useTranslation(['common', 'referrals'])
  const mangoGroup = useMangoStore(mangoGroupSelector)
  const mangoCache = useMangoStore(mangoCacheSelector)
  const { mangoAccount } = useMangoAccount()
  const groupConfig = useMangoStore(mangoGroupConfigSelector)
  const client = useMangoStore(mangoClientSelector)
  const wallet = useMangoStore(walletSelector)
  const connected = useMangoStore((s) => s.wallet.connected)

  const [customRefLinkInput, setCustomRefLinkInput] = useState('')
  const [existingCustomRefLinks, setexistingCustomRefLinks] = useState<
    ReferrerIdRecord[]
  >([])
  const [hasCopied, setHasCopied] = useState(null)
  const [showAccountsModal, setShowAccountsModal] = useState(false)
  // const [hasReferrals] = useState(false) // Placeholder to show/hide users referral stats
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
      setInputError(t('referrals:too-long-error'))
    } else {
      setInputError('')
    }
  }

  const validateRefIdInput = () => {
    if (customRefLinkInput.length >= 33) {
      setInputError(t('referrals:too-long-error'))
    }
    if (customRefLinkInput.length === 0) {
      setInputError(t('referrals:enter-referral-id'))
    }
  }

  const submitRefLink = async () => {
    let encodedRefLink: string
    try {
      encodedRefLink = encodeURIComponent(customRefLinkInput)
    } catch (e) {
      notify({
        type: 'error',
        title: 'Invalid custom referral link',
      })
    }

    if (!inputError) {
      try {
        const txid = await client.registerReferrerId(
          mangoGroup,
          mangoAccount,
          wallet,
          encodedRefLink
        )
        notify({
          txid,
          title: t('referrals:link-created'),
        })
        fetchCustomReferralLinks()
      } catch (e) {
        notify({
          type: 'error',
          title: t('referrals:link-not-created'),
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
      ? mangoAccount
          .getUiDeposit(
            mangoCache.rootBankCache[mngoIndex],
            mangoGroup,
            mngoIndex
          )
          .toNumber() >= 10000
      : false
  const hasCustomRefLinks =
    existingCustomRefLinks && existingCustomRefLinks.length > 0

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="py-4 md:pb-4 md:pt-10">
          <h1 className={`mb-1`}>{t('referrals:sow-seed')}</h1>
          <div className="flex flex-col sm:flex-row items-start">
            <p className="mb-0 mr-2">{t('referrals:earn-16')}</p>
          </div>
        </div>
        <div className="bg-th-bkg-2 grid grid-cols-12 grid-flow-row gap-x-6 gap-y-8 p-4 sm:p-6 rounded-lg">
          {connected ? (
            mangoAccount ? (
              <>
                {/* {hasReferrals ? (
                  <div className="col-span-12">
                    <h2 className="mb-4">{t('referrals:your-referrals')}</h2>
                    <div className="border-b border-th-bkg-4 sm:border-b-0 grid grid-cols-2 grid-row-flow sm:gap-6">
                      <div className="sm:border-b border-t border-th-bkg-4 col-span-2 sm:col-span-1 p-3 sm:p-4">
                        <div className="pb-0.5 text-th-fgd-3 text-xs sm:text-sm">
                          {t('referrals:total-earnings')}
                        </div>
                        <div className="font-bold text-th-fgd-1 text-xl sm:text-2xl">
                          $150.50
                        </div>
                      </div>
                      <div className="sm:border-b border-t border-th-bkg-4 col-span-2 sm:col-span-1 p-3 sm:p-4">
                        <div className="pb-0.5 text-th-fgd-3 text-xs sm:text-sm">
                          {t('referrals:total-referrals')}
                        </div>
                        <div className="font-bold text-th-fgd-1 text-xl sm:text-2xl">
                          15
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null} */}
                <div className="col-span-12">
                  <div className="flex flex-col xl:flex-row xl:space-x-6 space-y-4 xl:space-y-0 w-full">
                    <div className="min-w-[25%] bg-th-bkg-3 flex-1 p-6 rounded-md">
                      <ProgramDetails />
                    </div>
                    <div className="flex flex-col w-full">
                      {hasRequiredMngo ? (
                        <div className="bg-th-bkg-3 flex-1 p-6 rounded-md">
                          <h2 className="mb-4">{t('referrals:your-links')}</h2>
                          {!loading ? (
                            !hasCustomRefLinks ? (
                              <Table>
                                <thead>
                                  <TrHead>
                                    <Th>{t('referrlals:link')}</Th>
                                    <Th>{t('referrlals:copy-link')}</Th>
                                  </TrHead>
                                </thead>
                                <tbody>
                                  <TrBody>
                                    <Td>
                                      <div className="flex items-center">
                                        {!isMobile ? (
                                          <LinkIcon className="h-4 mr-1.5 w-4" />
                                        ) : null}
                                        <p className="mb-0 text-th-fgd-1 max-w-md">
                                          {isMobile
                                            ? abbreviateAddress(
                                                mangoAccount.publicKey
                                              )
                                            : `https://trade.mango.markets?ref=${mangoAccount.publicKey.toString()}`}
                                        </p>
                                      </div>
                                    </Td>
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
                                    <Th>{t('referrals:link')}</Th>
                                    <Th>
                                      <div className="flex justify-end">
                                        {t('referrals:copy-link')}
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
                          <p className="mb-0">{t('referrals:10k-mngo')}</p>

                          <Link href={'/?name=MNGO/USDC'} shallow={true}>
                            <a className="mt-4 px-6 py-2 bg-th-bkg-button font-bold rounded-full text-th-fgd-1 hover:brightness-[1.15] hover:text-th-fgd-1 focus:outline-none">
                              {t('referrals:buy-mngo')}
                            </a>
                          </Link>
                        </div>
                      )}
                    </div>
                    {hasRequiredMngo ? (
                      <div className="min-w-[25%] bg-th-bkg-3 p-6 rounded-md w-full xl:w-1/3">
                        <h2 className="mb-1">{t('referrals:custom-links')}</h2>
                        <p className="mb-4">
                          {t('referrals:custom-links-limit')}
                        </p>
                        <div className="pb-6">
                          <Label>{t('referrals:referral-id')}</Label>
                          <Input
                            error={!!inputError}
                            type="text"
                            placeholder="ElonMusk"
                            onBlur={validateRefIdInput}
                            onChange={(e) => onChangeRefIdInput(e.target.value)}
                            value={customRefLinkInput}
                            disabled={existingCustomRefLinks.length === 5}
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
                        <Button
                          onClick={submitRefLink}
                          disabled={existingCustomRefLinks.length === 5}
                        >
                          <div className="flex items-center">
                            <LinkIcon className="h-4 mr-1.5 w-4" />
                            {t('referrals:generate-link')}
                          </div>
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>

                {referralHistory.length > 0 ? (
                  <div className="col-span-12">
                    <h2 className="mb-4">{t('referrals:earnings-history')}</h2>
                    {!isMobile ? (
                      <Table>
                        <thead>
                          <TrHead>
                            <Th>{t('date')}</Th>
                            <Th>{t('referrals:referral-id')}</Th>
                            <Th>{t('referrals:referee')}</Th>
                            <Th>
                              <div className="flex justify-end">
                                {t('referrals:fee-earned')}
                              </div>
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
                          colTwoHeader={t('referrals:fee-eanred')}
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
                                      {t('referrals:referral-id')}
                                    </div>
                                    <div>{ref.referralLink}</div>
                                  </div>
                                  <div className="text-left">
                                    <div className="pb-0.5 text-th-fgd-3 text-xs">
                                      {t('referrals:referee')}
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
              <>
                <div className="col-span-12 lg:col-span-4 bg-th-bkg-3 p-6 rounded-md">
                  <ProgramDetails />
                </div>
                <div className="col-span-12 lg:col-span-8 bg-th-bkg-3 p-6 rounded-md flex items-center justify-center">
                  <EmptyState
                    buttonText={t('create-account')}
                    icon={<CurrencyDollarIcon />}
                    onClickButton={() => setShowAccountsModal(true)}
                    title={t('no-account-found')}
                  />
                </div>
              </>
            )
          ) : (
            <>
              <div className="col-span-12 lg:col-span-4 bg-th-bkg-3 p-6 rounded-md">
                <ProgramDetails />
              </div>
              <div className="col-span-12 lg:col-span-8 bg-th-bkg-3 p-6 rounded-md flex items-center justify-center">
                <EmptyState
                  buttonText={t('connect')}
                  icon={<LinkIcon />}
                  onClickButton={() => wallet.connect()}
                  title={t('connect-wallet')}
                />
              </div>
            </>
          )}
        </div>
      </PageBodyContainer>
      {showAccountsModal ? (
        <AccountsModal
          onClose={() => setShowAccountsModal(false)}
          isOpen={showAccountsModal}
        />
      ) : null}
    </div>
  )
}
