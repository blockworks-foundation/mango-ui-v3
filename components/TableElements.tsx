import { Disclosure } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/outline'

export const Table = ({ children }) => (
  <table className="min-w-full divide-y divide-th-bkg-2">{children}</table>
)

export const TrHead = ({ children }) => (
  <tr className="text-th-fgd-3 text-xs">{children}</tr>
)

export const Th = ({ children }) => (
  <th className="px-6 pb-2 text-left font-normal" scope="col">
    {children}
  </th>
)

export const TrBody = ({ children, index }) => (
  <tr
    className={`border-b border-th-bkg-3
    ${
      index % 2 === 0
        ? `bg-[rgba(255,255,255,0.03)]`
        : `bg-[rgba(255,255,255,0.07)]`
    }
    `}
  >
    {children}
  </tr>
)

export const Td = ({ children }) => (
  <td className="px-6 py-3.5 whitespace-nowrap text-sm text-th-fgd-1">
    {children}
  </td>
)

type ExpandableRowProps = {
  buttonTemplate: React.ReactNode
  index: number
  panelTemplate: React.ReactNode
}

export const ExpandableRow = ({
  buttonTemplate,
  index,
  panelTemplate,
}: ExpandableRowProps) => {
  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={`${
              index % 2 === 0
                ? `bg-[rgba(255,255,255,0.03)]`
                : `bg-[rgba(255,255,255,0.07)]`
            } default-transition font-normal p-4 rounded-none text-th-fgd-1 w-full hover:bg-th-bkg-4 focus:outline-none`}
          >
            <div className="grid grid-cols-12 grid-rows-1">
              {buttonTemplate}
              <div className="flex items-center justify-end">
                <ChevronDownIcon
                  className={`${
                    open ? 'transform rotate-180' : 'transform rotate-360'
                  } default-transition h-5 flex-shrink-0 w-5 text-th-primary`}
                />
              </div>
            </div>
          </Disclosure.Button>
          <Disclosure.Panel
            className={`${
              index % 2 === 0
                ? `bg-[rgba(255,255,255,0.03)]`
                : `bg-[rgba(255,255,255,0.07)]`
            } px-4`}
          >
            <div className="border-t border-[rgba(255,255,255,0.1)] grid grid-cols-2 grid-rows-1 gap-4 py-4">
              {panelTemplate}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}

type RowProps = {
  children: React.ReactNode
  index: number
}

export const Row = ({ children, index }: RowProps) => {
  return (
    <div
      className={`${
        index % 2 === 0
          ? `bg-[rgba(255,255,255,0.03)]`
          : `bg-[rgba(255,255,255,0.07)]`
      } default-transition font-normal p-4 rounded-none text-th-fgd-1 w-full`}
    >
      <div className="grid grid-cols-12 grid-rows-1 gap-4">{children}</div>
    </div>
  )
}
