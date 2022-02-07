import { FunctionComponent } from 'react'
import { useTranslation } from 'next-i18next'

interface TabsProps {
  activeTab: string
  onChange: (x) => void
  showCount?: Array<ShowCount>
  tabs: Array<string>
}

interface ShowCount {
  tabName: string
  count: number
}

const Tabs: FunctionComponent<TabsProps> = ({
  activeTab,
  onChange,
  showCount,
  tabs,
}) => {
  const { t } = useTranslation('common')

  return (
    <div className={`border-b border-th-fgd-4 mb-4 relative`}>
      <div
        className={`absolute bg-th-primary bottom-[-1px] default-transition left-0 h-0.5`}
        style={{
          maxWidth: '176px',
          transform: `translateX(${
            tabs.findIndex((v) => v === activeTab) * 100
          }%)`,
          width: `${100 / tabs.length}%`,
        }}
      />
      <nav className="-mb-px flex" aria-label="Tabs">
        {tabs.map((tabName) => {
          const tabCount = showCount
            ? showCount.find((e) => e.tabName === tabName)
            : null
          return (
            <a
              key={tabName}
              onClick={() => onChange(tabName)}
              className={`cursor-pointer default-transition flex justify-center pb-4 relative whitespace-nowrap hover:opacity-100
                    ${
                      activeTab === tabName
                        ? `text-th-primary`
                        : `text-th-fgd-4 hover:text-th-primary`
                    }
                  `}
              style={{ width: `${100 / tabs.length}%`, maxWidth: '176px' }}
            >
              {t(tabName.toLowerCase().replace(/\s/g, '-'))}
              {tabCount && tabCount.count > 0 ? (
                <Count count={tabCount.count} />
              ) : null}
            </a>
          )
        })}
      </nav>
    </div>
  )
}

export default Tabs

const Count = ({ count }) => (
  <span className="h-5 w-5 ml-2 p-1 bg-th-bkg-4 inline-flex rounded-full items-center justify-center text-th-fgd-2 text-xxs">
    {count}
  </span>
)
