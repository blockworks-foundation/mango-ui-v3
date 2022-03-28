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
  const tokenIndex = mangoGroup?.getTokenIndex(fromTokenAcc.mint)
  const mangoClient = useMangoStore.getState().connection.client
  const referrer = useMangoStore.getState().referrerPk

  if (typeof tokenIndex !== 'number') {
    return
  }

  const mangoGroupPublicKey =
    mangoGroup?.rootBankAccounts?.[tokenIndex]?.nodeBankAccounts[0].publicKey
  const vault =
    mangoGroup?.rootBankAccounts?.[tokenIndex]?.nodeBankAccounts[0].vault

  if (!mangoGroup || !mangoGroupPublicKey || !vault) return

  if (mangoAccount) {
    return await mangoClient.deposit(
      mangoGroup,
      mangoAccount,
      wallet,
      mangoGroup.tokens[tokenIndex].rootBank,
      mangoGroupPublicKey,
      vault,
      fromTokenAcc.publicKey,
      Number(amount)
    )
  } else {
    const existingAccounts = await mangoClient.getMangoAccountsForOwner(
      mangoGroup,
      wallet.publicKey,
      false
    )
    console.log('in deposit and create, referrer is', referrer)
    return await mangoClient.createMangoAccountAndDeposit(
      mangoGroup,
      wallet,
      mangoGroup.tokens[tokenIndex].rootBank,
      mangoGroupPublicKey,
      vault,
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

  const publicKey =
    mangoGroup?.rootBankAccounts?.[tokenIndex]?.nodeBankAccounts[0].publicKey
  const vault =
    mangoGroup?.rootBankAccounts?.[tokenIndex]?.nodeBankAccounts[0].vault

  if (
    mangoGroup &&
    mangoAccount &&
    wallet &&
    vault &&
    publicKey &&
    mangoGroup.rootBankAccounts[tokenIndex]?.nodeBankAccounts?.[0].vault !==
      undefined
  ) {
    return await mangoClient.withdraw(
      mangoGroup,
      mangoAccount,
      wallet,
      mangoGroup.tokens[tokenIndex].rootBank,
      publicKey,
      vault,
      Number(amount),
      allowBorrow
    )
  }
}
