import { ChartTradeType } from '../@types/types'

const baseUrl = 'https://event-history-api-candles.herokuapp.com'
// const baseUrl = 'http://localhost:4000'

export default class ChartApi {
  static URL = `${baseUrl}/`

  static async get(path: string) {
    try {
      const response = await fetch(this.URL + path)
      if (response.ok) {
        const responseJson = await response.json()
        return responseJson.success
          ? responseJson.data
          : responseJson
          ? responseJson
          : null
      }
    } catch (err) {
      console.log(`Error fetching from Chart API ${path}: ${err}`)
    }
    return null
  }

  static async getRecentTrades(
    marketAddress: string
  ): Promise<ChartTradeType[] | null> {
    if (!marketAddress) return
    return ChartApi.get(`trades/address/${marketAddress}`)
  }

  static async getOhlcv(
    symbol: string,
    resolution: string,
    from: number,
    to: number
  ): Promise<ChartTradeType[] | null> {
    if (!symbol) return
    return ChartApi.get(
      `tv/history?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}`
    )
  }
}

export const CHART_DATA_FEED = `${baseUrl}/tv`
