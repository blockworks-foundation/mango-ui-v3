import xw from 'xwind'
import { Portal } from 'react-portal'

const Modal = ({ isOpen, onClose, children }) => {
  return (
    <Portal>
      <div
        css={xw`fixed z-10 inset-0 overflow-y-auto`}
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
      >
        <div
          css={xw`flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0`}
        >
          {isOpen ? (
            <div
              css={xw`fixed inset-0 bg-black bg-opacity-20 transition-opacity`}
              aria-hidden="true"
              onClick={onClose}
            ></div>
          ) : null}

          <span
            css={xw`hidden sm:inline-block sm:align-middle sm:h-screen`}
            aria-hidden="true"
          >
            &#8203;
          </span>

          {isOpen ? (
            <div
              css={xw`inline-block align-bottom bg-mango-dark border border-mango-dark-light rounded-lg text-left overflow-hidden shadow-lg transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}
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
    <div css={xw`flex items-center bg-mango-dark-light py-4 px-4`}>
      {children}
    </div>
  )
}

Modal.Header = Header

export default Modal
