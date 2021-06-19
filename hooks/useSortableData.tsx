import { useMemo, useState } from 'react'

export function useSortableData<T>(items: T[], config = null): { items: T[], requestSort: any, sortConfig: any } {
  const [sortConfig, setSortConfig] = useState(config)

  const sortedItems = useMemo(() => {
    const sortableItems = items ? [...items] : []
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (!isNaN(a[sortConfig.key])) {
          return sortConfig.direction === 'ascending'
            ? a[sortConfig.key] - b[sortConfig.key]
            : b[sortConfig.key] - a[sortConfig.key]
        }
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1
        }
        return 0
      })
    }
    return sortableItems
  }, [items, sortConfig])

  const requestSort = (key) => {
    let direction = 'ascending'
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'ascending'
    ) {
      direction = 'descending'
    }
    setSortConfig({ key, direction })
  }

  return { items: sortedItems, requestSort, sortConfig }
}
