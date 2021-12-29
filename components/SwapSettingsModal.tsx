import { useState } from 'react'
import Modal from './Modal'
// import { useTranslation } from 'next-i18next'
import Button from './Button'

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
        <div className="text-th-fgd-1 text-lg">Slippage Settings</div>
      </Modal.Header>
      <div className="flex items-center justify-between text-th-fgd-3">
        <button
          className={`bg-th-bkg-1 py-4 px-10 focus:outline-none transition-none ${
            tempSlippage === 0.1 ? 'border border-th-primary' : ''
          }`}
          onClick={() => handleSetTempSlippage(0.1)}
        >
          0.1%
        </button>
        <button
          className={`bg-th-bkg-1 py-4 px-10 focus:outline-none transition-none ${
            tempSlippage === 0.5 ? 'border border-th-primary' : ''
          }`}
          onClick={() => handleSetTempSlippage(0.5)}
        >
          0.5%
        </button>
        <button
          className={`bg-th-bkg-1 py-4 px-10 focus:outline-none transition-none ${
            tempSlippage === 1 ? 'border border-th-primary' : ''
          }`}
          onClick={() => handleSetTempSlippage(1)}
        >
          1%
        </button>
      </div>
      <div className="text-th-fgd-3 mt-3">Custom</div>
      <div className="flex mt-1 items-center text-th-fgd-3">
        <input
          type="text"
          className="text-right w-full bg-th-bkg-1 focus:outline-none px-4 py-3 rounded"
          placeholder="0.00"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        <div className="text-xl ml-2">%</div>
      </div>
      <div className="flex mt-4">
        <Button className="w-full" onClick={handleSave}>
          Save
        </Button>
      </div>
    </Modal>
  )
}

export default SwapSettingsModal
