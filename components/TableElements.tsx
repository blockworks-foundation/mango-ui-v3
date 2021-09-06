export const Table = ({ children }) => (
  <table className="min-w-full divide-y divide-th-bkg-2">{children}</table>
)

export const TrHead = ({ children }) => (
  <tr className="text-th-fgd-3 text-xs">{children}</tr>
)

export const Th = ({ children }) => (
  <th className="px-6 py-2 text-left font-normal" scope="col">
    {children}
  </th>
)

export const TrBody = ({ children, index, key }) => (
  <tr
    className={`border-b border-th-bkg-3
    ${index % 2 === 0 ? `bg-th-bkg-4` : `bg-th-bkg-3`}
    `}
    key={key}
  >
    {children}
  </tr>
)

export const Td = ({ children }) => (
  <td className="px-6 py-3.5 whitespace-nowrap text-sm text-th-fgd-1">
    {children}
  </td>
)
