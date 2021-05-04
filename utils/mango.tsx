import {
  createAccountInstruction,
  nativeToUi,
  uiToNative,
  zeroKey,
} from '@blockworks-foundation/mango-client/lib/utils'
import {
  Account,
  Connection,
  PublicKey,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  TransactionInstruction,
  TransactionSignature,
} from '@solana/web3.js'
import Wallet from '@project-serum/sol-wallet-adapter'
import {
  MangoGroup,
  MangoSrmAccountLayout,
  MarginAccount,
  MarginAccountLayout,
} from '@blockworks-foundation/mango-client'
import {
  encodeMangoInstruction,
  NUM_MARKETS,
  NUM_TOKENS,
} from '@blockworks-foundation/mango-client/lib/layout'
import {
  makeBorrowInstruction,
  makeSettleBorrowInstruction,
  makeSettleFundsInstruction,
  makeWithdrawInstruction,
} from '@blockworks-foundation/mango-client/lib/instruction'
import { sendTransaction } from './send'
import { TOKEN_PROGRAM_ID } from './tokens'
import BN from 'bn.js'
import {
  getFeeRates,
  getFeeTier,
  Market,
  OpenOrders,
} from '@project-serum/serum'
import { Order } from '@project-serum/serum/lib/market'
import { SRM_DECIMALS } from '@project-serum/serum/lib/token-instructions'
import { MangoSrmAccount } from '@blockworks-foundation/mango-client/lib/client'
import { capitalize } from './index'

export const DEFAULT_MANGO_GROUP = 'BTC_ETH_USDT'

export async function initMarginAccount(
  connection: Connection,
  programId: PublicKey,
  mangoGroup: MangoGroup,
  wallet: Wallet
): Promise<PublicKey> {
  // Create a Solana account for the MarginAccount and allocate space
  const accInstr = await createAccountInstruction(
    connection,
    wallet.publicKey,
    MarginAccountLayout.span,
    programId
  )

  // Specify the accounts this instruction takes in (see program/src/instruction.rs)
  const keys = [
    { isSigner: false, isWritable: false, pubkey: mangoGroup.publicKey },
    { isSigner: false, isWritable: true, pubkey: accInstr.account.publicKey },
    { isSigner: true, isWritable: false, pubkey: wallet.publicKey },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_RENT_PUBKEY },
  ]

  // Encode and create instruction for actual initMarginAccount instruction
  const data = encodeMangoInstruction({ InitMarginAccount: {} })
  const initMarginAccountInstruction = new TransactionInstruction({
    keys,
    data,
    programId,
  })

  // Add all instructions to one atomic transaction
  const transaction = new Transaction()
  transaction.add(accInstr.instruction)
  transaction.add(initMarginAccountInstruction)

  // Specify signers in addition to the wallet
  const signers = [accInstr.account]

  const functionName = 'InitMarginAccount'
  const sendingMessage = `Sending ${functionName} instruction...`
  const successMessage = `${functionName} instruction success`

  await sendTransaction({
    transaction,
    wallet,
    signers,
    connection,
    sendingMessage,
    successMessage,
  })

  return accInstr.account.publicKey
}

export async function deposit(
  connection: Connection,
  programId: PublicKey,
  mangoGroup: MangoGroup,
  marginAccount: MarginAccount,
  wallet: Wallet,
  token: PublicKey,
  tokenAcc: PublicKey,

  quantity: number
): Promise<TransactionSignature> {
  const tokenIndex = mangoGroup.getTokenIndex(token)
  const nativeQuantity = uiToNative(
    quantity,
    mangoGroup.mintDecimals[tokenIndex]
  )

  const keys = [
    { isSigner: false, isWritable: true, pubkey: mangoGroup.publicKey },
    { isSigner: false, isWritable: true, pubkey: marginAccount.publicKey },
    { isSigner: true, isWritable: false, pubkey: wallet.publicKey },
    { isSigner: false, isWritable: true, pubkey: tokenAcc },
    {
      isSigner: false,
      isWritable: true,
      pubkey: mangoGroup.vaults[tokenIndex],
    },
    { isSigner: false, isWritable: false, pubkey: TOKEN_PROGRAM_ID },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_CLOCK_PUBKEY },
  ]
  const data = encodeMangoInstruction({
    Deposit: { quantity: nativeQuantity },
  })

  const instruction = new TransactionInstruction({ keys, data, programId })

  const transaction = new Transaction()
  transaction.add(instruction)

  // settle borrow
  const settleKeys = [
    { isSigner: false, isWritable: true, pubkey: mangoGroup.publicKey },
    { isSigner: false, isWritable: true, pubkey: marginAccount.publicKey },
    { isSigner: true, isWritable: false, pubkey: wallet.publicKey },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_CLOCK_PUBKEY },
  ]
  const setttleBorrowsData = encodeMangoInstruction({
    SettleBorrow: { tokenIndex: new BN(tokenIndex), quantity: nativeQuantity },
  })
  const settleBorrowsInstruction = new TransactionInstruction({
    keys: settleKeys,
    data: setttleBorrowsData,
    programId,
  })
  transaction.add(settleBorrowsInstruction)
  const signers = []

  const functionName = 'Deposit'
  const sendingMessage = `Sending ${functionName} instruction...`
  const successMessage = `${functionName} instruction success`
  return await sendTransaction({
    transaction,
    wallet,
    signers,
    connection,
    sendingMessage,
    successMessage,
  })
}

