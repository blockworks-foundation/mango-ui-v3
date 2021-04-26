import { MarginAccount } from '@blockworks-foundation/mango-client'
import { useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import Select from './Select'

type MarginAccountSelectProps = {
  className?: string
  onChange?: (x) => void
  value?: MarginAccount | null
  disabled?: boolean
}

const MarginAccountSelect = ({
  onChange,
  value,
  disabled = false,
  className = '',
}: MarginAccountSelectProps) => {
  const marginAccounts = useMangoStore((s) => s.marginAccounts)
  const [selectedMarginAccount, setSelectedMarginAccount] = useState(
    value || null
  )

  const handleSelectMarginAccount = (value) => {
    const marginAccount = marginAccounts.find(
      (ma) => ma.publicKey.toString() === value
    )
    setSelectedMarginAccount(marginAccount)
    if (onChange) {
      onChange(marginAccount)
    }
  }

  return (
    <Select
      disabled={disabled}
      value={selectedMarginAccount?.publicKey.toString()}
      onChange={handleSelectMarginAccount}
      placeholder="Select Margin Account"
      className={className}
    >
      {marginAccounts.length ? (
        marginAccounts.map((ma, index) => (
          <Select.Option key={index} value={ma.publicKey.toString()}>
            {ma.publicKey.toString()}
          </Select.Option>
        ))
      ) : (
        <Select.Option value className="text-th-fgd-4">
          No Margin Accounts Found
        </Select.Option>
      )}
    </Select>
  )
}

export default MarginAccountSelect
