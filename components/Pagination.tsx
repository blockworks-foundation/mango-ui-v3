import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/solid'

export default function Pagination({
  page,
  totalPages,
  firstPage,
  lastPage,
  nextPage,
  previousPage,
}) {
  return (
    <div className="flex mt-4 items-center justify-end">
      <div className="flex justify-center">
        <button
          onClick={firstPage}
          disabled={page === 1}
          className={`bg-th-bkg-4 px-1 py-1 ${
            page !== 1
              ? 'hover:text-th-primary hover:cursor-pointer'
              : 'hover:cursor-not-allowed'
          } disabled:text-th-fgd-4`}
        >
          <ChevronDoubleLeftIcon className={`w-5 h-5`} />
        </button>
        <button
          onClick={previousPage}
          disabled={page === 1}
          className={`bg-th-bkg-4 px-1 py-1 ml-2 ${
            page !== 1
              ? 'hover:text-th-primary hover:cursor-pointer'
              : 'hover:cursor-not-allowed'
          } disabled:text-th-fgd-4`}
        >
          <ChevronLeftIcon className={`w-5 h-5`} />
        </button>
      </div>
      <div className="ml-2">
        {page} / {totalPages}
      </div>
      <div className="flex justify-center">
        <button
          onClick={nextPage}
          disabled={page === totalPages}
          className={`px-1 py-1 bg-th-bkg-4 ml-2 ${
            page !== totalPages
              ? 'hover:text-th-primary hover:cursor-pointer'
              : 'hover:cursor-not-allowed'
          } disabled:text-th-fgd-4`}
        >
          <ChevronRightIcon className={`w-5 h-5`} />
        </button>
        <button
          onClick={lastPage}
          disabled={page === totalPages}
          className={`px-1 py-1 bg-th-bkg-4 ml-2 ${
            page !== totalPages
              ? 'hover:text-th-primary hover:cursor-pointer'
              : 'hover:cursor-not-allowed'
          } disabled:text-th-fgd-4`}
        >
          <ChevronDoubleRightIcon className={`w-5 h-5`} />
        </button>
      </div>
    </div>
  )
}
