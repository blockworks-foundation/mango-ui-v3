import { ChartTradeType } from '../@types/types'

const baseUrl = 'https://serum-history.herokuapp.com'
export default class ChartApi {
  static URL = `${baseUrl}/`

  static async get(path: string) {
    try {
      const response = await fetch(this.URL + path)
      if (response.ok) {
        const responseJson = await response.json()
        return responseJson.success ? responseJson.data : null
      }
    } catch (err) {
      console.log(`Error fetching from Chart API ${path}: ${err}`)
    }
    return null
  }

  static async getRecentTrades(
    marketAddress: string
  ): Promise<ChartTradeType[] | null> {
    return ChartApi.get(`trades/address/${marketAddress}`)
  }
}

export const CHART_DATA_FEED = `${baseUrl}/tv`
