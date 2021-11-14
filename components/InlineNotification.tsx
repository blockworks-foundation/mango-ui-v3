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
    } flex items-center p-2 rounded-md`}
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
    {type === 'info' ? (
      <InformationCircleIcon className="flex-shrink-0 h-5 w-5 mr-2 text-th-fgd-3" />
    ) : null}
    <div>
      <div className="text-th-fgd-3">{title}</div>
      <div
        className={`${
          title && desc && 'pt-1'
        } font-normal text-xs text-th-fgd-3`}
      >
        {desc}
      </div>
    </div>
  </div>
)

export default InlineNotification
