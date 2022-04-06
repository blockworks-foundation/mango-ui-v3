import {
  Fragment,
  FunctionComponent,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { RefreshIcon } from '@heroicons/react/outline'
import { ChevronDownIcon } from '@heroicons/react/solid'
import Input, { Label } from './Input'
import Button, { LinkButton } from './Button'
import Modal from './Modal'
import { ElementTitle } from './styles'
import { useTranslation } from 'next-i18next'
import { Popover, Transition } from '@headlessui/react'
import Checkbox from './Checkbox'
import dayjs from 'dayjs'
import DateRangePicker from './DateRangePicker'
import useMangoStore from 'stores/useMangoStore'

interface TradeHistoryFilterModalProps {
  filters: any
  setFilters: any
  isOpen: boolean
  onClose: () => void
}

const TradeHistoryFilterModal: FunctionComponent<
  TradeHistoryFilterModalProps
> = ({ filters, setFilters, isOpen, onClose }) => {
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
            condition: (size) =>
              parseFloat(size) >= from && parseFloat(size) <= to,
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
        'border-th-primary bg-th-primary text-th-bkg-1 hover:text-th-bkg-1'
      } hover:border-th-primary hover:text-th-primary`}
      onClick={onClick}
    >
      {t(value.toLowerCase())}
    </button>
  )
}

const MultiSelectDropdown = ({ options, selected, toggleOption }) => {
  const { t } = useTranslation('common')
  return (
    <Popover className="relative">
      {({ open }) => (
        <div className="flex flex-col">
          <Popover.Button
            className={`default-transition rounded-md border bg-th-bkg-1 p-3 text-th-fgd-1 hover:border-th-fgd-4 ${
              open ? 'border-th-fgd-4' : 'border-th-bkg-4'
            }`}
          >
            <div className={`flex items-center justify-between`}>
              <span>
                {t('filters-selected', { selectedFilters: selected.length })}
              </span>
              <ChevronDownIcon
                className={`default-transition ml-0.5 h-5 w-5 ${
                  open ? 'rotate-180 transform' : 'rotate-360 transform'
                }`}
                aria-hidden="true"
              />
            </div>
          </Popover.Button>
          <Transition
            appear={true}
            show={open}
            as={Fragment}
            enter="transition-all ease-in duration-200"
            enterFrom="opacity-0 transform scale-75"
            enterTo="opacity-100 transform scale-100"
            leave="transition ease-out duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Popover.Panel className="absolute top-12 z-10 h-72 w-full overflow-y-auto">
              <div className="relative space-y-2.5 rounded-md bg-th-bkg-3 p-3">
                {options.map((option) => {
                  const isSelected = selected.includes(option.name)
                  return (
                    <Checkbox
                      checked={isSelected}
                      className="mr-2"
                      key={option.name}
                      onChange={() => toggleOption({ id: option.name })}
                    >
                      {option.name}
                    </Checkbox>
                  )
                })}
              </div>
            </Popover.Panel>
          </Transition>
        </div>
      )}
    </Popover>
  )
}

export default TradeHistoryFilterModal
