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
    <div className="mt-4 flex items-center justify-end">
      <div className="flex justify-center">
        <button
          onClick={firstPage}
          disabled={page === 1}
          className={`bg-th-bkg-4 px-1 py-1 ${
            page !== 1
              ? 'md:hover:cursor-pointer md:hover:text-th-primary'
              : 'md:hover:cursor-not-allowed'
          } disabled:text-th-fgd-4`}
        >
          <ChevronDoubleLeftIcon className={`h-5 w-5`} />
        </button>
        <button
          onClick={previousPage}
          disabled={page === 1}
          className={`ml-2 bg-th-bkg-4 px-1 py-1 ${
            page !== 1
              ? 'md:hover:cursor-pointer md:hover:text-th-primary'
              : 'md:hover:cursor-not-allowed'
          } disabled:text-th-fgd-4`}
        >
          <ChevronLeftIcon className={`h-5 w-5`} />
        </button>
      </div>
      <div className="ml-2">
        {page} / {totalPages}
      </div>
      <div className="flex justify-center">
        <button
          onClick={nextPage}
          disabled={page === totalPages}
          className={`ml-2 bg-th-bkg-4 px-1 py-1 ${
            page !== totalPages
              ? 'md:hover:cursor-pointer md:hover:text-th-primary'
              : 'md:hover:cursor-not-allowed'
          } disabled:text-th-fgd-4`}
        >
          <ChevronRightIcon className={`h-5 w-5`} />
        </button>
        <button
          onClick={lastPage}
          disabled={page === totalPages}
          className={`ml-2 bg-th-bkg-4 px-1 py-1 ${
            page !== totalPages
              ? 'md:hover:cursor-pointer md:hover:text-th-primary'
              : 'md:hover:cursor-not-allowed'
          } disabled:text-th-fgd-4`}
        >
          <ChevronDoubleRightIcon className={`h-5 w-5`} />
        </button>
      </div>
    </div>
  )
}
