import { Portal } from 'react-portal'
import { XIcon } from '@heroicons/react/outline'

const Modal = ({
  isOpen,
  onClose,
  children,
  hideClose = false,
  noPadding = false,
  alignTop = false,
}) => {
  return (
    <Portal>
      <div
        className="fixed z-50 inset-0 overflow-y-auto sm:py-8"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center min-h-screen text-center sm:block sm:p-0">
          {isOpen ? (
            <div
              className="fixed inset-0 bg-black bg-opacity-70 transition-opacity"
              aria-hidden="true"
              onClick={onClose}
            ></div>
          ) : null}

          {alignTop ? null : (
            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>
          )}

          {isOpen ? (
            <div
              className={`inline-block bg-th-bkg-2 min-h-screen sm:min-h-full
              sm:rounded-lg text-left ${
                noPadding ? '' : 'px-8 pt-6 pb-6'
              } shadow-lg transform transition-all align-middle sm:max-w-md w-full`}
            >
              {!hideClose ? (
                <div className="">
                  <button
                    onClick={onClose}
                    className={`absolute right-4 top-4 md:right-2 md:top-2 text-th-fgd-1 hover:text-th-primary focus:outline-none`}
                  >
                    <XIcon className={`h-5 w-5`} />
                  </button>
                </div>
              ) : null}
              {children}
            </div>
          ) : null}
        </div>
      </div>
    </Portal>
  )
}

const Header = ({ children }) => {
  return (
    <div className={`flex justify-center bg-th-bkg-2 pb-4`}>{children}</div>
  )
}

Modal.Header = Header

export default Modal
