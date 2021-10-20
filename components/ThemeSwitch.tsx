import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { MoonIcon, SunIcon } from '@heroicons/react/outline'
import DropMenu from './DropMenu'
import { MangoIcon } from './icons'
import { useTranslation } from 'next-i18next'

const THEMES = [
  { name: 'Light', icon: <SunIcon className="h-4 w-4" /> },
  { name: 'Dark', icon: <MoonIcon className="h-4 w-4" /> },
  { name: 'Mango', icon: <MangoIcon className="stroke-current h-4 w-4" /> },
]

const ThemeSwitch = () => {
  const { t } = useTranslation('common')
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), [])

  return mounted ? (
    <DropMenu
      button={
        <div className="bg-th-bkg-4 flex items-center justify-center rounded-full w-8 h-8 text-th-fgd-1 focus:outline-none hover:text-th-primary">
          {THEMES.find((t) => t.name === theme).icon}
        </div>
      }
      value={theme}
      onChange={(theme) => setTheme(theme)}
      options={THEMES}
      toolTipContent={t('change-theme')}
    />
  ) : (
    <div className="bg-th-bkg-3 rounded-full w-8 h-8" />
  )
}

export default ThemeSwitch
