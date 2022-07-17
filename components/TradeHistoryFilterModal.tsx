import { FunctionComponent, useEffect, useMemo, useState } from 'react'
import { RefreshIcon } from '@heroicons/react/solid'
import Input, { Label } from './Input'
import Button, { LinkButton } from './Button'
import Modal from './Modal'
import { ElementTitle } from './styles'
import { useTranslation } from 'next-i18next'
import dayjs from 'dayjs'
import DateRangePicker from './DateRangePicker'
import useMangoStore from 'stores/useMangoStore'
import MultiSelectDropdown from './MultiSelectDropdown'
import InlineNotification from './InlineNotification'

interface TradeHistoryFilterModalProps {
  filters: any
  setFilters: any
  isOpen: boolean
  onClose: () => void
  showApiWarning: boolean
}

const TradeHistoryFilterModal: FunctionComponent<
  TradeHistoryFilterModalProps
> = ({ filters, setFilters, isOpen, onClose, showApiWarning }) => {
  const { t } = useTranslation('common')
  const [newFilters, setNewFilters] = useState({ ...filters })
  const [dateFrom, setDateFrom] = useState<Date | null>(null)
  const [dateTo, setDateTo] = useState<Date | null>(null)
  const [sizeFrom, setSizeFrom] = useState(filters?.size?.values?.from || '')
  const [sizeTo, setSizeTo] = useState(filters?.size?.values?.to || '')
  const [valueFrom, setValueFrom] = useState(filters?.value?.values?.from || '')
  const [valueTo, setValueTo] = useState(filters?.value?.values?.to || '')
  const groupConfig = useMangoStore((s) => s.selectedMangoGroup.config)
  const markets = useMemo(
    () =>
      groupConfig
        ? [...groupConfig.perpMarkets, ...groupConfig.spotMarkets].sort(
            (a, b) => a.name.localeCompare(b.name)
          )
        : [],
    [groupConfig]
  )

  useEffect(() => {
    if (filters?.loadTimestamp?.values?.from) {
      setDateFrom(new Date(filters?.loadTimestamp?.values?.from))
    }

    if (filters?.loadTimestamp?.values?.to) {
      setDateTo(new Date(filters?.loadTimestamp?.values?.to))
    }
  }, [])

  const handleUpdateFilterButtons = (key: string, value: any) => {
    const updatedFilters = { ...newFilters }
    if (Object.prototype.hasOwnProperty.call(updatedFilters, key)) {
      updatedFilters[key].includes(value)
        ? (updatedFilters[key] = updatedFilters[key].filter((v) => v !== value))
        : updatedFilters[key].push(value)
    } else {
      updatedFilters[key] = [value]
    }
    setNewFilters(updatedFilters)
  }

  const toggleOption = ({ id }) => {
    setNewFilters((prevSelected) => {
      const newSelections = prevSelected.marketName
        ? [...prevSelected.marketName]
        : []
      if (newSelections.includes(id)) {
        return {
          ...prevSelected,
          marketName: newSelections.filter((item) => item != id),
        }
      } else {
        newSelections.push(id)
        return { ...prevSelected, marketName: newSelections }
      }
    })
  }

  useEffect(() => {
    if (sizeFrom && sizeTo) {
      // filter should still work if users get from/to backwards
      const from = sizeFrom < sizeTo ? sizeFrom : sizeTo
      const to = sizeTo > sizeFrom ? sizeTo : sizeFrom
      setNewFilters((prevSelected) => {
        return {
          ...prevSelected,
          size: {
            condition: (size) => size >= from && size <= to,
            values: { from: from, to: to },
          },
        }
      })
    }
  }, [sizeFrom, sizeTo])

  useEffect(() => {
    if (valueFrom && valueTo) {
      // filter should still work if users get from/to backwards
      const from = valueFrom < valueTo ? valueFrom : valueTo
      const to = valueTo > valueFrom ? valueTo : valueFrom
      setNewFilters((prevSelected) => {
        return {
          ...prevSelected,
          value: {
            condition: (value) => value >= from && value <= to,
            values: { from: from, to: to },
          },
        }
      })
    }
  }, [valueFrom, valueTo])

  useEffect(() => {
    if (dateFrom && dateTo) {
      const dateFromTimestamp = dayjs(dateFrom).unix() * 1000
      const dateToTimestamp = (dayjs(dateTo).unix() + 86399) * 1000
      // filter should still work if users get from/to backwards
      const from =
        dateFromTimestamp < dateToTimestamp
          ? dateFromTimestamp
          : dateToTimestamp
      const to =
        dateToTimestamp > dateFromTimestamp
          ? dateToTimestamp
          : dateFromTimestamp
      setNewFilters((prevSelected) => {
        return {
          ...prevSelected,
          loadTimestamp: {
            condition: (date) => {
              const timestamp = dayjs(date).unix() * 1000
              return timestamp >= from && timestamp <= to
            },
            values: { from: from, to: to },
          },
        }
      })
    }
  }, [dateFrom, dateTo])

  const handleResetFilters = () => {
    setFilters({})
    setNewFilters({})
    setDateFrom(null)
    setDateTo(null)
    setSizeFrom('')
    setSizeTo('')
    setValueFrom('')
    setValueTo('')
  }

  const updateFilters = (filters) => {
    setFilters(filters)
    onClose()
  }

  return (
    <Modal onClose={onClose} isOpen={isOpen}>
      <Modal.Header>
        <div className="flex w-full items-start justify-between pt-2">
          <ElementTitle noMarginBottom>
            {t('filter-trade-history')}
          </ElementTitle>
          <LinkButton
            className="flex items-center text-th-primary"
            onClick={() => handleResetFilters()}
          >
            <RefreshIcon className="mr-1.5 h-4 w-4" />
            {t('reset')}
          </LinkButton>
        </div>
      </Modal.Header>
      {showApiWarning ? (
        <div className="mt-1 mb-3">
          <InlineNotification
            type="warning"
            desc={t('trade-history-api-warning')}
          />
        </div>
      ) : null}
      <div className="pb-4">
        <p className="font-bold text-th-fgd-1">{t('date')}</p>
        <div className="flex items-center space-x-2">
          <div className="w-full">
            <DateRangePicker
              startDate={dateFrom}
              setStartDate={setDateFrom}
              endDate={dateTo}
              setEndDate={setDateTo}
            />
          </div>
        </div>
      </div>
      <div className="pb-4">
        <Label>{t('markets')}</Label>
        <MultiSelectDropdown
          options={markets}
          selected={newFilters.marketName || []}
          toggleOption={toggleOption}
        />
      </div>
      <div className="mb-4 flex items-center justify-between border-y border-th-bkg-4 py-3">
        <p className="mb-0 font-bold text-th-fgd-1">{t('side')}</p>
        <div className="flex space-x-2">
          <FilterButton
            filters={newFilters}
            filterKey="side"
            onClick={() => handleUpdateFilterButtons('side', 'buy')}
            value="buy"
          />
          <FilterButton
            filters={newFilters}
            filterKey="side"
            onClick={() => handleUpdateFilterButtons('side', 'sell')}
            value="sell"
          />
        </div>
      </div>
      <div className="pb-4">
        <p className="font-bold text-th-fgd-1">{t('size')}</p>
        <div className="flex items-center space-x-2">
          <div className="w-1/2">
            <Label>{t('from')}</Label>
            <Input
              type="number"
              min="0"
              placeholder="0.00"
              value={sizeFrom || ''}
              onChange={(e) => setSizeFrom(e.target.value)}
            />
          </div>
          <div className="w-1/2">
            <Label>{t('to')}</Label>
            <Input
              type="number"
              min="0"
              placeholder="0.00"
              value={sizeTo || ''}
              onChange={(e) => setSizeTo(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="pb-4">
        <p className="font-bold text-th-fgd-1">{t('value')}</p>
        <div className="flex items-center space-x-2">
          <div className="w-1/2">
            <Label>{t('from')}</Label>
            <Input
              type="number"
              min="0"
              placeholder="0.00"
              value={valueFrom || ''}
              onChange={(e) => setValueFrom(e.target.value)}
            />
          </div>
          <div className="w-1/2">
            <Label>{t('to')}</Label>
            <Input
              type="number"
              min="0"
              placeholder="0.00"
              value={valueTo || ''}
              onChange={(e) => setValueTo(e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="mb-6 flex items-center justify-between border-y border-th-bkg-4 py-3">
        <p className="mb-0 font-bold text-th-fgd-1">{t('liquidity')}</p>
        <div className="flex space-x-2">
          <FilterButton
            filters={newFilters}
            filterKey="liquidity"
            onClick={() => handleUpdateFilterButtons('liquidity', 'Maker')}
            value="Maker"
          />
          <FilterButton
            filters={newFilters}
            filterKey="liquidity"
            onClick={() => handleUpdateFilterButtons('liquidity', 'Taker')}
            value="Taker"
          />
        </div>
      </div>
      <Button className="w-full" onClick={() => updateFilters(newFilters)}>
        {Object.keys(filters).length > 0 ? t('update-filters') : t('filter')}
      </Button>
    </Modal>
  )
}

const FilterButton = ({ filters, filterKey, value, onClick }) => {
  const { t } = useTranslation('common')
  return (
    <button
      className={`default-transitions rounded-full border border-th-fgd-3 px-3 py-1 text-xs text-th-fgd-1 ${
        filters[filterKey]?.includes(value) &&
        'border-th-primary bg-th-primary text-th-bkg-1 md:hover:text-th-bkg-1'
      } md:hover:border-th-primary md:hover:text-th-primary`}
      onClick={onClick}
    >
      {t(value.toLowerCase())}
    </button>
  )
}

export default TradeHistoryFilterModal
