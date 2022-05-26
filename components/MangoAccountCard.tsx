import { MangoAccount, MangoGroup } from '@blockworks-foundation/mango-client'
import {
  ArrowSmDownIcon,
  ArrowSmUpIcon,
  HeartIcon,
  UsersIcon,
} from '@heroicons/react/outline'
import { useWallet } from '@solana/wallet-adapter-react'
import { useTranslation } from 'next-i18next'
import useMangoStore from 'stores/useMangoStore'
import { abbreviateAddress } from 'utils'
import Tooltip from './Tooltip'

export const numberCurrencyCompacter = Intl.NumberFormat('en-us', {
  notation: 'compact',
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
})

const MangoAccountCard = ({
  mangoAccount,
  pnl,
}: {
  mangoAccount: MangoAccount
  pnl?: number
}) => {
  const { t } = useTranslation('common')
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const { publicKey } = useWallet()
  return (
    <div>
      <p className="mb-1 flex items-center font-bold text-th-fgd-1">
        {pnl ? (
          <a
            className="default-transition text-th-fgd-1 hover:text-th-fgd-3"
            href={`https://trade.mango.markets/account?pubkey=${mangoAccount.publicKey.toString()}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {mangoAccount?.name || abbreviateAddress(mangoAccount.publicKey)}
          </a>
        ) : (
          <span>
            {mangoAccount?.name || abbreviateAddress(mangoAccount.publicKey)}
          </span>
        )}
        {publicKey && !mangoAccount?.owner.equals(publicKey) ? (
          <Tooltip content={t('delegate:delegated-account')}>
            <UsersIcon className="ml-1.5 h-3 w-3 text-th-fgd-3" />
          </Tooltip>
        ) : (
          ''
        )}
      </p>
      {mangoGroup && (
        <div className="text-xs text-th-fgd-3">
          <AccountInfo
            mangoGroup={mangoGroup}
            mangoAccount={mangoAccount}
            pnl={pnl}
          />
        </div>
      )}
    </div>
  )
}

export default MangoAccountCard

const AccountInfo = ({
  mangoGroup,
  mangoAccount,
  pnl,
}: {
  mangoGroup: MangoGroup
  mangoAccount: MangoAccount
  pnl?: number
}) => {
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)
  if (!mangoCache) {
    return null
  }
  const accountEquity = mangoAccount.computeValue(mangoGroup, mangoCache)
  const health = mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Maint')

  return (
    <div className="flex items-center text-xs text-th-fgd-3">
      {numberCurrencyCompacter.format(accountEquity.toNumber())}
      <span className="pl-2 pr-1 text-th-fgd-4">|</span>
      {pnl ? (
        <span
          className={`flex items-center ${
            pnl < 0 ? 'text-th-red' : 'text-th-green'
          }`}
        >
          {pnl < 0 ? (
            <ArrowSmDownIcon className="mr-0.5 h-4 w-4" />
          ) : (
            <ArrowSmUpIcon className="mr-0.5 h-4 w-4" />
          )}
          {numberCurrencyCompacter.format(pnl)}
        </span>
      ) : (
        <span
          className={`flex items-center ${
            Number(health) < 15
              ? 'text-th-red'
              : Number(health) < 30
              ? 'text-th-orange'
              : 'text-th-green'
          }`}
        >
          <HeartIcon className="mr-0.5 h-4 w-4" />
          {Number(health) > 100 ? '>100' : health.toFixed(0)}%
        </span>
      )}
    </div>
  )
}
