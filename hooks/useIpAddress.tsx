import { useEffect, useState } from 'react'
import { CLUSTER } from '../stores/useMangoStore'

const SANCTIONED_COUNTRIES = [
  ['AG', 'Antigua and Barbuda'],
  ['DZ', 'Algeria'],
  ['BD', 'Bangladesh'],
  ['BO', 'Bolivia'],
  ['BY', 'Belarus'],
  ['BI', 'Burundi'],
  ['MM', 'Burma (Myanmar)'],
  ['CI', "Cote D'Ivoire (Ivory Coast)"],
  ['CU', 'Cuba'],
  ['CD', 'Democratic Republic of Congo'],
  ['EC', 'Ecuador'],
  //['GB', 'United Kingdom'],
  ['IR', 'Iran'],
  ['IQ', 'Iraq'],
  ['LR', 'Liberia'],
  ['LY', 'Libya'],
  ['ML', 'Mali'],
  ['MA', 'Morocco'],
  ['NP', 'Nepal'],
  ['KP', 'North Korea'],
  ['SO', 'Somalia'],
  ['SD', 'Sudan'],
  ['SY', 'Syria'],
  ['VE', 'Venezuela'],
  ['YE', 'Yemen'],
  ['ZW', 'Zimbabwe'],
  ['US', 'United States'],
]

const SANCTIONED_COUNTRY_CODES = SANCTIONED_COUNTRIES.map(
  (country) => country[0]
)

const SPOT_ALLOWED = ['GB']

export default function useIpAddress() {
  const [ipAllowed, setIpAllowed] = useState(false)
  const [spotAllowed, setSpotAllowed] = useState(false)

  useEffect(() => {
    const checkIpLocation = async () => {
      const response = await fetch(
        `https://country-code.mangomarkets.workers.dev`
      )
      const parsedResponse = await response.json()
      const ipCountryCode = parsedResponse ? parsedResponse?.country : ''

      if (ipCountryCode) {
        setIpAllowed(!SANCTIONED_COUNTRY_CODES.includes(ipCountryCode))
        setSpotAllowed(SPOT_ALLOWED.includes(ipCountryCode))
      }
    }

    checkIpLocation()
  }, [])

  if (CLUSTER === 'mainnet') {
    return { ipAllowed, spotAllowed }
  } else {
    return { ipAllowed: true, spotAllowed: true }
  }
}