export async function initMarginAccountAndDeposit(
  connection: Connection,
  programId: PublicKey,
  mangoGroup: MangoGroup,
  wallet: Wallet,
  token: PublicKey,
  tokenAcc: PublicKey,
  quantity: number
): Promise<Array<any>> {
  // Create a Solana account for the MarginAccount and allocate spac

  const accInstr = await createAccountInstruction(
    connection,
    wallet.publicKey,
    MarginAccountLayout.span,
    programId
  )

  // Specify the accounts this instruction takes in (see program/src/instruction.rs)
  const keys = [
    { isSigner: false, isWritable: false, pubkey: mangoGroup.publicKey },
    { isSigner: false, isWritable: true, pubkey: accInstr.account.publicKey },
    { isSigner: true, isWritable: false, pubkey: wallet.publicKey },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_RENT_PUBKEY },
  ]

  // Encode and create instruction for actual initMarginAccount instruction
  const data = encodeMangoInstruction({ InitMarginAccount: {} })
  const initMarginAccountInstruction = new TransactionInstruction({
    keys,
    data,
    programId,
  })

  // Add all instructions to one atomic transaction
  const transaction = new Transaction()
  transaction.add(accInstr.instruction)
  transaction.add(initMarginAccountInstruction)

  const tokenIndex = mangoGroup.getTokenIndex(token)
  const nativeQuantity = uiToNative(
    quantity,
    mangoGroup.mintDecimals[tokenIndex]
  )

  const depositKeys = [
    { isSigner: false, isWritable: true, pubkey: mangoGroup.publicKey },
    { isSigner: false, isWritable: true, pubkey: accInstr.account.publicKey },
    { isSigner: true, isWritable: false, pubkey: wallet.publicKey },
    { isSigner: false, isWritable: true, pubkey: tokenAcc },
    {
      isSigner: false,
      isWritable: true,
      pubkey: mangoGroup.vaults[tokenIndex],
    },
    { isSigner: false, isWritable: false, pubkey: TOKEN_PROGRAM_ID },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_CLOCK_PUBKEY },
  ]
  const depositData = encodeMangoInstruction({
    Deposit: { quantity: nativeQuantity },
  })

  const instruction = new TransactionInstruction({
    keys: depositKeys,
    data: depositData,
    programId,
  })
  transaction.add(instruction)

  // Specify signers in addition to the wallet
  const signers = [accInstr.account]
  const functionName = 'InitMarginAccount'
  const sendingMessage = `Sending ${functionName} instruction...`
  const successMessage = `${functionName} instruction success`

  const trxHash = await sendTransaction({
    transaction,
    wallet,
    signers,
    connection,
    sendingMessage,
    successMessage,
  })
  return [accInstr.account, trxHash]
}

export async function withdraw(
  connection: Connection,
  programId: PublicKey,
  mangoGroup: MangoGroup,
  marginAccount: MarginAccount,
  wallet: Wallet,
  token: PublicKey,
  tokenAcc: PublicKey,

  quantity: number
): Promise<TransactionSignature> {
  const tokenIndex = mangoGroup.getTokenIndex(token)
  const nativeQuantity = uiToNative(
    quantity,
    mangoGroup.mintDecimals[tokenIndex]
  )

  const keys = [
    { isSigner: false, isWritable: true, pubkey: mangoGroup.publicKey },
    { isSigner: false, isWritable: true, pubkey: marginAccount.publicKey },
    { isSigner: true, isWritable: false, pubkey: wallet.publicKey },
    { isSigner: false, isWritable: true, pubkey: tokenAcc },
    {
      isSigner: false,
      isWritable: true,
      pubkey: mangoGroup.vaults[tokenIndex],
    },
    { isSigner: false, isWritable: false, pubkey: mangoGroup.signerKey },
    { isSigner: false, isWritable: false, pubkey: TOKEN_PROGRAM_ID },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_CLOCK_PUBKEY },
    ...marginAccount.openOrders.map((pubkey) => ({
      isSigner: false,
      isWritable: false,
      pubkey,
    })),
    ...mangoGroup.oracles.map((pubkey) => ({
      isSigner: false,
      isWritable: false,
      pubkey,
    })),
  ]
  const data = encodeMangoInstruction({
    Withdraw: { quantity: nativeQuantity },
  })
  const instruction = new TransactionInstruction({ keys, data, programId })
  const transaction = new Transaction()
  transaction.add(instruction)
  const signers = []
  const functionName = 'Withdraw'
  const sendingMessage = `Sending ${functionName} instruction...`
  const successMessage = `${functionName} instruction success`
  return await sendTransaction({
    transaction,
    wallet,
    signers,
    connection,
    sendingMessage,
    successMessage,
  })
}

export async function borrow(
  connection: Connection,
  programId: PublicKey,
  mangoGroup: MangoGroup,
  marginAccount: MarginAccount,
  wallet: Wallet,
  token: PublicKey,

  quantity: number
): Promise<TransactionSignature> {
  const tokenIndex = mangoGroup.getTokenIndex(token)
  const nativeQuantity = uiToNative(
    quantity,
    mangoGroup.mintDecimals[tokenIndex]
  )

  const keys = [
    { isSigner: false, isWritable: true, pubkey: mangoGroup.publicKey },
    { isSigner: false, isWritable: true, pubkey: marginAccount.publicKey },
    { isSigner: true, isWritable: false, pubkey: wallet.publicKey },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_CLOCK_PUBKEY },
    ...marginAccount.openOrders.map((pubkey) => ({
      isSigner: false,
      isWritable: false,
      pubkey,
    })),
    ...mangoGroup.oracles.map((pubkey) => ({
      isSigner: false,
      isWritable: false,
      pubkey,
    })),
  ]
  const data = encodeMangoInstruction({
    Borrow: { tokenIndex: new BN(tokenIndex), quantity: nativeQuantity },
  })

  const instruction = new TransactionInstruction({ keys, data, programId })

  const transaction = new Transaction()
  transaction.add(instruction)
  const signers = []
  const functionName = 'Borrow'
  const sendingMessage = `Sending ${functionName} instruction...`
  const successMessage = `${functionName} instruction success`
  return await sendTransaction({
    transaction,
    wallet,
    signers,
    connection,
    sendingMessage,
    successMessage,
  })
}

