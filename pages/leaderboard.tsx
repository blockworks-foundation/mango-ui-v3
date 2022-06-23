import LeaderboardTable from '../components/LeaderboardTable'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common', 'profile'])),
      // Will be passed to the page component as props
    },
  }
}

export default function Leaderboard() {
  const { t } = useTranslation('common')

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <div className="flex flex-col py-4 sm:flex-row md:pb-4 md:pt-10">
        <h1 className={`mb-4 text-2xl font-semibold text-th-fgd-1 sm:mb-0`}>
          {t('leaderboard')}
        </h1>
      </div>
      <LeaderboardTable />
    </div>
  )
}
