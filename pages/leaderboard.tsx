import LeaderboardTable from '../components/LeaderboardTable'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import { useState } from 'react'
import ButtonGroup from 'components/ButtonGroup'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [
        'common',
        'delegate',
        'profile',
      ])),
      // Will be passed to the page component as props
    },
  }
}

const leaderboardRangePresets = [
  { label: '7d', value: '7' },
  { label: '30d', value: '29' },
  { label: 'All', value: '9999' },
]
const leaderboardRangePresetLabels = leaderboardRangePresets.map((x) => x.label)
const leaderboardRangePresetValues = leaderboardRangePresets.map((x) => x.value)

export default function Leaderboard() {
  const { t } = useTranslation('common')
  const [leaderboardRange, setLeaderboardRange] = useState('29')

  return (
    <div>
      <div className="flex flex-col pt-6 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className={`mb-4 text-2xl font-semibold text-th-fgd-1 sm:mb-0`}>
          {t('leaderboard')}
        </h1>
        <div className="w-full sm:ml-auto sm:w-56">
          <ButtonGroup
            activeValue={leaderboardRange}
            className="h-8"
            onChange={(r) => setLeaderboardRange(r)}
            values={leaderboardRangePresetValues}
            names={leaderboardRangePresetLabels}
          />
        </div>
      </div>
      <LeaderboardTable range={leaderboardRange} />
    </div>
  )
}
