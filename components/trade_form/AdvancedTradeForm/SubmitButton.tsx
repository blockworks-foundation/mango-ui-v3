import React from 'react'
import Tooltip from 'components/Tooltip'
import Button from 'components/Button'
import { useTranslation } from 'next-i18next'
import useMangoStore from 'stores/useMangoStore'

export interface Props {
  canTrade: boolean
  disabled: boolean
  isPerpMarket: boolean
  sizeTooLarge: boolean
  onSubmit: () => void
  side: 'buy' | 'sell'
  baseSize: number | ''
}

export const SubmitButton: React.FC<Props> = ({
  canTrade,
  isPerpMarket,
  onSubmit,
  disabled,
  sizeTooLarge,
  side,
  baseSize,
}) => {
  const { t } = useTranslation('common')
  const marketConfig = useMangoStore((s) => s.selectedMarket.config)

  const isBuySide = side === 'buy'

  if (!canTrade) {
    return (
      <div className="flex-grow">
        <Tooltip content={t('country-not-allowed-tooltip')}>
          <div className="flex">
            <Button disabled className="flex-grow">
              <span>{t('country-not-allowed')}</span>
            </Button>
          </div>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className={`mt-3 flex`}>
      <button
        disabled={disabled}
        onClick={onSubmit}
        className={`flex-grow rounded-full px-6 py-2 font-bold text-white hover:brightness-[1.1] focus:outline-none disabled:cursor-not-allowed disabled:bg-th-bkg-4 disabled:text-th-fgd-4 disabled:hover:brightness-100 ${
          isBuySide ? 'bg-th-green-dark' : 'bg-th-red'
        }`}
      >
        {sizeTooLarge
          ? t('too-large')
          : isBuySide
          ? `${baseSize > 0 ? `${t('buy')} ` + baseSize : `${t('buy')} `} ${
              isPerpMarket ? marketConfig.name : marketConfig.baseSymbol
            }`
          : `${baseSize > 0 ? `${t('sell')} ` + baseSize : `${t('sell')} `} ${
              isPerpMarket ? marketConfig.name : marketConfig.baseSymbol
            }`}
      </button>
    </div>
  )
}