export async function borrowAndWithdraw(
  connection: Connection,
  programId: PublicKey,
  mangoGroup: MangoGroup,
  marginAccount: MarginAccount,
  wallet: Wallet,
  token: PublicKey,
  tokenAcc: PublicKey,

  withdrawQuantity: number
): Promise<TransactionSignature> {
  const transaction = new Transaction()
  const tokenIndex = mangoGroup.getTokenIndex(token)
  const tokenBalance = marginAccount.getUiDeposit(mangoGroup, tokenIndex)
  const borrowQuantity = withdrawQuantity - tokenBalance

  const nativeBorrowQuantity = new BN(
    Math.ceil(
      borrowQuantity * Math.pow(10, mangoGroup.mintDecimals[tokenIndex])
    )
  )

  const borrowInstruction = makeBorrowInstruction(
    programId,
    mangoGroup.publicKey,
    marginAccount.publicKey,
    wallet.publicKey,
    tokenIndex,
    marginAccount.openOrders,
    mangoGroup.oracles,
    nativeBorrowQuantity
  )
  transaction.add(borrowInstruction)

  // uiToNative() uses Math.round causing
  // errors so we use Math.floor here instead
  const nativeWithdrawQuantity = new BN(
    Math.floor(
      withdrawQuantity * Math.pow(10, mangoGroup.mintDecimals[tokenIndex])
    ) - 1
  )

  const withdrawInstruction = makeWithdrawInstruction(
    programId,
    mangoGroup.publicKey,
    marginAccount.publicKey,
    wallet.publicKey,
    mangoGroup.signerKey,
    tokenAcc,
    mangoGroup.vaults[tokenIndex],
    marginAccount.openOrders,
    mangoGroup.oracles,
    nativeWithdrawQuantity
  )
  transaction.add(withdrawInstruction)

  const settleBorrowInstruction = makeSettleBorrowInstruction(
    programId,
    mangoGroup.publicKey,
    marginAccount.publicKey,
    wallet.publicKey,
    tokenIndex,
    nativeWithdrawQuantity
  )
  transaction.add(settleBorrowInstruction)

  const signers = []
  const functionName = 'Borrow And Withdraw'
  const sendingMessage = `Sending ${functionName} instruction...`
  const successMessage = `${functionName} instruction success`
  return await sendTransaction({
    transaction,
    wallet,
    signers,
    connection,
    sendingMessage,
    successMessage,
  })
}

export async function settleBorrow(
  connection: Connection,
  programId: PublicKey,
  mangoGroup: MangoGroup,
  marginAccount: MarginAccount,
  wallet: Wallet,

  token: PublicKey,
  quantity: number
): Promise<TransactionSignature> {
  const tokenIndex = mangoGroup.getTokenIndex(token)
  const nativeQuantity = uiToNative(
    quantity,
    mangoGroup.mintDecimals[tokenIndex]
  )
  const keys = [
    { isSigner: false, isWritable: true, pubkey: mangoGroup.publicKey },
    { isSigner: false, isWritable: true, pubkey: marginAccount.publicKey },
    { isSigner: true, isWritable: false, pubkey: wallet.publicKey },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_CLOCK_PUBKEY },
  ]
  const data = encodeMangoInstruction({
    SettleBorrow: { tokenIndex: new BN(tokenIndex), quantity: nativeQuantity },
  })
  const instruction = new TransactionInstruction({ keys, data, programId })

  const transaction = new Transaction()
  transaction.add(instruction)
  return await packageAndSend(
    transaction,
    connection,
    wallet,
    [],
    'SettleBorrow'
  )
}

// Settle all borrows in one transaction
export async function settleAllBorrows(
  connection: Connection,
  programId: PublicKey,
  mangoGroup: MangoGroup,
  marginAccount: MarginAccount,
  wallet: Wallet,

  token: Array<PublicKey>,
  quantity: Array<number>
): Promise<TransactionSignature> {
  // Pack all transaction into one transaction
  const transaction = new Transaction()
  // Signer of the transaction
  const signers = []
  // Add each token into transaction
  token.forEach((tok: PublicKey, i: number) => {
    const tokenIndex = mangoGroup.getTokenIndex(tok)
    const nativeQuantity = uiToNative(
      quantity[i],
      mangoGroup.mintDecimals[tokenIndex]
    )
    const keys = [
      { isSigner: false, isWritable: true, pubkey: mangoGroup.publicKey },
      { isSigner: false, isWritable: true, pubkey: marginAccount.publicKey },
      { isSigner: true, isWritable: false, pubkey: wallet.publicKey },
      { isSigner: false, isWritable: false, pubkey: SYSVAR_CLOCK_PUBKEY },
    ]
    const data = encodeMangoInstruction({
      SettleBorrow: {
        tokenIndex: new BN(tokenIndex),
        quantity: nativeQuantity,
      },
    })
    const instruction = new TransactionInstruction({ keys, data, programId })

    transaction.add(instruction)
  })
  const functionName = 'SettleBorrows'
  const sendingMessage = `Sending ${functionName} instruction...`
  const successMessage = `${functionName} instruction success`

  return await sendTransaction({
    transaction,
    connection,
    wallet,
    signers,
    sendingMessage,
    successMessage,
  })
}

