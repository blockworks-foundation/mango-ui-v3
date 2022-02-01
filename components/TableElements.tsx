import { Disclosure } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/outline'
import { ReactNode } from 'hoist-non-react-statics/node_modules/@types/react'

export const Table = ({ children }) => (
  <table className="min-w-full divide-y divide-th-bkg-2">{children}</table>
)

export const TrHead = ({ children }) => (
  <tr className="text-th-fgd-3 text-xs">{children}</tr>
)

export const Th = ({ children }) => (
  <th className="px-4 pb-2 text-left font-normal" scope="col">
    {children}
  </th>
)

export const TrBody = ({ children, index }) => (
  <tr className={`${index % 2 === 0 ? `bg-[rgba(255,255,255,0.03)]` : ''}`}>
    {children}
  </tr>
)

export const Td = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <td
    className={`px-4 py-3.5 whitespace-nowrap text-sm text-th-fgd-2 ${className}`}
  >
    {children}
  </td>
)

type ExpandableRowProps = {
  buttonTemplate: React.ReactNode
  index: number
  panelTemplate: React.ReactNode
  rounded?: boolean
}

export const ExpandableRow = ({
  buttonTemplate,
  index,
  panelTemplate,
  rounded,
}: ExpandableRowProps) => {
  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={`${
              index % 2 === 0 ? `bg-th-bkg-3` : `bg-th-bkg-4`
            } default-transition flex items-center justify-between font-normal p-4 text-th-fgd-1 w-full hover:filter hover:brightness-90 focus:outline-none ${
              rounded
                ? open
                  ? 'rounded-b-none'
                  : 'rounded-md'
                : 'rounded-none'
            }`}
          >
            {buttonTemplate}
            <div className="flex items-center justify-end pl-5">
              <ChevronDownIcon
                className={`${
                  open ? 'transform rotate-180' : 'transform rotate-360'
                } default-transition h-5 flex-shrink-0 w-5 text-th-primary`}
              />
            </div>
          </Disclosure.Button>
          <Disclosure.Panel
            className={`${
              index % 2 === 0
                ? `bg-[rgba(255,255,255,0.03)]`
                : `bg-[rgba(255,255,255,0.07)]`
            } px-4 ${
              rounded
                ? open
                  ? 'rounded-b-md'
                  : 'rounded-none'
                : 'rounded-none'
            }`}
          >
            <div className="py-4">{panelTemplate}</div>
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
        index % 2 === 0 ? `bg-th-bkg-3` : `bg-th-bkg-4`
      } default-transition font-normal p-4 rounded-none text-th-fgd-1 w-full`}
    >
      {children}
    </div>
  )
}
