import { MangoAccount, TokenAccount } from '@blockworks-foundation/mango-client'
import { PublicKey } from '@solana/web3.js'
import useMangoStore from '../stores/useMangoStore'

export async function deposit({
  amount,
  fromTokenAcc,
  mangoAccount,
  accountName,
}: {
  amount: number
  fromTokenAcc: TokenAccount
  mangoAccount?: MangoAccount
  accountName?: string
}) {
  const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
  const wallet = useMangoStore.getState().wallet.current
  const tokenIndex = mangoGroup.getTokenIndex(fromTokenAcc.mint)
  const mangoClient = useMangoStore.getState().connection.client
  const referrer = useMangoStore.getState().ref

  if (mangoAccount) {
    return await mangoClient.deposit(
      mangoGroup,
      mangoAccount,
      wallet,
      mangoGroup.tokens[tokenIndex].rootBank,
      mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].publicKey,
      mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].vault,
      fromTokenAcc.publicKey,
      Number(amount)
    )
  } else {
    const existingAccounts = await mangoClient.getMangoAccountsForOwner(
      mangoGroup,
      wallet.publicKey,
      false
    )
    return await mangoClient.createMangoAccountAndDeposit(
      mangoGroup,
      wallet,
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
}: {
  amount: number
  token: PublicKey
  allowBorrow: boolean
}) {
  const mangoAccount = useMangoStore.getState().selectedMangoAccount.current
  const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
  const wallet = useMangoStore.getState().wallet.current
  const tokenIndex = mangoGroup.getTokenIndex(token)
  const mangoClient = useMangoStore.getState().connection.client

  return await mangoClient.withdraw(
    mangoGroup,
    mangoAccount,
    wallet,
    mangoGroup.tokens[tokenIndex].rootBank,
    mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].publicKey,
    mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].vault,
    Number(amount),
    allowBorrow
  )
}