/**
 * If there is no mangoSrmAccount provided, it will create one in the same transaction
 */
export async function depositSrm(
  connection: Connection,
  programId: PublicKey,
  mangoGroup: MangoGroup,
  wallet: Wallet,
  srmAccount: PublicKey,
  quantity: number,

  mangoSrmAccount?: PublicKey
): Promise<PublicKey> {
  const transaction = new Transaction()
  const additionalSigners: Account[] = []
  if (!mangoSrmAccount) {
    const accInstr = await createAccountInstruction(
      connection,
      wallet.publicKey,
      MangoSrmAccountLayout.span,
      programId
    )

    transaction.add(accInstr.instruction)
    additionalSigners.push(accInstr.account)
    mangoSrmAccount = accInstr.account.publicKey
  }

  const nativeQuantity = uiToNative(quantity, SRM_DECIMALS)

  const keys = [
    { isSigner: false, isWritable: true, pubkey: mangoGroup.publicKey },
    { isSigner: false, isWritable: true, pubkey: mangoSrmAccount },
    { isSigner: true, isWritable: false, pubkey: wallet.publicKey },
    { isSigner: false, isWritable: true, pubkey: srmAccount },
    { isSigner: false, isWritable: true, pubkey: mangoGroup.srmVault },
    { isSigner: false, isWritable: false, pubkey: TOKEN_PROGRAM_ID },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_CLOCK_PUBKEY },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_RENT_PUBKEY },
  ]
  const data = encodeMangoInstruction({
    DepositSrm: { quantity: nativeQuantity },
  })
  const instruction = new TransactionInstruction({ keys, data, programId })
  transaction.add(instruction)

  await packageAndSend(
    transaction,
    connection,
    wallet,
    additionalSigners,
    'Deposit SRM'
  )
  return mangoSrmAccount
}

export async function withdrawSrm(
  connection: Connection,
  programId: PublicKey,
  mangoGroup: MangoGroup,
  mangoSrmAccount: MangoSrmAccount,
  wallet: Wallet,
  srmAccount: PublicKey,

  quantity: number
): Promise<TransactionSignature> {
  const nativeQuantity = uiToNative(quantity, SRM_DECIMALS)

  const keys = [
    { isSigner: false, isWritable: true, pubkey: mangoGroup.publicKey },
    { isSigner: false, isWritable: true, pubkey: mangoSrmAccount.publicKey },
    { isSigner: true, isWritable: false, pubkey: wallet.publicKey },
    { isSigner: false, isWritable: true, pubkey: srmAccount },
    { isSigner: false, isWritable: true, pubkey: mangoGroup.srmVault },
    { isSigner: false, isWritable: false, pubkey: mangoGroup.signerKey },
    { isSigner: false, isWritable: false, pubkey: TOKEN_PROGRAM_ID },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_CLOCK_PUBKEY },
  ]
  const data = encodeMangoInstruction({
    WithdrawSrm: { quantity: nativeQuantity },
  })
  const instruction = new TransactionInstruction({ keys, data, programId })

  const transaction = new Transaction()
  transaction.add(instruction)
  return await packageAndSend(
    transaction,
    connection,
    wallet,
    [],
    'WithdrawSrm'
  )
}

