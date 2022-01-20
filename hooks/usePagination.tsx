import { useReducer } from 'react'
const { max, min, ceil } = Math

const getTotalPages = (perPage, data) => ceil(data.length / perPage) - 1

const getNextPage = (page, perPage, data) =>
  min(Math.ceil(data.length / perPage) - 1, page + 1)

const getPreviousPage = (page) => max(0, page - 1)

const extractPage = (page, perPage, data) => {
  const from = page * perPage
  const to = (page + 1) * perPage

  return data ? data.slice(from, to) : []
}

const paginationReducer = (state, action) => {
  switch (action.type) {
    case 'SET_DATA': {
      const data = action.payload.data
      const { page, perPage } = state
      const paginated = extractPage(page, perPage, data)
      return { ...state, data, paginated }
    }
    case 'FIRST_PAGE': {
      const { perPage, data } = state
      const page = 0
      const paginated = extractPage(0, perPage, data)

      return {
        ...state,
        page,
        paginated,
      }
    }
    case 'LAST_PAGE': {
      const { perPage, data } = state
      const page = getTotalPages(perPage, data)
      const paginated = extractPage(page, perPage, data)

      return {
        ...state,
        page,
        paginated,
      }
    }
    case 'NEXT_PAGE': {
      const { data, perPage } = state
      const page = getNextPage(state.page, perPage, data)
      const paginated = extractPage(page, perPage, data)

      return {
        ...state,
        page,
        paginated,
      }
    }
    case 'PREVIOUS_PAGE': {
      const page = getPreviousPage(state.page)
      const { data, perPage } = state
      const paginated = extractPage(page, perPage, data)

      return {
        ...state,
        page,
        paginated,
      }
    }
    case 'GOTO_PAGE': {
      const { data, perPage } = state
      const page = action.payload.page
      const paginated = extractPage(page, perPage, data)

      return {
        ...state,
        page,
        paginated,
      }
    }
    case 'PER_PAGE': {
      const { data } = state
      const perPage = action.payload.perPage
      const page = Math.min(state.page, getTotalPages(perPage, data))
      const paginated = extractPage(page, perPage, data)

      return {
        ...state,
        perPage,
        page,
        paginated,
      }
    }
  }
}

const usePagination = (data: Array<any>, opts = {}) => {
  const { perPage, page } = { page: 0, perPage: 10, ...opts }

  const [state, dispatch] = useReducer(paginationReducer, {
    data,
    page,
    perPage,
    paginated: extractPage(page, perPage, data),
  })

  return {
    firstPage: () => dispatch({ type: 'FIRST_PAGE' }),
    lastPage: () => dispatch({ type: 'LAST_PAGE' }),
    nextPage: () => dispatch({ type: 'NEXT_PAGE' }),
    previousPage: () => dispatch({ type: 'PREVIOUS_PAGE' }),
    gotoPage: (x) => dispatch({ type: 'GOTO_PAGE', payload: { page: x } }),
    setPerPage: (x) => dispatch({ type: 'PER_PAGE', payload: { perPage: x } }),
    setData: (x) => dispatch({ type: 'SET_DATA', payload: { data: x } }),
    data: state.data,
    totalPages: ceil(state.data.length / state.perPage),
    paginatedData: state.paginated,
    page: state.page + 1,
    perPage: state.perPage,
  }
}

export default usePagination
