// It is generally recommended to define selectors outside the render function.
// This will prevent unnecessary computations each render.
// It also allows React to optimize performance in concurrent mode.

import { MangoStore } from './useMangoStore'

export const mangoAccountSelector = (state: MangoStore) =>
  state.selectedMangoAccount.current

export const mangoGroupSelector = (state: MangoStore) =>
  state.selectedMangoGroup.current

export const mangoGroupConfigSelector = (state: MangoStore) =>
  state.selectedMangoGroup.config

export const mangoCacheSelector = (state: MangoStore) =>
  state.selectedMangoGroup.cache

export const mangoClientSelector = (state: MangoStore) =>
  state.connection.client

export const actionsSelector = (state: MangoStore) => state.actions

export const marketsSelector = (state: MangoStore) =>
  state.selectedMangoGroup.markets

export const marketSelector = (state: MangoStore) =>
  state.selectedMarket.current

export const marketConfigSelector = (state: MangoStore) =>
  state.selectedMarket.config

export const connectionSelector = (state: MangoStore) =>
  state.connection.current

export const orderbookSelector = (state: MangoStore) =>
  state.selectedMarket.orderBook

export const markPriceSelector = (state: MangoStore) =>
  state.selectedMarket.markPrice

export const fillsSelector = (state: MangoStore) => state.selectedMarket.fills

export const setStoreSelector = (state: MangoStore) => state.set

export const accountInfosSelector = (state: MangoStore) => state.accountInfos

export const tradeHistorySelector = (state: MangoStore) => state.tradeHistory

export const walletSelector = (state: MangoStore) => state.wallet.current

export const walletConnectedSelector = (state: MangoStore) =>
  state.wallet.connected
