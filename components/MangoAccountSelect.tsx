import { MangoAccount } from '@blockworks-foundation/mango-client'
import { useEffect, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import Select from './Select'
import { abbreviateAddress } from '../utils'

type MangoAccountSelectProps = {
  className?: string
  onChange?: (x) => void
  value?: MangoAccount | null
  disabled?: boolean
}

const MangoAccountSelect = ({
  onChange,
  value,
  disabled = false,
  className = '',
}: MangoAccountSelectProps) => {
  const mangoAccounts = useMangoStore((s) => s.mangoAccounts)
  const [selectedMangoAccount, setSelectedMangoAccount] = useState(
    value || mangoAccounts[0]
  )

  useEffect(() => {
    if (value) {
      setSelectedMangoAccount(value)
    }
  }, [value])

  const handleSelectMangoAccount = (value) => {
    const mangoAccount = mangoAccounts.find(
      (ma) => ma.publicKey.toString() === value
    )
    setSelectedMangoAccount(mangoAccount)
    if (onChange) {
      onChange(mangoAccount)
    }
  }

  return (
    <Select
      disabled={disabled}
      value={
        <div className="text-left">
          {abbreviateAddress(selectedMangoAccount?.publicKey)}
        </div>
      }
      onChange={handleSelectMangoAccount}
      placeholder="Select Margin Account"
      className={className}
    >
      {mangoAccounts.length ? (
        mangoAccounts.map((ma, index) => (
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

export default MangoAccountSelect
