import { useEffect, useState } from 'react'
import { TranslateIcon } from '@heroicons/react/outline'
import DropMenu from './DropMenu'
import { useRouter } from 'next/router'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { useTranslation } from 'next-i18next'

const LANGS = [
  { locale: 'en', name: 'English', description: 'english' },
  { locale: 'zh_tw', name: '繁體中文', description: 'traditional chinese' },
  { locale: 'zh', name: '简体中文', description: 'simplified chinese' },
]

const LanguageSwitch = () => {
  const { t } = useTranslation('common')
  const router = useRouter()
  const { pathname, asPath, query } = router
  const [mounted, setMounted] = useState(false)
  const [savedLanguage, setSavedLanguage] = useLocalStorageState('language', '')

  // When mounted on client, now we can show the UI
  useEffect(() => setMounted(true), [])

  useEffect(() => {
    savedLanguage
      ? router.push({ pathname, query }, asPath, { locale: savedLanguage })
      : null
  }, [savedLanguage])

  const handleLangChange = (e) => {
    setSavedLanguage(e)
  }

  return mounted ? (
    <DropMenu
      button={
        <div className="bg-th-bkg-4 flex items-center justify-center rounded-full w-8 h-8 text-th-fgd-1 focus:outline-none hover:text-th-primary">
          <TranslateIcon className="h-4 w-4" />
        </div>
      }
      value={savedLanguage}
      onChange={(lang) => handleLangChange(lang)}
      options={LANGS}
      toolTipContent={t('change-language')}
    />
  ) : (
    <div className="bg-th-bkg-3 rounded-full w-8 h-8" />
  )
}

export default LanguageSwitch
