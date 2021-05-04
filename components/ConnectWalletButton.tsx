import styled from '@emotion/styled'
import useMangoStore from '../stores/useMangoStore'
import { WALLET_PROVIDERS, DEFAULT_PROVIDER } from '../hooks/useWallet'
import useLocalStorageState from '../hooks/useLocalStorageState'
import WalletSelect from './WalletSelect'
import { WalletIcon } from './icons'

const StyledWalletTypeLabel = styled.div`
  font-size: 0.6rem;
`

const ConnectWalletButton = () => {
  const wallet = useMangoStore((s) => s.wallet.current)
  const set = useMangoStore((s) => s.set)
  const [savedProviderUrl] = useLocalStorageState(
    'walletProvider',
    DEFAULT_PROVIDER.url
  )

  const handleWalletConect = () => {
    wallet.connect()
    set((state) => {
      state.selectedMarginAccount.initialLoad = true
    })
  }

  return (
    <div className="flex justify-between border border-th-primary rounded-md h-11 w-48">
      <button
        onClick={handleWalletConect}
        disabled={!wallet}
        className="text-th-primary hover:text-th-fgd-1 hover:bg-th-primary focus:outline-none disabled:text-th-fgd-4 disabled:cursor-wait rounded-r-none"
      >
        <div className="flex flex-row items-center px-2 justify-center h-full rounded-l default-transition hover:text-th-fgd-1">
          <WalletIcon className="w-5 h-5 mr-3 fill-current" />
          <div>
            <span className="whitespace-nowrap">Connect Wallet</span>
            <StyledWalletTypeLabel className="font-normal text-th-fgd-1 text-left leading-3">
              {WALLET_PROVIDERS.find((p) => p.url === savedProviderUrl)?.name}
            </StyledWalletTypeLabel>
          </div>
        </div>
      </button>
      <div className="relative h-full">
        <WalletSelect isPrimary />
      </div>
    </div>
  )
}

export default ConnectWalletButton
