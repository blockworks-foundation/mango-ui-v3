import { Portal } from 'react-portal'

const Modal = ({ isOpen, onClose, children }) => {
  return (
    <Portal>
      <div
        className="fixed z-10 inset-0 overflow-y-auto"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-end min-h-screen px-4 pb-20 text-center sm:block sm:p-0">
          {isOpen ? (
            <div
              className="fixed inset-0 bg-black bg-opacity-70 transition-opacity"
              aria-hidden="true"
              onClick={onClose}
            ></div>
          ) : null}

          <span
            className="hidden sm:inline-block sm:align-middle sm:h-screen"
            aria-hidden="true"
          >
            &#8203;
          </span>

          {isOpen ? (
            <div
              className="inline-block align-bottom bg-th-bkg-2 
              rounded-lg text-left overflow-hidden shadow-lg transform transition-all 
              sm:my-8 sm:align-middle sm:max-w-md sm:w-full"
            >
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
    <div className={`flex items-center justify-between bg-th-bkg-2 py-4 px-4`}>
      {children}
    </div>
  )
}

Modal.Header = Header

export default Modal
