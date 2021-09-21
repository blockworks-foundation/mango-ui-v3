import { PublicKey, Transaction } from '@solana/web3.js'
import bs58 from 'bs58'
import EventEmitter from 'events'
import { WalletAdapter } from '../../@types/types'
import { notify } from '../notifications'

interface SlopeWallet {
  connect(): Promise<{
    msg: string
    data: {
      publicKey?: string
    }
  }>
  disconnect(): Promise<{ msg: string }>
  signTransaction(message: string): Promise<{
    msg: string
    data: {
      publicKey?: string
      signature?: string
    }
  }>
  signAllTransactions(messages: string[]): Promise<{
    msg: string
    data: {
      publicKey?: string
      signatures?: string[]
    }
  }>
}

interface SlopeWindow extends Window {
  Slope?: {
    new (): SlopeWallet
  }
}

declare const window: SlopeWindow

export class SlopeWalletAdapter extends EventEmitter implements WalletAdapter {
  private _connecting: boolean
  private _wallet: SlopeWallet | null
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
    return typeof window !== 'undefined' && !!window.Slope
  }

  get connecting(): boolean {
    return this._connecting
  }

  get connected(): boolean {
    return !!this._publicKey
  }

  get autoApprove() {
    return true
  }

  async connect(): Promise<void> {
    try {
      if (this.connected || this.connecting) return
      this._connecting = true

      const wallet = new window.Slope()
      const { data } = await wallet.connect()
      this._wallet = wallet
      this._publicKey = new PublicKey(data.publicKey)

      this.emit('connect')
    } catch (error: any) {
      notify({
        title: 'Connection Error',
        type: 'error',
        description: 'Please install Slope wallet and then reload this page.',
      })
    } finally {
      this._connecting = false
    }
  }

  async disconnect(): Promise<void> {
    const wallet = this._wallet
    if (wallet) {
      this._wallet = null
      this._publicKey = null
      await wallet.disconnect()
      this.emit('disconnect')
    }
  }

  async signTransaction(transaction: Transaction): Promise<Transaction> {
    const wallet = this._wallet
    const message = bs58.encode(transaction.serializeMessage())
    const { data } = await wallet.signTransaction(message)
    const publicKey = new PublicKey(data.publicKey)
    const signature = bs58.decode(data.signature)

    transaction.addSignature(publicKey, signature)
    return transaction
  }

  async signAllTransactions(
    transactions: Transaction[]
  ): Promise<Transaction[]> {
    const wallet = this._wallet
    const messages = transactions.map((transaction) =>
      bs58.encode(transaction.serializeMessage())
    )
    const { data } = await wallet.signAllTransactions(messages)

    const length = transactions.length
    const publicKey = new PublicKey(data.publicKey)

    for (let i = 0; i < length; i++) {
      transactions[i].addSignature(publicKey, bs58.decode(data.signatures[i]))
    }

    return transactions
  }
}
