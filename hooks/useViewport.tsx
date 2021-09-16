import { createContext, useContext, useEffect, useState } from 'react'

type ViewportContextProps = {
  width: number
}

const ViewportContext = createContext({} as ViewportContextProps)

export const ViewportProvider = ({ children }) => {
  const [mounted, setMounted] = useState(false)
  const [width, setWidth] = useState(null)

  const handleWindowResize = () => {
    setWidth(window.innerWidth)
  }

  useEffect(() => {
    handleWindowResize()
    window.addEventListener('resize', handleWindowResize)
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [])

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <ViewportContext.Provider value={{ width }}>
      {children}
    </ViewportContext.Provider>
  )
}

export const useViewport = () => {
  const { width } = useContext(ViewportContext)
  return { width }
}
