import { FunctionComponent, ReactNode } from 'react'
import useMangoStore from '../stores/useMangoStore'
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
  const wallet = useMangoStore((s) => s.wallet.current)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)

  return (
    <div className="flex flex-col items-center rounded-lg px-4 pb-2 text-th-fgd-1">
      <div className="mb-1 h-6 w-6 text-th-primary">{icon}</div>
      <h2 className="mb-1 text-base">{title}</h2>
      {desc ? (
        <p
          className={`text-center ${
            buttonText && onClickButton ? 'mb-1' : 'mb-0'
          }`}
        >
          {desc}
        </p>
      ) : null}
      {buttonText && onClickButton ? (
        <Button
          className="mt-2"
          onClick={onClickButton}
          disabled={!wallet || !mangoGroup}
        >
          {buttonText}
        </Button>
      ) : null}
    </div>
  )
}

export default EmptyState
