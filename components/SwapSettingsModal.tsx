import { useEffect, useState } from 'react'
import Modal from './Modal'
import { useTranslation } from 'next-i18next'
import Button from './Button'
import ButtonGroup from './ButtonGroup'
import Input, { Label } from './Input'
import { LinkButton } from './Button'

const slippagePresets = ['0.1', '0.5', '1', '2']

const SwapSettingsModal = ({
  isOpen,
  onClose,
  slippage,
  setSlippage,
}: {
  isOpen: boolean
  onClose?: () => void
  slippage: number
  setSlippage: (x) => void
}) => {
  const { t } = useTranslation(['common', 'swap'])
  const [tempSlippage, setTempSlippage] = useState(slippage)
  const [inputValue, setInputValue] = useState(
    tempSlippage ? tempSlippage.toString() : ''
  )
  const [showCustomSlippageForm, setShowCustomSlippageForm] = useState(false)

  const handleSetTempSlippage = (s) => {
    setTempSlippage(s)
    setInputValue('')
  }

  const handleSave = () => {
    setSlippage(inputValue ? parseFloat(inputValue) : tempSlippage)
    onClose?.()
  }

  useEffect(() => {
    if (!slippagePresets.includes(tempSlippage.toString())) {
      setShowCustomSlippageForm(true)
    }
  }, [])

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideClose>
      <Modal.Header>
        <h2 className="text-lg font-bold text-th-fgd-1">
          {t('swap:slippage-settings')}
        </h2>
      </Modal.Header>
      <div className="flex justify-between">
        <Label>{t('swap:slippage')}</Label>
        <LinkButton
          className="mb-1.5"
          onClick={() => setShowCustomSlippageForm(!showCustomSlippageForm)}
        >
          {showCustomSlippageForm ? t('presets') : t('custom')}
        </LinkButton>
      </div>
      {showCustomSlippageForm ? (
        <Input
          type="text"
          placeholder="0.00"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          suffix="%"
        />
      ) : (
        <ButtonGroup
          activeValue={tempSlippage.toString()}
          className="h-10"
          onChange={(v) => handleSetTempSlippage(v)}
          unit="%"
          values={slippagePresets}
        />
      )}
      <Button className="mt-6 w-full" onClick={handleSave}>
        {t('save')}
      </Button>
    </Modal>
  )
}

export default SwapSettingsModal
