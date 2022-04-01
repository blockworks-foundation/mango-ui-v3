import Button, { LinkButton } from 'components/Button'
import ButtonGroup from 'components/ButtonGroup'
import Input from 'components/Input'
import { useTranslation } from 'next-i18next'
import React, { useState } from 'react'

interface Props {
  isMobile: boolean
  onSave: () => void
  setMaxSlippagePercentage: (x) => void
  maxSlippagePercentage: number | null
}

export const EditMaxSlippage: React.FC<Props> = ({
  isMobile,
  onSave,
  maxSlippagePercentage,
  setMaxSlippagePercentage,
}) => {
  const { t } = useTranslation('common')
  const [showCustomSlippageForm, setShowCustomSlippageForm] = useState(false)
  const slippagePresets = ['1', '1.5', '2', '2.5', '3']

  return (
    <div className="flex items-end">
      <div className="w-full">
        <div className="mb-1 flex justify-between">
          <div className="text-xs text-th-fgd-3">{t('max-slippage')}</div>
          {!isMobile ? (
            <LinkButton
              className="text-xs font-normal"
              onClick={() => setShowCustomSlippageForm(!showCustomSlippageForm)}
            >
              {showCustomSlippageForm ? t('presets') : t('custom')}
            </LinkButton>
          ) : null}
        </div>
        {showCustomSlippageForm || isMobile ? (
          <Input
            type="number"
            min="0"
            max="100"
            onChange={(e) => setMaxSlippagePercentage(e.target.value)}
            suffix={<div className="text-base font-bold text-th-fgd-3">%</div>}
            value={maxSlippagePercentage}
          />
        ) : (
          <ButtonGroup
            activeValue={
              maxSlippagePercentage ? maxSlippagePercentage.toString() : ''
            }
            className="h-10"
            onChange={(p) => setMaxSlippagePercentage(p)}
            unit="%"
            values={slippagePresets}
          />
        )}
      </div>
      <Button className="ml-3 h-10" onClick={onSave}>
        {t('save')}
      </Button>
    </div>
  )
}
