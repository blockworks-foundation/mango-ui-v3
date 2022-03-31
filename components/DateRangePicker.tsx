import { ChevronRightIcon } from '@heroicons/react/solid'
import { useTranslation } from 'next-i18next'
import { enAU } from 'date-fns/locale'
import { DateRangePicker } from 'react-nice-dates'
import { Label } from './Input'

const MangoDateRangePicker = ({
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}) => {
  const { t } = useTranslation('common')

  return (
    <DateRangePicker
      startDate={startDate}
      endDate={endDate}
      onStartDateChange={setStartDate}
      onEndDateChange={setEndDate}
      minimumDate={new Date('January 01, 2020 00:00:00')}
      maximumDate={new Date()}
      minimumLength={1}
      format="dd MMM yyyy"
      locale={enAU}
    >
      {({ startDateInputProps, endDateInputProps }) => (
        <div className="date-range flex items-end">
          <div className="w-full">
            <Label>{t('from')}</Label>
            <input
              className="default-transition h-10 w-full rounded-md border border-th-bkg-4 bg-th-bkg-1 px-2 text-th-fgd-1 hover:border-th-fgd-4 focus:border-th-fgd-4 focus:outline-none"
              {...startDateInputProps}
              placeholder="Start Date"
            />
          </div>
          <div className="flex h-10 items-center justify-center">
            <ChevronRightIcon className="mx-1 h-5 w-5 flex-shrink-0 text-th-fgd-3" />
          </div>
          <div className="w-full">
            <Label>{t('to')}</Label>
            <input
              className="default-transition h-10 w-full rounded-md border border-th-bkg-4 bg-th-bkg-1 px-2 text-th-fgd-1 hover:border-th-fgd-4 focus:border-th-fgd-4 focus:outline-none"
              {...endDateInputProps}
              placeholder="End Date"
            />
          </div>
        </div>
      )}
    </DateRangePicker>
  )
}

export default MangoDateRangePicker
