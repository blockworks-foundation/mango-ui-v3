import { useMemo } from 'react'

interface Filters {
  [key: string]: any
  value?: any
}

export function useFilteredData<T>(items: T[], filters: Filters) {
  const filteredItems = useMemo(() => {
    const filtered = items.filter((item) => {
      let validItem = true

      for (const [key, value] of Object.entries(filters)) {
        if (Array.isArray(value)) {
          if (!value.includes(item[key]) && value.length > 0) {
            validItem = false
          }
        } else if (Object.prototype.hasOwnProperty.call(value, 'condition')) {
          if (!value.condition(item[key])) {
            validItem = false
          }
        } else {
          if (value !== item[key]) validItem = false
        }
      }

      return validItem
    })
    return filtered
  }, [items])

  return filteredItems
}
