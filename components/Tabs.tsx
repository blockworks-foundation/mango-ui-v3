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
    <div className={`relative mb-8 border-b border-th-fgd-4`}>
      <div
        className={`default-transition absolute bottom-[-1px] left-0 h-0.5 bg-th-primary`}
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
              className={`default-transition relative flex cursor-pointer justify-center whitespace-nowrap pb-4 font-bold hover:opacity-100
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
  <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-th-bkg-4 p-1 text-xxs text-th-fgd-2">
    {count}
  </span>
)
