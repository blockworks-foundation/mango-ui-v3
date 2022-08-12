import React from 'react'
import { Portal } from 'react-portal'
import { XIcon } from '@heroicons/react/solid'

const Modal: any = React.forwardRef<any, any>((props, ref) => {
  const {
    isOpen,
    onClose,
    children,
    hideClose = false,
    noPadding = false,
    alignTop = false,
    className = '',
  } = props

  return (
    <Portal>
      <div
        className="fixed inset-0 z-40 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex min-h-screen items-center text-center sm:block sm:p-0">
          {isOpen ? (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
              aria-hidden="true"
              onClick={onClose}
            ></div>
          ) : null}

          {alignTop ? null : (
            <span
              className="hidden sm:inline-block sm:h-screen sm:align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>
          )}

          {isOpen ? (
            <div
              className={`inline-block min-h-screen border border-th-bkg-3 bg-th-bkg-1 text-left
              sm:min-h-full sm:rounded-lg ${
                noPadding ? '' : 'px-8 pt-6 pb-6'
              } w-full transform align-middle shadow-lg transition-all sm:max-w-md ${className}`}
              ref={ref}
            >
              {!hideClose ? (
                <div className="">
                  <button
                    onClick={onClose}
                    className={`absolute right-4 top-4 text-th-fgd-4 focus:outline-none md:right-2 md:top-2 md:hover:text-th-primary`}
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
})

const Header = ({ children }) => {
  return <div className={`flex flex-col items-center pb-2`}>{children}</div>
}

Modal.Header = Header

export default Modal
