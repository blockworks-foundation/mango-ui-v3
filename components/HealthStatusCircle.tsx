import { useMemo } from 'react'
import { CircularProgressbar } from 'react-circular-progressbar'
import useMangoStore from 'stores/useMangoStore'

const HealthStatusCircle = ({ size }: { size: number }) => {
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoCache = useMangoStore((s) => s.selectedMangoGroup.cache)

  const maintHealthRatio = useMemo(() => {
    return mangoAccount && mangoGroup && mangoCache
      ? Number(mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Maint'))
      : 100
  }, [mangoAccount, mangoGroup, mangoCache])

  const initHealthRatio = useMemo(() => {
    return mangoAccount && mangoGroup && mangoCache
      ? Number(mangoAccount.getHealthRatio(mangoGroup, mangoCache, 'Init'))
      : 100
  }, [mangoAccount, mangoGroup, mangoCache])

  return (
    <div style={{ width: size, height: size }}>
      <CircularProgressbar
        className={
          maintHealthRatio > 30
            ? 'CircularProgressbar-green'
            : initHealthRatio > 0
            ? 'CircularProgressbar-orange'
            : 'CircularProgressbar-red'
        }
        counterClockwise
        value={maintHealthRatio}
        strokeWidth={12}
      />
    </div>
  )
}

export default HealthStatusCircle
