// It is generally recommended to define selectors outside the render function.
// This will prevent unnecessary computations each render.
// It also allows React to optimize performance in concurrent mode.

export const mangoAccountSelector = (state) =>
  state.selectedMangoAccount.current

export const mangoGroupSelector = (state) => state.selectedMangoGroup.current

export const mangoGroupConfigSelector = (state) =>
  state.selectedMangoGroup.config

export const mangoCacheSelector = (state) => state.selectedMangoGroup.cache

export const actionsSelector = (state) => state.actions

export const marketsSelector = (state) => state.selectedMangoGroup.markets

export const marketSelector = (state) => state.selectedMarket.current

export const marketConfigSelector = (state) => state.selectedMarket.config

export const connectionSelector = (state) => state.connection.current

export const orderbookSelector = (state) => state.selectedMarket.orderBook

export const markPriceSelector = (state) => state.selectedMarket.markPrice

export const fillsSelector = (state) => state.selectedMarket.fills

export const setStoreSelector = (state) => state.set

export const accountInfosSelector = (state) => state.accountInfos

export const tradeHistorySelector = (state) => state.tradeHistory

export const walletSelector = (state) => state.wallet.current

export const walletConnectedSelector = (state) => state.wallet.connected
