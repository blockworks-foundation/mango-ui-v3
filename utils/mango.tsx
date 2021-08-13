import { MangoAccount, TokenAccount } from '@blockworks-foundation/mango-client'
import { PublicKey } from '@solana/web3.js'
import useMangoStore, { mangoClient } from '../stores/useMangoStore'

export async function deposit({
  amount,
  fromTokenAcc,
  mangoAccount,
}: {
  amount: number
  fromTokenAcc: TokenAccount
  mangoAccount?: MangoAccount
}) {
  const mangoGroup = useMangoStore.getState().selectedMangoGroup.current
  const wallet = useMangoStore.getState().wallet.current
  const tokenIndex = mangoGroup.getTokenIndex(fromTokenAcc.mint)
  console.log('starting')

  if (mangoAccount) {
    console.log('1')

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
    console.log('2')

    return await mangoClient.initMangoAccountAndDeposit(
      mangoGroup,
      wallet,
      mangoGroup.tokens[tokenIndex].rootBank,
      mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].publicKey,
      mangoGroup.rootBankAccounts[tokenIndex].nodeBankAccounts[0].vault,
      fromTokenAcc.publicKey,
      Number(amount)
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
