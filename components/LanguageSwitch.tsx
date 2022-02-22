import { useEffect, useState } from 'react'
import { TranslateIcon } from '@heroicons/react/outline'
import DropMenu from './DropMenu'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
import useLocalStorageState from '../hooks/useLocalStorageState'

require('dayjs/locale/en')
require('dayjs/locale/es')
require('dayjs/locale/zh')
require('dayjs/locale/zh-tw')

export const LANGS = [
  { locale: 'en', name: 'english', description: 'english' },
  { locale: 'es', name: 'spanish', description: 'spanish' },
  {
    locale: 'zh_tw',
    name: 'chinese-traditional',
    description: 'traditional chinese',
  },
  { locale: 'zh', name: 'chinese', description: 'simplified chinese' },
]

const LanguageSwitch = () => {
  const router = useRouter()
  const { pathname, asPath, query } = router
  const [mounted, setMounted] = useState(false)
  const [savedLanguage, setSavedLanguage] = useLocalStorageState('language', '')

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), [])

  const handleLangChange = (e) => {
    setSavedLanguage(e)
    router.push({ pathname, query }, asPath, { locale: e })
    dayjs.locale(e == 'zh_tw' ? 'zh-tw' : e)
  }

  return (
    <div id="languages-tip">
      {mounted ? (
        <DropMenu
          button={
            <div className="bg-th-bkg-4 default-transition flex items-center justify-center rounded-full w-8 h-8 text-th-fgd-1 focus:outline-none hover:text-th-primary">
              <TranslateIcon className="h-4 w-4" />
            </div>
          }
          value={savedLanguage}
          onChange={(lang) => handleLangChange(lang)}
          options={LANGS}
        />
      ) : (
        <div className="bg-th-bkg-3 rounded-full w-8 h-8" />
      )}
    </div>
  )
}

export default LanguageSwitch