export async function placeOrderAndSettle(
  connection: Connection,
  programId: PublicKey,
  mangoGroup: MangoGroup,
  marginAccount: MarginAccount,
  spotMarket: Market,
  wallet: Wallet,

  side: 'buy' | 'sell',
  price: number,
  size: number,
  orderType?: 'limit' | 'ioc' | 'postOnly',
  clientId?: BN
): Promise<TransactionSignature> {
  orderType = orderType == undefined ? 'limit' : orderType
  // orderType = orderType ?? 'limit'
  const limitPrice = spotMarket.priceNumberToLots(price)
  const maxBaseQuantity = spotMarket.baseSizeNumberToLots(size)

  const feeTier = getFeeTier(
    0,
    nativeToUi(mangoGroup.nativeSrm || 0, SRM_DECIMALS)
  )
  const rates = getFeeRates(feeTier)
  const maxQuoteQuantity = new BN(
    spotMarket['_decoded'].quoteLotSize.toNumber() * (1 + rates.taker)
  ).mul(
    spotMarket
      .baseSizeNumberToLots(size)
      .mul(spotMarket.priceNumberToLots(price))
  )

  if (maxBaseQuantity.lte(new BN(0))) {
    throw new Error('size too small')
  }
  if (limitPrice.lte(new BN(0))) {
    throw new Error('invalid price')
  }
  const selfTradeBehavior = 'decrementTake'
  const marketIndex = mangoGroup.getMarketIndex(spotMarket)
  const vaultIndex = side === 'buy' ? mangoGroup.vaults.length - 1 : marketIndex

  // Add all instructions to one atomic transaction
  const transaction = new Transaction()

  // Specify signers in addition to the wallet
  const signers: Account[] = []

  // Create a Solana account for the open orders account if it's missing
  const openOrdersKeys: PublicKey[] = []
  for (let i = 0; i < marginAccount.openOrders.length; i++) {
    if (
      i === marketIndex &&
      marginAccount.openOrders[marketIndex].equals(zeroKey)
    ) {
      // open orders missing for this market; create a new one now
      const openOrdersSpace = OpenOrders.getLayout(mangoGroup.dexProgramId).span
      const openOrdersLamports = await connection.getMinimumBalanceForRentExemption(
        openOrdersSpace,
        'singleGossip'
      )
      const accInstr = await createAccountInstruction(
        connection,
        wallet.publicKey,
        openOrdersSpace,
        mangoGroup.dexProgramId,
        openOrdersLamports
      )

      transaction.add(accInstr.instruction)
      signers.push(accInstr.account)
      openOrdersKeys.push(accInstr.account.publicKey)
    } else {
      openOrdersKeys.push(marginAccount.openOrders[i])
    }
  }

  const keys = [
    { isSigner: false, isWritable: true, pubkey: mangoGroup.publicKey },
    { isSigner: true, isWritable: false, pubkey: wallet.publicKey },
    { isSigner: false, isWritable: true, pubkey: marginAccount.publicKey },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_CLOCK_PUBKEY },
    { isSigner: false, isWritable: false, pubkey: spotMarket.programId },
    { isSigner: false, isWritable: true, pubkey: spotMarket.publicKey },
    {
      isSigner: false,
      isWritable: true,
      pubkey: spotMarket['_decoded'].requestQueue,
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: spotMarket['_decoded'].eventQueue,
    },
    { isSigner: false, isWritable: true, pubkey: spotMarket['_decoded'].bids },
    { isSigner: false, isWritable: true, pubkey: spotMarket['_decoded'].asks },
    {
      isSigner: false,
      isWritable: true,
      pubkey: mangoGroup.vaults[vaultIndex],
    },
    { isSigner: false, isWritable: false, pubkey: mangoGroup.signerKey },
    {
      isSigner: false,
      isWritable: true,
      pubkey: spotMarket['_decoded'].baseVault,
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: spotMarket['_decoded'].quoteVault,
    },
    { isSigner: false, isWritable: false, pubkey: TOKEN_PROGRAM_ID },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_RENT_PUBKEY },
    { isSigner: false, isWritable: true, pubkey: mangoGroup.srmVault },
    ...openOrdersKeys.map((pubkey) => ({
      isSigner: false,
      isWritable: true,
      pubkey,
    })),
    ...mangoGroup.oracles.map((pubkey) => ({
      isSigner: false,
      isWritable: false,
      pubkey,
    })),
  ]

  const data = encodeMangoInstruction({
    PlaceOrder: clientId
      ? {
          side,
          limitPrice,
          maxBaseQuantity,
          maxQuoteQuantity,
          selfTradeBehavior,
          orderType,
          clientId,
          limit: 65535,
        }
      : {
          side,
          limitPrice,
          maxBaseQuantity,
          maxQuoteQuantity,
          selfTradeBehavior,
          orderType,
          limit: 65535,
        },
  })

  const placeOrderInstruction = new TransactionInstruction({
    keys,
    data,
    programId,
  })
  transaction.add(placeOrderInstruction)

  const dexSigner = await PublicKey.createProgramAddress(
    [
      spotMarket.publicKey.toBuffer(),
      spotMarket['_decoded'].vaultSignerNonce.toArrayLike(Buffer, 'le', 8),
    ],
    spotMarket.programId
  )
  const settleFundsIns = makeSettleFundsInstruction(
    programId,
    mangoGroup.publicKey,
    wallet.publicKey,
    marginAccount.publicKey,
    spotMarket.programId,
    spotMarket.publicKey,
    openOrdersKeys[marketIndex],
    mangoGroup.signerKey,
    spotMarket['_decoded'].baseVault,
    spotMarket['_decoded'].quoteVault,
    mangoGroup.vaults[marketIndex],
    mangoGroup.vaults[mangoGroup.vaults.length - 1],
    dexSigner
  )
  transaction.add(settleFundsIns)

  const baseTokenIndex = marketIndex
  const quoteTokenIndex = NUM_TOKENS - 1
  const tokenIndex = side === 'buy' ? baseTokenIndex : quoteTokenIndex
  const quantity = marginAccount.getUiBorrow(mangoGroup, tokenIndex)
  const nativeQuantity = uiToNative(
    quantity,
    mangoGroup.mintDecimals[tokenIndex]
  )

  const settleBorrowIns = makeSettleBorrowInstruction(
    programId,
    mangoGroup.publicKey,
    marginAccount.publicKey,
    wallet.publicKey,
    tokenIndex,
    nativeQuantity
  )

  transaction.add(settleBorrowIns)

  return await packageAndSend(
    transaction,
    connection,
    wallet,
    signers,
    'PlaceOrder'
  )
}

