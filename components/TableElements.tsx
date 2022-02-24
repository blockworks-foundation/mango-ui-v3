import { Disclosure, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/solid'
import { Fragment, ReactNode } from 'react'

export const Table = ({ children }) => (
  <table className="min-w-full">{children}</table>
)

export const TrHead = ({ children }) => (
  <tr className="text-th-fgd-3 text-xs">{children}</tr>
)

export const Th = ({ children }) => (
  <th className="px-4 pb-2 text-left font-normal" scope="col">
    {children}
  </th>
)

export const TrBody = ({ children }) => (
  <tr className="border-b border-th-bkg-4">{children}</tr>
)

export const Td = ({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) => (
  <td className={`px-4 h-16 text-sm text-th-fgd-2 ${className}`}>{children}</td>
)

type ExpandableRowProps = {
  buttonTemplate: React.ReactNode
  panelTemplate: React.ReactNode
  rounded?: boolean
}

export const ExpandableRow = ({
  buttonTemplate,
  panelTemplate,
  rounded,
}: ExpandableRowProps) => {
  return (
    <Disclosure>
      {({ open }) => (
        <>
          <Disclosure.Button
            className={`border-t border-th-bkg-4 default-transition flex items-center justify-between font-normal p-4 text-th-fgd-1 w-full hover:bg-th-bkg-4 focus:outline-none ${
              rounded
                ? open
                  ? 'rounded-b-none'
                  : 'rounded-md'
                : 'rounded-none'
            }`}
          >
            {buttonTemplate}
            <div className="flex items-center justify-end pl-4">
              <ChevronDownIcon
                className={`${
                  open ? 'transform rotate-180' : 'transform rotate-360'
                } default-transition h-5 flex-shrink-0 w-5 text-th-fgd-1`}
              />
            </div>
          </Disclosure.Button>
          <Transition
            appear={true}
            show={open}
            as={Fragment}
            enter="transition-all ease-in duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition ease-out"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Disclosure.Panel>
              <div className="pb-4 pt-2 px-4">{panelTemplate}</div>
            </Disclosure.Panel>
          </Transition>
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
