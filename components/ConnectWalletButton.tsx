import { useEffect, useState } from 'react'
import styled from '@emotion/styled'
import useMangoStore from '../stores/useMangoStore'
import { Menu } from '@headlessui/react'
import { DuplicateIcon, LinkIcon, LogoutIcon } from '@heroicons/react/outline'
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/solid'
import { WALLET_PROVIDERS, DEFAULT_PROVIDER } from '../hooks/useWallet'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { abbreviateAddress, copyToClipboard } from '../utils'
import WalletSelect from './WalletSelect'
import { WalletIcon } from './icons'

const StyledWalletTypeLabel = styled.div`
  font-size: 0.65rem;
`

const StyledWalletButtonWrapper = styled.div`
  width: 196px;
`

const Code = styled.code`
  border: 1px solid hsla(0, 0%, 39.2%, 0.2);
  border-radius: 3px;
  background: hsla(0, 0%, 58.8%, 0.1);
  font-size: 0.75rem;
`

const WALLET_OPTIONS = [
  { name: 'Copy address', icon: <DuplicateIcon /> },
  { name: 'Disconnect', icon: <LogoutIcon /> },
]

const ConnectWalletButton = () => {
  const wallet = useMangoStore((s) => s.wallet.current)
  const connected = useMangoStore((s) => s.wallet.connected)
  const set = useMangoStore((s) => s.set)
  const [isCopied, setIsCopied] = useState(false)
  const [savedProviderUrl] = useLocalStorageState(
    'walletProvider',
    DEFAULT_PROVIDER.url
  )

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  const handleWalletMenu = (option) => {
    if (option === 'Copy address') {
      copyToClipboard(wallet.publicKey)
      setIsCopied(true)
    } else {
      wallet.disconnect()
    }
  }

  const handleWalletConect = () => {
    wallet.connect()
    set((state) => {
      state.selectedMarginAccount.initialLoad = true
    })
  }

  return (
    <StyledWalletButtonWrapper className="h-14">
      {connected && wallet?.publicKey ? (
        <Menu>
          {({ open }) => (
            <div className="relative h-full">
              <Menu.Button className="h-full w-full px-3 bg-th-bkg-1 rounded-none focus:outline-none text-th-primary hover:text-th-fgd-1">
                <div className="flex flex-row items-center justify-between">
                  <div className="flex items-center">
                    <WalletIcon className="w-4 h-4 mr-3 text-th-green fill-current" />
                    <Code className="p-1 text-th-fgd-3 font-light">
                      {isCopied
                        ? 'Copied!'
                        : abbreviateAddress(wallet.publicKey)}
                    </Code>
                  </div>
                  <div className="pl-2">
                    {open ? (
                      <ChevronUpIcon className="h-4 w-4" />
                    ) : (
                      <ChevronDownIcon className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </Menu.Button>
              <Menu.Items className="z-20 mt-1 p-1 absolute right-0 md:transform md:-translate-x-1/2 md:left-1/2 bg-th-bkg-1 divide-y divide-th-bkg-3 shadow-lg outline-none rounded-md w-36">
                {WALLET_OPTIONS.map(({ name, icon }) => (
                  <Menu.Item key={name}>
                    <button
                      className="flex flex-row font-normal items-center rounded-none w-full p-2 hover:bg-th-bkg-2 hover:cursor-pointer focus:outline-none"
                      onClick={() => handleWalletMenu(name)}
                    >
                      <div className="w-4 h-4 mr-2">{icon}</div>
                      {name}
                    </button>
                  </Menu.Item>
                ))}
              </Menu.Items>
            </div>
          )}
        </Menu>
      ) : (
        <div className="bg-th-bkg-1 h-full flex divide-x divide-th-bkg-3 justify-between">
          <button
            onClick={handleWalletConect}
            disabled={!wallet}
            className="rounded-none text-th-primary hover:bg-th-primary focus:outline-none disabled:text-th-fgd-4 disabled:cursor-wait"
          >
            <div className="flex flex-row items-center px-3 justify-center h-full default-transition hover:text-th-bkg-1">
              <WalletIcon className="w-4 h-4 mr-2 fill-current" />
              <div>
                <div className="mb-0.5 whitespace-nowrap">Connect Wallet</div>
                <StyledWalletTypeLabel className="font-normal text-th-fgd-4 text-left leading-3 tracking-wider">
                  {
                    WALLET_PROVIDERS.find((p) => p.url === savedProviderUrl)
                      ?.name
                  }
                </StyledWalletTypeLabel>
              </div>
            </div>
          </button>
          <div className="relative h-full">
            <WalletSelect isPrimary />
          </div>
        </div>
      )}
    </StyledWalletButtonWrapper>
  )
}

export default ConnectWalletButton
