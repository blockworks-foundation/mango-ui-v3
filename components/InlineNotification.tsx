import { FunctionComponent } from 'react'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationIcon,
  InformationCircleIcon,
} from '@heroicons/react/outline'

interface InlineNotificationProps {
  desc?: string | (() => string)
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
        : type === 'info'
        ? 'border-th-bkg-4'
        : 'border-th-orange'
    } flex items-center rounded-md p-2`}
  >
    {type === 'error' ? (
      <ExclamationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0 text-th-red" />
    ) : null}
    {type === 'success' ? (
      <CheckCircleIcon className="mr-2 h-5 w-5 flex-shrink-0 text-th-green" />
    ) : null}
    {type === 'warning' ? (
      <ExclamationIcon className="mr-2 h-5 w-5 flex-shrink-0 text-th-orange" />
    ) : null}
    {type === 'info' ? (
      <InformationCircleIcon className="mr-2 h-5 w-5 flex-shrink-0 text-th-fgd-3" />
    ) : null}
    <div>
      <div className="text-th-fgd-3">{title}</div>
      <div
        className={`${
          title && desc && 'pt-1'
        } text-left text-xs font-normal text-th-fgd-3`}
      >
        {desc}
      </div>
    </div>
  </div>
)

export default InlineNotification
