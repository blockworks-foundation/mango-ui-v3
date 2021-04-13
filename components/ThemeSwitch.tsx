import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Listbox } from '@headlessui/react'
import { MoonIcon, SunIcon } from '@heroicons/react/outline'
import MangoIcon from './MangoIcon'

const THEMES = [
  { name: 'Light', icon: <SunIcon /> },
  { name: 'Dark', icon: <MoonIcon /> },
  { name: 'Mango', icon: <MangoIcon className="stroke-current" /> },
]

const ThemeChanger = () => {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <div className={`flex relative`}>
      <Listbox value={theme} onChange={(theme) => setTheme(theme)}>
        {({ open }) => (
          <>
            <Listbox.Button
              className={`bg-transparent rounded w-5 h-5 hover:text-th-primary focus:outline-none`}
            >
              {THEMES.filter((t) => t.name === theme).map((th) => th.icon)}
            </Listbox.Button>
            {open ? (
              <Listbox.Options
                static
                className={`z-20 p-1 absolute right-0 mt-7 bg-th-bkg-3 divide-y divide-th-bkg-3 shadow-lg outline-none rounded-md`}
              >
                {THEMES.map((option) => (
                  <Listbox.Option key={option.name} value={option.name}>
                    {({ selected }) => (
                      <div
                        className={`p-2 hover:bg-th-bkg-1 hover:cursor-pointer tracking-wider ${
                          selected && `text-th-primary`
                        }`}
                      >
                        {option.name}
                      </div>
                    )}
                  </Listbox.Option>
                ))}
              </Listbox.Options>
            ) : null}
          </>
        )}
      </Listbox>
    </div>
  )
}

export default ThemeChanger
