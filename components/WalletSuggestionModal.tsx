import { useWallet } from '@solana/wallet-adapter-react'
import React from 'react'
import Modal from './Modal'

interface Props {
  onClose: () => void
  isOpen: boolean
}

export const WalletSuggestionModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { wallets } = useWallet()

  console.log('wallets', wallets)
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div></div>
    </Modal>
  )
}
