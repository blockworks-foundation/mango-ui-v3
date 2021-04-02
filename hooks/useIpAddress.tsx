import { useEffect, useState } from 'react'

export default function useIpAddress() {
  const [ipAllowed, setIpAllowed] = useState(true)

  useEffect(() => {
    const checkIpLocation = async () => {
      const response = await fetch(`https://www.cloudflare.com/cdn-cgi/trace`)
      const parsedResponse = await response.text()
      const ipLocation = parsedResponse.match(/loc=(.+)/)
      const ipCountryCode = ipLocation ? ipLocation[1] : ''

      if (ipCountryCode) {
        setIpAllowed(ipCountryCode !== 'US')
      }
    }

    checkIpLocation()
  }, [])

  return { ipAllowed }
}
