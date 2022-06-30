import * as MonoIcons from './icons'
import { QuestionMarkCircleIcon } from '@heroicons/react/outline'
import { useTranslation } from 'next-i18next'

const TabButtons = ({
  tabs,
  activeTab,
  showSymbolIcon,
  onClick,
}: {
  tabs: Array<{ label: string; key: string }>
  activeTab: string
  showSymbolIcon?: boolean
  onClick: (x) => void
}) => {
  const { t } = useTranslation('common')
  const renderSymbolIcon = (s) => {
    const iconName = `${s.slice(0, 1)}${s.slice(1, 4).toLowerCase()}MonoIcon`
    const SymbolIcon = MonoIcons[iconName] || QuestionMarkCircleIcon
    return <SymbolIcon className="mr-1.5 h-3.5 w-auto" />
  }
  return (
    <div className="flex flex-wrap">
      {tabs.map((tab) => (
        <div
          className={`default-transition mb-2 mr-2 flex cursor-pointer items-center rounded-full px-3 py-2 font-bold leading-none ring-1 ring-inset ${
            tab.key === activeTab
              ? `text-th-primary ring-th-primary`
              : `text-th-fgd-4 ring-th-fgd-4 hover:text-th-fgd-3 hover:ring-th-fgd-3`
          } ${showSymbolIcon ? 'uppercase' : ''}
    `}
          onClick={() => onClick(tab.key)}
          role="button"
          key={tab.key}
        >
          {showSymbolIcon ? renderSymbolIcon(tab.label) : null}
          {t(tab.label.toLowerCase().replace(/\s/g, '-'))}
        </div>
      ))}
    </div>
  )
}

export default TabButtons
