import { PublicKey } from '@solana/web3.js'
import Button from 'components/Button'
import Input from 'components/Input'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/solid'
import { useTranslation } from 'next-i18next'

export const MangoAccountLookup = () => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const [value, setValue] = useState('')
  const [isInvalid, setIsInvalid] = useState(false)

  const validatePubKey = (key: string) => {
    try {
      const pubkey = new PublicKey(key)
      return !!pubkey
    } catch (e) {
      return false
    }
  }

  const onClickSearch = () => {
    const isValid = validatePubKey(value)

    if (isValid) {
      const route = `/account?pubkey=${value}`
      setValue('')
      router.push(route)
    } else {
      setIsInvalid(true)
    }
  }

  return (
    <div className="flex w-full flex-col items-center text-th-fgd-1">
      <h2 className="mb-1 text-base">{t('mango-account-lookup-title')}</h2>
      <p className="mb-2 text-center">{t('mango-account-lookup-desc')}</p>
      <div className="w-full max-w-[360px] pt-2">
        <Input
          type="text"
          error={isInvalid ? 'is invalid' : ''}
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      {isInvalid && (
        <div className="flex items-center pt-1.5 text-th-red">
          <ExclamationCircleIcon className="mr-1.5 h-4 w-4" />
          {t('invalid-address')}
        </div>
      )}
      <div className="pt-4">
        <Button onClick={onClickSearch}>{t('view')}</Button>
      </div>
    </div>
  )
}
