import { useWallet } from '@solana/wallet-adapter-react'
import { LinkButton } from 'components/Button'
import { useCallback, useState } from 'react'
import ChatForm from './ChatForm'
import Messages, { MessageProps } from './Messages'
import { handleWalletConnect } from 'components/ConnectWalletButton'

const messages: MessageProps[] = [
  {
    text: 'hi',
    timestamp: 1657000692,
    user: 'sir huge kent',
    walletPk: '',
  },
  {
    text: 'yo',
    timestamp: 1657010592,
    user: 'lord ripe keitt',
    walletPk: 'E8fEXpzHwgYRgzeRnEw71HKNih7YKK19MJYKvCAHf5AU',
  },
  {
    text: 'GM',
    timestamp: 1657020492,
    user: 'sir huge kent',
    walletPk: 'E8fEXpzHwgYRgzeRnEw71HKNih7YKK19MJYKvCAHf5AU',
  },
  {
    text: 'gm',
    timestamp: 1657030392,
    user: 'lord ripe keitt',
    walletPk: 'E8fEXpzHwgYRgzeRnEw71HKNih7YKK19MJYKvCAHf5AU',
  },
  {
    text: 'hi',
    timestamp: 1657400692,
    user: 'sir huge kent',
    walletPk: 'E8fEXpzHwgYRgzeRnEw71HKNih7YKK19MJYKvCAHf5AU',
  },
  {
    text: 'yo',
    timestamp: 1657500592,
    user: 'lord ripe keitt',
    walletPk: 'E8fEXpzHwgYRgzeRnEw71HKNih7YKK19MJYKvCAHf5AU',
  },
  {
    text: 'GM',
    timestamp: 1657600492,
    user: 'sir huge kent',
    walletPk: 'E8fEXpzHwgYRgzeRnEw71HKNih7YKK19MJYKvCAHf5AU',
  },
  {
    text: 'gm',
    timestamp: 1657070392,
    user: 'lord ripe keitt',
    walletPk: 'E8fEXpzHwgYRgzeRnEw71HKNih7YKK19MJYKvCAHf5AU',
  },
]

const Chat = () => {
  const [latestMessages, setLatestMessages] = useState(messages)
  const { publicKey, wallet } = useWallet()

  const handleConnect = useCallback(() => {
    if (wallet) {
      handleWalletConnect(wallet)
    }
  }, [wallet])

  return (
    <div>
      <div className="thin-scroll mb-4 flex max-h-56 flex-col-reverse overflow-y-auto px-2">
        <Messages messages={latestMessages} />
      </div>
      {publicKey ? (
        <ChatForm
          messages={latestMessages}
          setLatestMessages={setLatestMessages}
        />
      ) : (
        <LinkButton
          className="flex h-[45px] w-full items-center justify-center rounded-none border-t border-th-bkg-3"
          onClick={handleConnect}
        >
          Connect to Chat
        </LinkButton>
      )}
      <div className="bg-th-bkg-2 px-3 py-0.5">
        <LinkButton className="mb-0 text-xxs font-normal no-underline">
          <span className="text-th-fgd-4">Content Policy</span>
        </LinkButton>
      </div>
    </div>
  )
}

export default Chat
