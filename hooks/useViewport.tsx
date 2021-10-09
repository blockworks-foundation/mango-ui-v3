import { createContext, useContext, useEffect, useState } from 'react'

type ViewportContextProps = {
  screenWidth: number
}

const ViewportContext = createContext({} as ViewportContextProps)

export const ViewportProvider = ({ children }) => {
  const [mounted, setMounted] = useState(false)
  const [screenWidth, setScreenWidth] = useState(null)

  const handleWindowResize = () => {
    setScreenWidth(window.innerWidth)
  }

  useEffect(() => {
    handleWindowResize()
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [])

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <ViewportContext.Provider value={{ screenWidth }}>
      {children}
    </ViewportContext.Provider>
  )
}

export const useViewport = () => {
  const { screenWidth } = useContext(ViewportContext)
  return { screenWidth }
}
