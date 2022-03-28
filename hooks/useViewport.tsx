import { createContext, useContext, useEffect, useState } from 'react'

type ViewportContextProps = {
  width: number
}

const ViewportContext = createContext({} as ViewportContextProps)

export const ViewportProvider = ({ children }) => {
  const [mounted, setMounted] = useState(false)
  const [width, setWidth] = useState<number>(0)

  const handleWindowResize = () => {
    if (typeof window !== 'undefined') {
      setWidth(window.innerWidth)
    }
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
