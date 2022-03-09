import { TemplateIcon } from '@heroicons/react/outline'
import { defaultLayouts, GRID_LAYOUT_KEY } from './TradePageGrid'
import useLocalStorageState from '../hooks/useLocalStorageState'
import Tooltip from './Tooltip'
import { IconButton } from './Button'
import { useTranslation } from 'next-i18next'

const ResetLayout = ({ className = '' }) => {
  const { t } = useTranslation('common')
  const [, setSavedLayouts] = useLocalStorageState(
    GRID_LAYOUT_KEY,
    defaultLayouts
  )

  const handleResetLayout = () => {
    setSavedLayouts(defaultLayouts)
  }

  return (
    <div className={`relative inline-flex ${className}`}>
      <Tooltip content={t('tooltip-reset-layout')} className="py-1 text-xs">
        <IconButton onClick={handleResetLayout}>
          <TemplateIcon className="h-4 w-4" />
        </IconButton>
      </Tooltip>
    </div>
  )
}

export default ResetLayout