export async function placeAndSettle(
  connection: Connection,
  programId: PublicKey,
  mangoGroup: MangoGroup,
  marginAccount: MarginAccount,
  spotMarket: Market,
  wallet: Wallet,

  side: 'buy' | 'sell',
  price: number,
  size: number,
  orderType?: 'limit' | 'ioc' | 'postOnly',
  clientId?: BN
): Promise<TransactionSignature> {
  orderType = orderType == undefined ? 'limit' : orderType
  // orderType = orderType ?? 'limit'
  const limitPrice = spotMarket.priceNumberToLots(price)
  const maxBaseQuantity = spotMarket.baseSizeNumberToLots(size)

  const feeTier = getFeeTier(
    0,
    nativeToUi(mangoGroup.nativeSrm || 0, SRM_DECIMALS)
  )
  const rates = getFeeRates(feeTier)
  const maxQuoteQuantity = new BN(
    spotMarket['_decoded'].quoteLotSize.toNumber() * (1 + rates.taker)
  ).mul(
    spotMarket
      .baseSizeNumberToLots(size)
      .mul(spotMarket.priceNumberToLots(price))
  )

  if (maxBaseQuantity.lte(new BN(0))) {
    throw new Error('size too small')
  }
  if (limitPrice.lte(new BN(0))) {
    throw new Error('invalid price')
  }
  const selfTradeBehavior = 'decrementTake'
  const marketIndex = mangoGroup.getMarketIndex(spotMarket)
  // const vaultIndex = side === 'buy' ? mangoGroup.vaults.length - 1 : marketIndex

  // Add all instructions to one atomic transaction
  const transaction = new Transaction()

  // Specify signers in addition to the wallet
  const signers: Account[] = []

  const dexSigner = await PublicKey.createProgramAddress(
    [
      spotMarket.publicKey.toBuffer(),
      spotMarket['_decoded'].vaultSignerNonce.toArrayLike(Buffer, 'le', 8),
    ],
    spotMarket.programId
  )

  // Create a Solana account for the open orders account if it's missing
  const openOrdersKeys: PublicKey[] = []
  for (let i = 0; i < marginAccount.openOrders.length; i++) {
    if (
      i === marketIndex &&
      marginAccount.openOrders[marketIndex].equals(zeroKey)
    ) {
      // open orders missing for this market; create a new one now
      const openOrdersSpace = OpenOrders.getLayout(mangoGroup.dexProgramId).span
      const openOrdersLamports = await connection.getMinimumBalanceForRentExemption(
        openOrdersSpace,
        'singleGossip'
      )
      const accInstr = await createAccountInstruction(
        connection,
        wallet.publicKey,
        openOrdersSpace,
        mangoGroup.dexProgramId,
        openOrdersLamports
      )

      transaction.add(accInstr.instruction)
      signers.push(accInstr.account)
      openOrdersKeys.push(accInstr.account.publicKey)
    } else {
      openOrdersKeys.push(marginAccount.openOrders[i])
    }
  }

  const keys = [
    { isSigner: false, isWritable: true, pubkey: mangoGroup.publicKey },
    { isSigner: true, isWritable: false, pubkey: wallet.publicKey },
    { isSigner: false, isWritable: true, pubkey: marginAccount.publicKey },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_CLOCK_PUBKEY },
    { isSigner: false, isWritable: false, pubkey: spotMarket.programId },
    { isSigner: false, isWritable: true, pubkey: spotMarket.publicKey },
    {
      isSigner: false,
      isWritable: true,
      pubkey: spotMarket['_decoded'].requestQueue,
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: spotMarket['_decoded'].eventQueue,
    },
    { isSigner: false, isWritable: true, pubkey: spotMarket['_decoded'].bids },
    { isSigner: false, isWritable: true, pubkey: spotMarket['_decoded'].asks },
    {
      isSigner: false,
      isWritable: true,
      pubkey: mangoGroup.vaults[marketIndex],
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: mangoGroup.vaults[NUM_TOKENS - 1],
    },
    { isSigner: false, isWritable: false, pubkey: mangoGroup.signerKey },
    {
      isSigner: false,
      isWritable: true,
      pubkey: spotMarket['_decoded'].baseVault,
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: spotMarket['_decoded'].quoteVault,
    },
    { isSigner: false, isWritable: false, pubkey: TOKEN_PROGRAM_ID },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_RENT_PUBKEY },
    { isSigner: false, isWritable: true, pubkey: mangoGroup.srmVault },
    { isSigner: false, isWritable: false, pubkey: dexSigner },
    ...openOrdersKeys.map((pubkey) => ({
      isSigner: false,
      isWritable: true,
      pubkey,
    })),
    ...mangoGroup.oracles.map((pubkey) => ({
      isSigner: false,
      isWritable: false,
      pubkey,
    })),
  ]

  const data = encodeMangoInstruction({
    PlaceAndSettle: clientId
      ? {
          side,
          limitPrice,
          maxBaseQuantity,
          maxQuoteQuantity,
          selfTradeBehavior,
          orderType,
          clientId,
          limit: 65535,
        }
      : {
          side,
          limitPrice,
          maxBaseQuantity,
          maxQuoteQuantity,
          selfTradeBehavior,
          orderType,
          limit: 65535,
        },
  })

  const placeAndSettleInstruction = new TransactionInstruction({
    keys,
    data,
    programId,
  })
  transaction.add(placeAndSettleInstruction)

  return await packageAndSend(
    transaction,
    connection,
    wallet,
    signers,
    'place order and settle'
  )
}

export async function settleFundsAndBorrows(
  connection: Connection,
  programId: PublicKey,
  mangoGroup: MangoGroup,
  marginAccount: MarginAccount,
  wallet: Wallet,
  spotMarket: Market
): Promise<TransactionSignature> {
  const transaction = new Transaction()
  const marketIndex = mangoGroup.getMarketIndex(spotMarket)
  const dexSigner = await PublicKey.createProgramAddress(
    [
      spotMarket.publicKey.toBuffer(),
      spotMarket['_decoded'].vaultSignerNonce.toArrayLike(Buffer, 'le', 8),
    ],
    spotMarket.programId
  )
  const settleFundsIns = await makeSettleFundsInstruction(
    programId,
    mangoGroup.publicKey,
    wallet.publicKey,
    marginAccount.publicKey,
    spotMarket.programId,
    spotMarket.publicKey,
    marginAccount.openOrders[marketIndex],
    mangoGroup.signerKey,
    spotMarket['_decoded'].baseVault,
    spotMarket['_decoded'].quoteVault,
    mangoGroup.vaults[marketIndex],
    mangoGroup.vaults[mangoGroup.vaults.length - 1],
    dexSigner
  )
  transaction.add(settleFundsIns)

  const tokenIndex = marketIndex
  const quantity = marginAccount.getUiBorrow(mangoGroup, tokenIndex)
  const nativeQuantity = uiToNative(
    quantity,
    mangoGroup.mintDecimals[tokenIndex]
  )

  const settleBorrowIns = await makeSettleBorrowInstruction(
    programId,
    mangoGroup.publicKey,
    marginAccount.publicKey,
    wallet.publicKey,
    tokenIndex,
    nativeQuantity
  )

  transaction.add(settleBorrowIns)
  const signers = []
  return await packageAndSend(
    transaction,
    connection,
    wallet,
    signers,
    'Settle Funds'
  )
}

