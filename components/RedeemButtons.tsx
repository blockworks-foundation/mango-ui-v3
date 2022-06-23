import React, { useMemo, useState } from 'react'
import { settleAllPnl, settlePosPnl } from 'components/MarketPosition'
import Button from 'components/Button'
import { useTranslation } from 'next-i18next'
import Loading from 'components/Loading'
import useMangoStore from 'stores/useMangoStore'
import { useWallet } from '@solana/wallet-adapter-react'

const RedeemButtons: React.FC = () => {
  const { t } = useTranslation('common')
  const [settling, setSettling] = useState(false)
  const { wallet } = useWallet()
  const [settlingPosPnl, setSettlingPosPnl] = useState(false)
  const unsettledPositions =
    useMangoStore.getState().selectedMangoAccount.unsettledPerpPositions
  const unsettledPositivePositions = useMangoStore
    .getState()
    .selectedMangoAccount.unsettledPerpPositions?.filter(
      (p) => p.unsettledPnl > 0
    )

  const handleSettleAll = async () => {
    if (!wallet) return
    setSettling(true)
    try {
      await settleAllPnl(
        unsettledPositions.map((p) => p.perpMarket),
        t,
        undefined,
        wallet
      )
    } finally {
      setSettling(false)
    }
  }

  const handleSettlePosPnl = async () => {
    if (!wallet) return
    setSettlingPosPnl(true)
    try {
      await settlePosPnl(
        unsettledPositivePositions.map((p) => p.perpMarket),
        t,
        undefined,
        wallet
      )
    } finally {
      setSettlingPosPnl(false)
    }
  }

  const showPosOnlyButton = useMemo(() => {
    return (
      unsettledPositions.find((pos) => pos.unsettledPnl > 0) &&
      unsettledPositions.find((pos) => pos.unsettledPnl < 0)
    )
  }, [unsettledPositions])

  return unsettledPositions?.length ? (
    <div className="flex space-x-3">
      {showPosOnlyButton ? (
        <Button
          className="flex h-7 items-center justify-center pt-0 pb-0 pl-3 pr-3 text-xs"
          onClick={handleSettlePosPnl}
        >
          {settlingPosPnl ? <Loading /> : t('redeem-positive')}
        </Button>
      ) : null}
      <Button
        className="flex h-7 items-center justify-center pt-0 pb-0 pl-3 pr-3 text-xs"
        onClick={handleSettleAll}
      >
        {settling ? <Loading /> : t('redeem-all')}
      </Button>
    </div>
  ) : null
}

export default RedeemButtons
