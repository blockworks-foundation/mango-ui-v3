import EventEmitter from 'eventemitter3'
import { PublicKey, Transaction } from '@solana/web3.js'
import { notify } from '../../utils/notifications'
import { WalletAdapter } from '../../@types/types'

interface BitpieWallet {
  getAccount(): Promise<string>
  signTransaction(transaction: Transaction): Promise<Transaction>
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>
}

interface BitpieWalletWindow extends Window {
  bitpie?: BitpieWallet
}

declare const window: BitpieWalletWindow

export class BitpieWalletAdapter extends EventEmitter implements WalletAdapter {
  private _connecting: boolean
  private _wallet: BitpieWallet | null
  private _publicKey: PublicKey | null

  constructor() {
    super()
    this._connecting = false
    this._wallet = null
    this._publicKey = null
  }

  get publicKey(): PublicKey | null {
    return this._publicKey
  }

  get ready(): boolean {
    return typeof window !== 'undefined' && !!window.bitpie
  }

  get connecting(): boolean {
    return this._connecting
  }

  get connected(): boolean {
    return !!this._wallet
  }

  get autoApprove() {
    return true
  }

  async connect(): Promise<void> {
    try {
      if (this.connected || this.connecting) return
      this._connecting = true

      const wallet = typeof window !== 'undefined' && window.bitpie
      if (!wallet) return

      let account: string
      try {
        account = await wallet.getAccount()
      } catch (error: any) {
        notify({
          title: 'Connection Error',
          type: 'error',
          description:
            'Please install Bitpie wallet and then reload this page.',
        })
      }

      this._wallet = wallet
      this._publicKey = new PublicKey(account)

      this.emit('connect')
    } catch (error: any) {
      this.emit('error', error)
      throw error
    } finally {
      this._connecting = false
    }
  }

  async disconnect(): Promise<void> {
    if (this._wallet) {
      this._wallet = null
      this._publicKey = null
    }

    this.emit('disconnect')
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    try {
      const wallet = this._wallet
      if (!wallet) return

      return (await wallet.signTransaction(transaction)) || transaction
    } catch (error: any) {
      this.emit('error', error)
      throw error
    }
  }

  async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    try {
      const wallet = this._wallet
      if (!wallet) return

      return (await wallet.signAllTransactions(transactions)) || transactions
    } catch (error: any) {
      this.emit('error', error)
      throw error
    }
  }
}
