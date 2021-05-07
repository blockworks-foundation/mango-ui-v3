import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon } from '@heroicons/react/outline'
import DropMenu from './DropMenu'
import { MangoIcon } from './icons'

const THEMES = [
  { name: 'Light', icon: <SunIcon className="h-4 w-4" /> },
  { name: 'Dark', icon: <MoonIcon className="h-4 w-4" /> },
  { name: 'Mango', icon: <MangoIcon className="stroke-current h-4 w-4" /> },
]

const ThemeSwitch = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <DropMenu
      button={
        <div className="flex items-center justify-center rounded-full bg-th-bkg-3 w-8 h-8">
          {THEMES.find((t) => t.name === theme).icon}
        </div>
      }
      buttonClassName="flex items-center justify-center hover:text-th-primary rounded-md focus:outline-none"
      value={theme}
      onChange={(theme) => setTheme(theme)}
      options={THEMES}
      toolTipContent="Change Theme"
    />
  )
}

export default ThemeSwitch
