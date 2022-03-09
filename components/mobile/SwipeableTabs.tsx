import { useTranslation } from 'next-i18next'

const SwipeableTabs = ({ onChange, tabs, tabIndex }) => {
  const { t } = useTranslation('common')

  return (
    <div className={`relative mb-4 border-b border-th-fgd-4`}>
      <div
        className={`default-transition absolute bottom-[-1px] left-0 h-0.5 bg-th-primary`}
        style={{
          maxWidth: '176px',
          transform: `translateX(${tabIndex * 100}%)`,
          width: `${100 / tabs.length}%`,
        }}
      />
      <nav className="-mb-px flex" aria-label="Tabs">
        {tabs.map((tabName, i) => (
          <a
            key={tabName}
            onClick={() => onChange(i)}
            className={`default-transition relative flex cursor-pointer justify-center whitespace-nowrap pb-4 pt-2 font-semibold hover:opacity-100
                  ${
                    tabIndex === i
                      ? `text-th-primary`
                      : `text-th-fgd-4 hover:text-th-primary`
                  }
                `}
            style={{ width: `${100 / tabs.length}%`, maxWidth: '176px' }}
          >
            {t(tabName.toLowerCase().replace(' ', '-'))}
          </a>
        ))}
      </nav>
    </div>
  )
}

export default SwipeableTabs
