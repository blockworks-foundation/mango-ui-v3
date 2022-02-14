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
import Button from '../components/Button'
import { copyToClipboard } from '../utils'
import Input from '../components/Input'
import { notify } from '../utils/notifications'
import {
  getMarketIndexBySymbol,
  ReferrerIdRecord,
} from '@blockworks-foundation/mango-client'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      // Will be passed to the page component as props
    },
  }
}

export default function Referral() {
  const mangoGroup = useMangoStore(mangoGroupSelector)
  const mangoAccount = useMangoStore(mangoAccountSelector)
  const groupConfig = useMangoStore(mangoGroupConfigSelector)
  const client = useMangoStore(mangoClientSelector)
  const wallet = useMangoStore(walletSelector)

  const [customRefLinkInput, setCustomRefLinkInput] = useState('')
  const [existingCustomRefLInks, setExistingCustomRefLinks] =
    useState<ReferrerIdRecord[]>()

  const fetchCustomReferralLinks = useCallback(async () => {
    const referrerIds = await client.getReferrerIdsForMangoAccount(mangoAccount)

    setExistingCustomRefLinks(referrerIds)
  }, [mangoAccount])

  useEffect(() => {
    if (mangoAccount) {
      fetchCustomReferralLinks()
    }
  }, [mangoAccount])

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

  const mngoIndex = getMarketIndexBySymbol(groupConfig, 'MNGO')
  const hasRequiredMngo =
    mangoGroup && mangoAccount
      ? mangoAccount.deposits[mngoIndex].toNumber() > 10000
      : false
  const hasCustomRefLinks =
    existingCustomRefLInks && existingCustomRefLInks.length > 0

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="bg-th-bkg-2 overflow-none p-4 sm:p-6 rounded-lg mt-10 md:mt-12">
          {mangoGroup ? <div>Referrals</div> : null}
          <div className="mt-4">
            <ul>
              <li>
                Share your referral link with others. When your referee uses
                your link to create an account, your referral code will be
                automatically applied.
              </li>
              <li>
                Whenever your referee trades, you will receive 20% of their perp
                fees.
              </li>
              <li>
                Anyone who uses your referral link, will receive a 5% discount
                on their perp fees.
              </li>
              <li>
                You will need 10,000 MNGO tokens in your Mango Account to
                qualify
              </li>
              <li></li>
            </ul>
          </div>
          <div className="mt-4"></div>
          {hasRequiredMngo ? (
            <div>
              {mangoAccount ? (
                <div>
                  Your ref link:{' '}
                  <a>
                    https://trade.mango.markets?ref=
                    {mangoAccount.publicKey.toString()}
                  </a>
                  <Button
                    className="ml-4"
                    onClick={() =>
                      copyToClipboard(
                        `https://trade.mango.markets?ref=${mangoAccount.publicKey.toString()}`
                      )
                    }
                  >
                    Copy
                  </Button>
                </div>
              ) : (
                <div>Connect wallet to see your referral link</div>
              )}
              <div className="mt-4">
                <div>Generate a custom referral link</div>
                <div className="flex items-center">
                  <div className="grow whitespace-nowrap">
                    trade.mango.markets?ref=
                  </div>
                  <Input
                    type="text"
                    placeholder="ElonMusk"
                    onChange={(e) => setCustomRefLinkInput(e.target.value)}
                    value={customRefLinkInput}
                  />
                  <Button onClick={submitRefLink}>Submit</Button>
                </div>
              </div>
            </div>
          ) : null}
          <div>
            {hasCustomRefLinks
              ? existingCustomRefLInks.map((customRefs) => {
                  return (
                    <div key={customRefs.referrerId}>
                      <div className="flex items-center">
                        <div>{`https://trade.mango.markets?ref=${customRefs.referrerId}`}</div>
                        <div>
                          <Button
                            className="ml-4"
                            onClick={() =>
                              copyToClipboard(
                                `https://trade.mango.markets?ref=${customRefs.referrerId}`
                              )
                            }
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })
              : null}
          </div>
        </div>
      </PageBodyContainer>
    </div>
  )
}
