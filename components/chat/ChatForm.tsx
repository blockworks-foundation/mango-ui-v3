import { PaperAirplaneIcon } from '@heroicons/react/solid'
import { useWallet } from '@solana/wallet-adapter-react'
import { IconButton } from 'components/Button'
import Input from 'components/Input'
import { useCallback, useState } from 'react'
import { MessageProps } from './Messages'

const ChatForm = ({
  messages,
  setLatestMessages,
}: {
  messages: MessageProps[]
  setLatestMessages: (x) => void
}) => {
  const [messageText, setMessageText] = useState('')
  const { publicKey } = useWallet()

  const validateMessageText = async (text) => {
    try {
      const response = await fetch(
        `https://www.purgomalum.com/service/json?text=${text}&fill_char=*`
      )
      const profanityCheck = await response.json()

      if (response.status === 200) {
        return profanityCheck.result
      }
    } catch {
      return
    }
  }

  const onSubmitMessage = async (e) => {
    e.preventDefault()
    const filteredMessageText = await validateMessageText(messageText)

    const message = {
      text: filteredMessageText ? filteredMessageText : messageText,
      timestamp: new Date().getTime(),
      user: 'Profile Name',
      walletPk: publicKey?.toString(),
    }
    const newMessages = [...messages, message]
    setLatestMessages(newMessages)
    setMessageText('')
  }

  const callbackRef = useCallback((inputElement) => {
    if (inputElement) {
      const timer = setTimeout(() => inputElement.focus(), 500)
      return () => clearTimeout(timer)
    }
  }, [])

  return (
    <form
      className="flex items-center border-t border-th-bkg-3"
      onSubmit={(e) => onSubmitMessage(e)}
    >
      <Input
        value={messageText}
        onChange={(e) => setMessageText(e.target.value)}
        className="w-full border-0 bg-th-bkg-1 p-3 focus:outline-none"
        placeholder="Write Something..."
        ref={callbackRef}
      />
      <IconButton className="mx-2 bg-transparent" type="submit">
        <PaperAirplaneIcon className="h-5 w-5 flex-shrink-0 rotate-90 transform" />
      </IconButton>
    </form>
  )
}

export default ChatForm
