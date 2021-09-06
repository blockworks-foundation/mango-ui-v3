type MobileTableHeaderProps = {
  headerTemplate: React.ReactNode
}

const MobileTableHeader = ({ headerTemplate }: MobileTableHeaderProps) => {
  return (
    <div className="grid grid-cols-12 grid-rows-1 gap-4 pb-2 px-3 text-xs">
      {headerTemplate}
    </div>
  )
}

export default MobileTableHeader
