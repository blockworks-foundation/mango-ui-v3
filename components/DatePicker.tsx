import DatePicker from 'react-datepicker/dist/react-datepicker'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/solid'
import Select from './Select'

const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

const MangoDatePicker = ({ date, setDate, ...props }) => {
  const generateArrayOfYears = () => {
    const max = new Date().getFullYear()
    const min = max - (max - 2020)
    const years = []

    for (let i = max; i >= min; i--) {
      years.push(i)
    }
    return years
  }

  const years = generateArrayOfYears()

  return (
    <DatePicker
      renderCustomHeader={({
        date,
        changeYear,
        changeMonth,
        decreaseMonth,
        increaseMonth,
        prevMonthButtonDisabled,
        nextMonthButtonDisabled,
      }) => (
        <div className="flex items-center justify-between px-1">
          <button
            className="default-transition mr-1 text-th-fgd-3 hover:text-th-fgd-1"
            onClick={decreaseMonth}
            disabled={prevMonthButtonDisabled}
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <div className="flex space-x-2">
            <Select
              className="w-28"
              dropdownPanelClassName="text-left"
              value={months[date.getMonth()]}
              onChange={(value) => changeMonth(months.indexOf(value))}
            >
              {months.map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
            <Select
              dropdownPanelClassName="text-left"
              value={date.getFullYear()}
              onChange={(value) => changeYear(value)}
            >
              {years.map((option) => (
                <Select.Option key={option} value={option}>
                  {option}
                </Select.Option>
              ))}
            </Select>
          </div>
          <button
            className="default-transition ml-1 text-th-fgd-3 hover:text-th-fgd-1"
            onClick={increaseMonth}
            disabled={nextMonthButtonDisabled}
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </div>
      )}
      placeholderText="dd/mm/yyyy"
      dateFormat="dd/MM/yyyy"
      selected={date}
      onChange={(date: Date) => setDate(date)}
      className="default-transition h-10 w-full cursor-pointer rounded-md border border-th-bkg-4 bg-th-bkg-1 px-2 text-th-fgd-1 hover:border-th-fgd-4 focus:border-th-fgd-4 focus:outline-none"
      {...props}
    />
  )
}

export default MangoDatePicker
