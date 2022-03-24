import { PublicKey } from '@solana/web3.js'
import Button from 'components/Button'
import Input from 'components/Input'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import { ExclamationCircleIcon } from '@heroicons/react/outline'

export const MangoAccountSearch = () => {
  const router = useRouter()
  const [value, setValue] = useState('')
  const [isInvalid, setIsInvalid] = useState(false)

  const validatePubKey = (key: string) => {
    try {
      const pubkey = new PublicKey(key)
      return PublicKey.isOnCurve(pubkey.toBuffer())
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
    <div className="flex flex-col items-center rounded-lg px-4 pb-2 text-th-fgd-1 md:mt-6">
      <h2 className="mb-1 text-base">Search by Mango Account</h2>
      <p className="mb-2 text-center">
        Enter a Mango account address to show account details
      </p>
      <div className="w-[400px] p-1">
        <Input
          type="text"
          error={isInvalid}
          placeholder="Address"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      {isInvalid && (
        <div className="flex items-center pt-1.5 text-th-red">
          <ExclamationCircleIcon className="mr-1.5 h-4 w-4" />
          The address is invalid
        </div>
      )}
      <div className="pt-3 pb-2">
        <Button onClick={onClickSearch}>Search</Button>
      </div>
    </div>
  )
}
