import { useTranslation } from 'next-i18next'
import Select from '../Select'

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
    <Select value={value} onChange={onChange}>
      {TRADE_TYPES.map((type) => (
        <Select.Option key={type} value={type}>
          {type}
        </Select.Option>
      ))}
    </Select>
  )
}

export default TradeType