export async function settleFunds(
  connection: Connection,
  programId: PublicKey,
  mangoGroup: MangoGroup,
  marginAccount: MarginAccount,
  wallet: Wallet,
  spotMarket: Market
): Promise<TransactionSignature> {
  const marketIndex = mangoGroup.getMarketIndex(spotMarket)
  const dexSigner = await PublicKey.createProgramAddress(
    [
      spotMarket.publicKey.toBuffer(),
      spotMarket['_decoded'].vaultSignerNonce.toArrayLike(Buffer, 'le', 8),
    ],
    spotMarket.programId
  )

  const keys = [
    { isSigner: false, isWritable: true, pubkey: mangoGroup.publicKey },
    { isSigner: true, isWritable: false, pubkey: wallet.publicKey },
    { isSigner: false, isWritable: true, pubkey: marginAccount.publicKey },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_CLOCK_PUBKEY },
    { isSigner: false, isWritable: false, pubkey: spotMarket.programId },
    { isSigner: false, isWritable: true, pubkey: spotMarket.publicKey },
    {
      isSigner: false,
      isWritable: true,
      pubkey: marginAccount.openOrders[marketIndex],
    },
    { isSigner: false, isWritable: false, pubkey: mangoGroup.signerKey },
    {
      isSigner: false,
      isWritable: true,
      pubkey: spotMarket['_decoded'].baseVault,
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: spotMarket['_decoded'].quoteVault,
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: mangoGroup.vaults[marketIndex],
    },
    {
      isSigner: false,
      isWritable: true,
      pubkey: mangoGroup.vaults[mangoGroup.vaults.length - 1],
    },
    { isSigner: false, isWritable: false, pubkey: dexSigner },
    { isSigner: false, isWritable: false, pubkey: TOKEN_PROGRAM_ID },
  ]
  const data = encodeMangoInstruction({ SettleFunds: {} })

  const instruction = new TransactionInstruction({ keys, data, programId })

  // Add all instructions to one atomic transaction
  const transaction = new Transaction()
  transaction.add(instruction)

  const signers = []
  const functionName = 'SettleFunds'
  const sendingMessage = `Sending ${functionName} instruction...`
  const successMessage = `${functionName} instruction success`
  return await sendTransaction({
    transaction,
    wallet,
    signers,
    connection,
    sendingMessage,
    successMessage,
  })
}

export async function cancelOrderAndSettle(
  connection: Connection,
  programId: PublicKey,
  mangoGroup: MangoGroup,
  marginAccount: MarginAccount,
  wallet: Wallet,
  spotMarket: Market,
  order: Order
): Promise<TransactionSignature> {
  const keys = [
    { isSigner: false, isWritable: true, pubkey: mangoGroup.publicKey },
    { isSigner: true, isWritable: false, pubkey: wallet.publicKey },
    { isSigner: false, isWritable: true, pubkey: marginAccount.publicKey },
    { isSigner: false, isWritable: false, pubkey: SYSVAR_CLOCK_PUBKEY },
    { isSigner: false, isWritable: false, pubkey: mangoGroup.dexProgramId },
    { isSigner: false, isWritable: true, pubkey: spotMarket.publicKey },
    { isSigner: false, isWritable: true, pubkey: spotMarket['_decoded'].bids },
    { isSigner: false, isWritable: true, pubkey: spotMarket['_decoded'].asks },
    { isSigner: false, isWritable: true, pubkey: order.openOrdersAddress },
    { isSigner: false, isWritable: false, pubkey: mangoGroup.signerKey },
    {
      isSigner: false,
      isWritable: true,
      pubkey: spotMarket['_decoded'].eventQueue,
    },
  ]

  const data = encodeMangoInstruction({
    CancelOrder: {
      side: order.side,
      orderId: order.orderId,
    },
  })

  const instruction = new TransactionInstruction({ keys, data, programId })

  const transaction = new Transaction()
  transaction.add(instruction)

  const marketIndex = mangoGroup.getMarketIndex(spotMarket)
  const dexSigner = await PublicKey.createProgramAddress(
    [
      spotMarket.publicKey.toBuffer(),
      spotMarket['_decoded'].vaultSignerNonce.toArrayLike(Buffer, 'le', 8),
    ],
    spotMarket.programId
  )
  const settleFundsIns = await makeSettleFundsInstruction(
    programId,
    mangoGroup.publicKey,
    wallet.publicKey,
    marginAccount.publicKey,
    spotMarket.programId,
    spotMarket.publicKey,
    marginAccount.openOrders[marketIndex],
    mangoGroup.signerKey,
    spotMarket['_decoded'].baseVault,
    spotMarket['_decoded'].quoteVault,
    mangoGroup.vaults[marketIndex],
    mangoGroup.vaults[mangoGroup.vaults.length - 1],
    dexSigner
  )
  transaction.add(settleFundsIns)

  const baseTokenIndex = marketIndex
  const quoteTokenIndex = NUM_TOKENS - 1

  const baseTokenQuantity = marginAccount.getUiBorrow(
    mangoGroup,
    baseTokenIndex
  )
  const baseTokenNativeQuantity = uiToNative(
    baseTokenQuantity,
    mangoGroup.mintDecimals[baseTokenIndex]
  )

  const quoteTokenQuantity = marginAccount.getUiBorrow(
    mangoGroup,
    quoteTokenIndex
  )
  const quoteTokenNativeQuantity = uiToNative(
    quoteTokenQuantity,
    mangoGroup.mintDecimals[quoteTokenIndex]
  )

  const settleBorrowBaseToken = await makeSettleBorrowInstruction(
    programId,
    mangoGroup.publicKey,
    marginAccount.publicKey,
    wallet.publicKey,
    baseTokenIndex,
    baseTokenNativeQuantity
  )

  transaction.add(settleBorrowBaseToken)

  const settleBorrowQuoteToken = await makeSettleBorrowInstruction(
    programId,
    mangoGroup.publicKey,
    marginAccount.publicKey,
    wallet.publicKey,
    quoteTokenIndex,
    quoteTokenNativeQuantity
  )

  transaction.add(settleBorrowQuoteToken)

  return await packageAndSend(
    transaction,
    connection,
    wallet,
    [],
    'CancelOrder'
  )
}

