import { MerpsAccount as MarginAccount } from '@blockworks-foundation/mango-client'
import { useEffect, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import Select from './Select'
import { abbreviateAddress } from '../utils'

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
    value || marginAccounts[0]
  )

  useEffect(() => {
    if (value) {
      setSelectedMarginAccount(value)
    }
  }, [value])

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
      value={
        <div className="text-left">
          {abbreviateAddress(selectedMarginAccount?.publicKey)}
        </div>
      }
      onChange={handleSelectMarginAccount}
      placeholder="Select Margin Account"
      className={className}
    >
      {marginAccounts.length ? (
        marginAccounts.map((ma, index) => (
          <Select.Option key={index} value={ma.publicKey.toString()}>
            {abbreviateAddress(ma.publicKey)}
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
