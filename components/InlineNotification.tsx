import { FunctionComponent } from 'react'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationIcon,
} from '@heroicons/react/outline'

interface InlineNotificationProps {
  desc?: string
  title?: string
  type: string
}

const InlineNotification: FunctionComponent<InlineNotificationProps> = ({
  desc,
  title,
  type,
}) => (
  <div
    className={`border ${
      type === 'error'
        ? 'border-th-red'
        : type === 'success'
        ? 'border-th-green'
        : 'border-th-orange'
    } flex items-center mb-4 p-2.5 rounded-md`}
  >
    {type === 'error' ? (
      <ExclamationCircleIcon className="flex-shrink-0 h-5 w-5 mr-2 text-th-red" />
    ) : null}
    {type === 'success' ? (
      <CheckCircleIcon className="flex-shrink-0 h-5 w-5 mr-2 text-th-green" />
    ) : null}
    {type === 'warning' ? (
      <ExclamationIcon className="flex-shrink-0 h-5 w-5 mr-2 text-th-orange" />
    ) : null}
    <div>
      <div className="pb-1 text-th-fgd-1">{title}</div>
      <div className="font-normal text-th-fgd-3 text-xs">{desc}</div>
    </div>
  </div>
)

export default InlineNotification
