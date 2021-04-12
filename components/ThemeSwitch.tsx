import { useEffect, useState } from 'react'
import xw from 'xwind'
import { useTheme } from 'next-themes'

const THEMES = [
  { name: 'light', display: 'Light' },
  { name: 'dark', display: 'Dark' },
  { name: 'mango', display: 'Mango' },
]

const ThemeChanger = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <select
      name="theme"
      id="theme-select"
      css={xw`px-3 py-1 text-sm bg-th-bkg-1 border border-th-fgd-4 focus:outline-none focus:ring-th-primary focus:border-th-primary rounded-md`}
      onChange={(e) => setTheme(e.currentTarget.value)}
      value={theme}
    >
      <option value="">Select Theme</option>
      {THEMES.map((t) => (
        <option key={t.name.toLowerCase()} value={t.name.toLowerCase()}>
          {t.display}
        </option>
      ))}
    </select>
  )
}

export default ThemeChanger
