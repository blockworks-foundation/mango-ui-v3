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
    <div className="flex flex-col items-center text-th-fgd-1 px-4 pb-2 rounded-lg">
      <div className="w-6 h-6 mb-1 text-th-primary">{icon}</div>
      <h2 className="text-base mb-1">{title}</h2>
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
