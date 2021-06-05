import { FunctionComponent, ReactNode } from 'react'
import Button from './Button'

interface EmptyStateProps {
  buttonText?: string
  icon: ReactNode
  onClickButton?: () => void
  desc?: string
  title: string
}

const EmptyState: FunctionComponent<EmptyStateProps> = ({
  buttonText,
  icon,
  onClickButton,
  desc,
  title,
}) => {
  return (
    <div className="flex flex-col items-center text-th-fgd-1 px-4 pb-2 rounded-lg">
      <div className="w-6 h-6 mb-1 text-th-primary">{icon}</div>
      <div className="font-bold text-lg pb-1">{title}</div>
      {desc ? <p className="mb-0 text-center">{desc}</p> : null}
      {buttonText && onClickButton ? (
        <Button className="mt-2" onClick={onClickButton}>
          {buttonText}
        </Button>
      ) : null}
    </div>
  )
}

export default EmptyState
