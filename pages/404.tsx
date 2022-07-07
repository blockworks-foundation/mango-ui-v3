import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { RektIcon } from '../components/icons'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'delegate'])),
      // Will be passed to the page component as props
    },
  }
}

export default function Custom404() {
  const { t } = useTranslation('common')
  return (
    <div
      className="mx-auto flex max-w-xl flex-col items-center justify-center text-center"
      style={{ height: 'calc(100vh - 80px)' }}
    >
      <RektIcon className="mb-6 h-14 w-auto -rotate-6 transform text-th-red" />
      <span className="text-lg font-bold text-th-fgd-4">404</span>
      <h1 className="mt-1 text-3xl text-th-fgd-1 sm:text-4xl">
        {t('404-heading')}
      </h1>
      <p className="mt-2 text-lg text-th-fgd-4">{t('404-description')}</p>
    </div>
  )
}
