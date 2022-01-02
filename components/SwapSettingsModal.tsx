import { useState } from 'react'
import Modal from './Modal'
// import { useTranslation } from 'next-i18next'
import Button from './Button'
import ButtonGroup from './ButtonGroup'
import Input from './Input'

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
  // const { t } = useTranslation('common')
  const [tempSlippage, setTempSlippage] = useState(slippage)
  const [inputValue, setInputValue] = useState('')

  const handleSetTempSlippage = (s) => {
    setTempSlippage(s)
    setInputValue('')
  }

  const handleSave = () => {
    setSlippage(inputValue ? parseFloat(inputValue) : tempSlippage)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideClose>
      <Modal.Header>
        <h2 className="font-bold text-th-fgd-1 text-lg">Slippage Settings</h2>
      </Modal.Header>
      <div className="text-th-fgd-1 text-xs mb-2">Slippage</div>
      <ButtonGroup
        activeValue={tempSlippage.toString()}
        onChange={(v) => handleSetTempSlippage(v)}
        unit="%"
        values={['0.1', '0.5', '1', '2']}
      />
      <div className="mt-4 mb-6">
        <div className="text-th-fgd-1 text-xs mb-2">Custom</div>
        <Input
          type="text"
          className="w-full bg-th-bkg-1 focus:outline-none rounded"
          placeholder="0.00"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          suffix="%"
        />
      </div>
      <Button className="w-full" onClick={handleSave}>
        Save
      </Button>
    </Modal>
  )
}

export default SwapSettingsModal
