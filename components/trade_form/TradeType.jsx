import Select from '../Select'
import { useTranslation } from 'next-i18next'

const TradeType = ({ value, onChange, offerTriggers = false }) => {
  const { t } = useTranslation('common')
  const TRADE_TYPES = ['Limit', 'Market']
  if (offerTriggers)
    TRADE_TYPES.push(
      'Stop Loss',
      'Stop Limit',
      'Take Profit',
      'Take Profit Limit'
    )

  return (
    <Select
      value={t(value.replace(/\s+/g, '-').toLowerCase())}
      onChange={onChange}
    >
      {TRADE_TYPES.map((type) => (
        <Select.Option key={type} value={type}>
          {t(type.replace(/\s+/g, '-').toLowerCase())}
        </Select.Option>
      ))}
    </Select>
  )
}

export default TradeType
