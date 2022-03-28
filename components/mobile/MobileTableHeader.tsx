type MobileTableHeaderProps = {
  colOneHeader: string
  colTwoHeader: string
  colThreeHeader?: string | null
}

const MobileTableHeader = ({
  colOneHeader,
  colTwoHeader,
  colThreeHeader = null,
}: MobileTableHeaderProps) => {
  return (
    <div className="flex justify-between pb-2 pl-4 pr-12 text-xs text-th-fgd-3">
      <div>{colOneHeader}</div>
      <div>{colTwoHeader}</div>
      {colThreeHeader ? <div>{colThreeHeader}</div> : null}
    </div>
  )
}

export default MobileTableHeader
