import { MangoAccount } from '@blockworks-foundation/mango-client'
import { useEffect, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import Select from './Select'
import { abbreviateAddress } from '../utils'
import { useTranslation } from 'next-i18next'

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
  const { t } = useTranslation('common')
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
    if (!mangoAccount) {
      return
    }
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
      placeholder={t('select-margin')}
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
          {t('no-margin')}
        </Select.Option>
      )}
    </Select>
  )
}

export default MangoAccountSelect
