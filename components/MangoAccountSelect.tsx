import { MangoAccount } from '@blockworks-foundation/mango-client'
import { useEffect, useMemo, useState } from 'react'
import useMangoStore from '../stores/useMangoStore'
import Select from './Select'
import { abbreviateAddress } from '../utils'
import { useTranslation } from 'next-i18next'
import { useWallet } from '@solana/wallet-adapter-react'

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
  const { publicKey } = useWallet()
  const { t } = useTranslation('common')
  const mangoAccounts = useMangoStore((s) => s.mangoAccounts)
  const mangoAccountsWithoutDelegates = useMemo(() => {
    return mangoAccounts.filter((ma) => {
      return publicKey && ma?.owner?.equals(publicKey) ? true : false
    })
  }, [mangoAccounts, publicKey])
  const [selectedMangoAccount, setSelectedMangoAccount] = useState(
    value || mangoAccountsWithoutDelegates[0]
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
          <p className="mb-0 font-bold text-th-fgd-2">
            {selectedMangoAccount?.name
              ? selectedMangoAccount.name
              : t('account')}
          </p>
          <p className="mb-0 text-xs">
            {abbreviateAddress(selectedMangoAccount?.publicKey)}
          </p>
        </div>
      }
      onChange={handleSelectMangoAccount}
      placeholder={t('select-margin')}
      className={className}
    >
      {mangoAccounts.length ? (
        mangoAccountsWithoutDelegates.map((ma, index) => (
          <Select.Option key={index} value={ma.publicKey.toString()}>
            <div className="text-left">
              <span
                className={`mb-0 font-bold ${
                  value?.publicKey.toString() === ma.publicKey.toString()
                    ? 'text-th-primary'
                    : ''
                }`}
              >
                {ma?.name ? ma.name : t('account')}
              </span>
              <p className="mb-0 text-xs">{abbreviateAddress(ma?.publicKey)}</p>
            </div>
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
