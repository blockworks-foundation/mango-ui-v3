type MobileTableHeaderProps = {
  colOneHeader: string
  colTwoHeader: string
  colThreeHeader?: string
}

const MobileTableHeader = ({
  colOneHeader,
  colTwoHeader,
  colThreeHeader = null,
}: MobileTableHeaderProps) => {
  return (
    <div className="flex justify-between pb-2 pl-4 pr-14 text-th-fgd-3 text-xs">
      <div>{colOneHeader}</div>
      <div>{colTwoHeader}</div>
      {colThreeHeader ? <div>{colThreeHeader}</div> : null}
    </div>
  )
}

export default MobileTableHeader
