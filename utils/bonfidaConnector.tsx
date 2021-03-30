import { BonfidaTrade } from '../@types/types'

const baseUrl = 'https://serum-history.herokuapp.com'
//const baseUrl = "http://85.214.116.56:5000";
//const baseUrl = "http://localhost:5000";

export default class BonfidaApi {
  static URL = `${baseUrl}/`

  static async get(path: string) {
    try {
      const response = await fetch(this.URL + path)
      if (response.ok) {
        const responseJson = await response.json()
        return responseJson.success ? responseJson.data : null
      }
    } catch (err) {
      console.log(`Error fetching from Bonfida API ${path}: ${err}`)
    }
    return null
  }

  static async getRecentTrades(
    marketAddress: string
  ): Promise<BonfidaTrade[] | null> {
    return BonfidaApi.get(`trades/address/${marketAddress}`)
  }
}

export const BONFIDA_DATA_FEED = `${baseUrl}/tv`
