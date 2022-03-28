import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon } from '@heroicons/react/outline'
import DropMenu from './DropMenu'
import { MangoIcon } from './icons'

const THEMES = [
  { name: 'Light', icon: <SunIcon className="h-4 w-4" /> },
  { name: 'Dark', icon: <MoonIcon className="h-4 w-4" /> },
  { name: 'Mango', icon: <MangoIcon className="h-4 w-4 stroke-current" /> },
]

const ThemeSwitch = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), [])

  return (
    <div id="themes-tip">
      {mounted ? (
        <DropMenu
          button={
            <div className="default-transition flex h-8 w-8 items-center justify-center rounded-full bg-th-bkg-4 text-th-fgd-1 hover:text-th-primary focus:outline-none">
              {THEMES?.find((t) => t?.name === theme)?.icon}
            </div>
          }
          value={theme}
          onChange={(theme) => setTheme(theme)}
          options={THEMES}
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-th-bkg-3" />
      )}
    </div>
  )
}

export default ThemeSwitch