export async function settleAll(
  connection: Connection,
  programId: PublicKey,
  mangoGroup: MangoGroup,
  marginAccount: MarginAccount,
  markets: Market[],
  wallet: Wallet
): Promise<TransactionSignature> {
  const transaction = new Transaction()

  const assetGains: number[] = new Array(NUM_TOKENS).fill(0)

  for (let i = 0; i < NUM_MARKETS; i++) {
    const openOrdersAccount = marginAccount.openOrdersAccounts[i]
    if (openOrdersAccount === undefined) {
      continue
    } else if (
      openOrdersAccount.quoteTokenFree.toNumber() === 0 &&
      openOrdersAccount.baseTokenFree.toNumber() === 0
    ) {
      continue
    }

    assetGains[i] += openOrdersAccount.baseTokenFree.toNumber()
    assetGains[NUM_TOKENS - 1] += openOrdersAccount.quoteTokenFree.toNumber()

    const spotMarket = markets[i]
    const dexSigner = await PublicKey.createProgramAddress(
      [
        spotMarket.publicKey.toBuffer(),
        spotMarket['_decoded'].vaultSignerNonce.toArrayLike(Buffer, 'le', 8),
      ],
      spotMarket.programId
    )

    const keys = [
      { isSigner: false, isWritable: true, pubkey: mangoGroup.publicKey },
      { isSigner: true, isWritable: false, pubkey: wallet.publicKey },
      { isSigner: false, isWritable: true, pubkey: marginAccount.publicKey },
      { isSigner: false, isWritable: false, pubkey: SYSVAR_CLOCK_PUBKEY },
      { isSigner: false, isWritable: false, pubkey: spotMarket.programId },
      { isSigner: false, isWritable: true, pubkey: spotMarket.publicKey },
      {
        isSigner: false,
        isWritable: true,
        pubkey: marginAccount.openOrders[i],
      },
      { isSigner: false, isWritable: false, pubkey: mangoGroup.signerKey },
      {
        isSigner: false,
        isWritable: true,
        pubkey: spotMarket['_decoded'].baseVault,
      },
      {
        isSigner: false,
        isWritable: true,
        pubkey: spotMarket['_decoded'].quoteVault,
      },
      { isSigner: false, isWritable: true, pubkey: mangoGroup.vaults[i] },
      {
        isSigner: false,
        isWritable: true,
        pubkey: mangoGroup.vaults[mangoGroup.vaults.length - 1],
      },
      { isSigner: false, isWritable: false, pubkey: dexSigner },
      { isSigner: false, isWritable: false, pubkey: TOKEN_PROGRAM_ID },
    ]
    const data = encodeMangoInstruction({ SettleFunds: {} })

    const settleFundsInstruction = new TransactionInstruction({
      keys,
      data,
      programId,
    })
    transaction.add(settleFundsInstruction)
  }

  const deposits = marginAccount.getDeposits(mangoGroup)
  const liabs = marginAccount.getLiabs(mangoGroup)

  for (let i = 0; i < NUM_TOKENS; i++) {
    // TODO test this. maybe it hits transaction size limit

    const deposit = deposits[i] + assetGains[i]
    if (deposit === 0 || liabs[i] === 0) {
      continue
    }
    const keys = [
      { isSigner: false, isWritable: true, pubkey: mangoGroup.publicKey },
      { isSigner: false, isWritable: true, pubkey: marginAccount.publicKey },
      { isSigner: true, isWritable: false, pubkey: wallet.publicKey },
      { isSigner: false, isWritable: false, pubkey: SYSVAR_CLOCK_PUBKEY },
    ]
    const data = encodeMangoInstruction({
      SettleBorrow: {
        tokenIndex: new BN(i),
        quantity: uiToNative(liabs[i] * 2, mangoGroup.mintDecimals[i]),
      },
    })

    const settleBorrowsInstruction = new TransactionInstruction({
      keys,
      data,
      programId,
    })
    transaction.add(settleBorrowsInstruction)
  }

  if (transaction.instructions.length === 0) {
    throw new Error('No unsettled funds')
  }

  return await packageAndSend(transaction, connection, wallet, [], 'Settle All')
}

async function packageAndSend(
  transaction: Transaction,
  connection: Connection,
  wallet: Wallet,
  signers: Account[],
  functionName: string
): Promise<TransactionSignature> {
  const sendingMessage = `Sending ${functionName} instruction...`
  const successMessage = `${capitalize(functionName)} instruction success`
  return await sendTransaction({
    transaction,
    wallet,
    signers,
    connection,
    sendingMessage,
    successMessage,
  })
}
