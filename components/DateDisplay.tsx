import React from 'react'
import dayjs from 'dayjs'

interface DateDisplayProps {
  date: string
}

export const DateDisplay: React.FC<DateDisplayProps> = ({ date }) => {
  return (
    <div>
      <div>{dayjs(date).format('DD MMM YYYY')}</div>
      <div className="text-left">{dayjs(date).format('h:mma')}</div>
    </div>
  )
}
