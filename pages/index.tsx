import React, { useEffect } from 'react'
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
import { actionsSelector, marketConfigSelector } from '../stores/selectors'
import { PublicKey } from '@solana/web3.js'
import dayjs from 'dayjs'
import { tokenPrecision } from 'utils'
import AccountIntro from 'components/AccountIntro'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'delegate',
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
  const setMangoStore = useMangoStore((s) => s.set)
  const marketConfig = useMangoStore(marketConfigSelector)
  const actions = useMangoStore(actionsSelector)
  const router = useRouter()
  const [savedLanguage] = useLocalStorageState('language', '')
  const { pubkey } = router.query

  useEffect(() => {
    dayjs.locale(savedLanguage == 'zh_tw' ? 'zh-tw' : savedLanguage)
  })

  useEffect(() => {
    async function loadUnownedMangoAccount() {
      if (!pubkey) return
      try {
        const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
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
  }, [pubkey])

  useEffect(() => {
    const name = decodeURIComponent(router.asPath).split('name=')[1]
    const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
    const groupConfig = useMangoStore.getState().selectedMangoGroup.config

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
      <TradePageGrid />
      {!alphaAccepted && (
        <AlphaModal isOpen={!alphaAccepted} onClose={() => {}} />
      )}

      <AccountIntro />
    </>
  )
}

export default PerpMarket
