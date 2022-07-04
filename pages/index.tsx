import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import useMangoStore, { serumProgramId } from '../stores/useMangoStore'
import {
  getMarketByBaseSymbolAndKind,
  getMarketIndexBySymbol,
} from '@blockworks-foundation/mango-client'
import TradePageGrid from '../components/TradePageGrid'
import useLocalStorageState from '../hooks/useLocalStorageState'
import AlphaModal, { ALPHA_MODAL_KEY } from '../components/AlphaModal'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import IntroTips, { SHOW_TOUR_KEY } from '../components/IntroTips'
import { useViewport } from '../hooks/useViewport'
import { breakpoints } from '../components/TradePageGrid'
import {
  actionsSelector,
  mangoAccountSelector,
  marketConfigSelector,
} from '../stores/selectors'
import { PublicKey } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import AccountsModal from 'components/AccountsModal'
import dayjs from 'dayjs'
import { tokenPrecision } from 'utils'

const DISMISS_CREATE_ACCOUNT_KEY = 'show-create-account'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'tv-chart',
        'alerts',
        'share-modal',
        'profile',
      ])),
      // Will be passed to the page component as props
    },
  }
}

const PerpMarket: React.FC = () => {
  const [alphaAccepted] = useLocalStorageState(ALPHA_MODAL_KEY, false)
  const [showTour] = useLocalStorageState(SHOW_TOUR_KEY, false)
  const [dismissCreateAccount, setDismissCreateAccount] = useLocalStorageState(
    DISMISS_CREATE_ACCOUNT_KEY,
    false
  )
  const [showCreateAccount, setShowCreateAccount] = useState(false)
  const { connected } = useWallet()
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const setMangoStore = useMangoStore((s) => s.set)
  const mangoAccount = useMangoStore(mangoAccountSelector)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const marketConfig = useMangoStore(marketConfigSelector)
  const actions = useMangoStore(actionsSelector)
  const router = useRouter()
  const [savedLanguage] = useLocalStorageState('language', '')
  const { pubkey } = router.query
  const { width } = useViewport()
  const hideTips = width ? width < breakpoints.md : false

  useEffect(() => {
    dayjs.locale(savedLanguage == 'zh_tw' ? 'zh-tw' : savedLanguage)
  })

  useEffect(() => {
    if (connected && !mangoAccount && !dismissCreateAccount) {
      setShowCreateAccount(true)
    }
  }, [connected, mangoAccount])

  const handleCloseCreateAccount = useCallback(() => {
    setShowCreateAccount(false)
    setDismissCreateAccount(true)
  }, [])

  useEffect(() => {
    async function loadUnownedMangoAccount() {
      if (!pubkey) return
      try {
        const unownedMangoAccountPubkey = new PublicKey(pubkey)
        const mangoClient = useMangoStore.getState().connection.client
        if (mangoGroup) {
          const unOwnedMangoAccount = await mangoClient.getMangoAccount(
            unownedMangoAccountPubkey,
            serumProgramId
          )

          setMangoStore((state) => {
            state.selectedMangoAccount.current = unOwnedMangoAccount
            state.selectedMangoAccount.initialLoad = false
          })
          actions.fetchTradeHistory()
          actions.reloadOrders()
          // setResetOnLeave(true)
        }
      } catch (error) {
        router.push('/account')
      }
    }

    if (pubkey) {
      loadUnownedMangoAccount()
    }
  }, [pubkey, mangoGroup])

  useEffect(() => {
    const name = decodeURIComponent(router.asPath).split('name=')[1]
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current

    let marketQueryParam, marketBaseSymbol, marketType, newMarket, marketIndex
    if (name && groupConfig) {
      marketQueryParam = name.toString().split(/-|\//)
      marketBaseSymbol = marketQueryParam[0]
      marketType = marketQueryParam[1]?.includes('PERP') ? 'perp' : 'spot'

      newMarket = getMarketByBaseSymbolAndKind(
        groupConfig,
        marketBaseSymbol.toUpperCase(),
        marketType
      )
      marketIndex = getMarketIndexBySymbol(
        groupConfig,
        marketBaseSymbol.toUpperCase()
      )

      if (!newMarket?.baseSymbol) {
        router.push('/')
        return
      }
    }

    if (newMarket?.name === marketConfig?.name) return

    if (name && mangoGroup) {
      const mangoCache = useMangoStore.getState().selectedMangoGroup.cache
      setMangoStore((state) => {
        state.selectedMarket.kind = marketType
        if (newMarket.name !== marketConfig.name) {
          state.selectedMarket.config = newMarket
          state.tradeForm.price = mangoCache
            ? parseFloat(
                mangoGroup.getPrice(marketIndex, mangoCache).toFixed(2)
              )
            : ''
          if (state.tradeForm.quoteSize) {
            state.tradeForm.baseSize = Number(
              (
                state.tradeForm.quoteSize / Number(state.tradeForm.price)
              ).toFixed(tokenPrecision[newMarket.baseSymbol])
            )
          }
        }
      })
    } else if (name && marketConfig) {
      // if mangoGroup hasn't loaded yet, set the marketConfig to the query param if different
      if (newMarket.name !== marketConfig.name) {
        setMangoStore((state) => {
          state.selectedMarket.kind = marketType
          state.selectedMarket.config = newMarket
        })
      }
    }
  }, [router, marketConfig])

  return (
    <>
      {showTour && !hideTips ? (
        <IntroTips connected={connected} mangoAccount={mangoAccount} />
      ) : null}
      <TradePageGrid />
      {!alphaAccepted && (
        <AlphaModal isOpen={!alphaAccepted} onClose={() => {}} />
      )}
      {showCreateAccount ? (
        <AccountsModal
          isOpen={showCreateAccount}
          onClose={() => handleCloseCreateAccount()}
        />
      ) : null}
    </>
  )
}

export default PerpMarket
