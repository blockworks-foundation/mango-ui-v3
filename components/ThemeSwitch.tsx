import { useEffect, useState } from 'react'
import xw from 'xwind'
import { useTheme } from 'next-themes'

const themes = [{ name: 'light' }, { name: 'dark' }, { name: 'mango' }]

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
      css={xw`px-3 py-1 text-sm bg-th-bkg-1 border border-th-fgd-4 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md`}
      onChange={(e) => setTheme(e.currentTarget.value)}
      value={theme}
    >
      <option value="">Select Theme</option>
      {themes.map((t) => (
        <option key={t.name.toLowerCase()} value={t.name.toLowerCase()}>
          {t.name}
        </option>
      ))}
    </select>
  )
}

export default ThemeChanger
