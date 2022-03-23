import { MangoAccount, TokenAccount } from '@blockworks-foundation/mango-client'
import { Wallet } from '@solana/wallet-adapter-react'
import { PublicKey } from '@solana/web3.js'
import useMangoStore from '../stores/useMangoStore'

export async function deposit({
  amount,
  fromTokenAcc,
  mangoAccount,
  accountName,
  wallet,
}: {
  amount: number
  fromTokenAcc: TokenAccount
  mangoAccount?: MangoAccount
  accountName?: string
  wallet: Wallet
}) {
  const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
  const tokenIndex = mangoGroup.getTokenIndex(fromTokenAcc.mint)
  const mangoClient = useMangoStore.getState().connection.client
  const referrer = useMangoStore.getState().referrerPk

  if (mangoAccount) {
    return await mangoClient.deposit(
      mangoGroup,
      mangoAccount,
      wallet?.adapter,
      mangoGroup.tokens[tokenIndex].rootBank,
      mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].publicKey,
      mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].vault,
      fromTokenAcc.publicKey,
      Number(amount)
    )
  } else {
    const existingAccounts = await mangoClient.getMangoAccountsForOwner(
      mangoGroup,
      wallet?.adapter?.publicKey,
      false
    )
    console.log('in deposit and create, referrer is', referrer)
    return await mangoClient.createMangoAccountAndDeposit(
      mangoGroup,
      wallet?.adapter,
      mangoGroup.tokens[tokenIndex].rootBank,
      mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].publicKey,
      mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].vault,
      fromTokenAcc.publicKey,
      Number(amount),
      existingAccounts.length,
      accountName,
      referrer
    )
  }
}

export async function withdraw({
  amount,
  token,
  allowBorrow,
  wallet,
}: {
  amount: number
  token: PublicKey
  allowBorrow: boolean
  wallet: Wallet
}) {
  const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
  const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
  const tokenIndex = mangoGroup.getTokenIndex(token)
  const mangoClient = useMangoStore.getState().connection.client

  return await mangoClient.withdraw(
    mangoGroup,
    mangoAccount,
    wallet?.adapter,
    mangoGroup.tokens[tokenIndex].rootBank,
    mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].publicKey,
    mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].vault,
    Number(amount),
    allowBorrow
  )
}
