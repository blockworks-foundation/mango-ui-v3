// import { useState } from 'react'
import xw from 'xwind'
import { Portal } from 'react-portal'
import { Button } from './styles'

const Modal = ({ isOpen, onClose }) => {
  const handleClick = () => {
    onClose()
  }

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
              css={xw`fixed inset-0 bg-black bg-opacity-40 transition-opacity`}
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
              css={xw`inline-block align-bottom bg-mango-dark rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full`}
            >
              <div css={xw`pb-6 px-8`}>
                <div css={xw`mt-3 text-center sm:mt-5`}>
                  <div css={xw`mt-6 bg-mango-dark-light rounded-md`}>
                    <label htmlFor=""></label>
                    <input
                      type="text"
                      css={xw`outline-none bg-mango-dark-light w-full py-4 mx-3 text-2xl text-gray-300`}
                      placeholder="0.00"
                    ></input>
                  </div>
                </div>
                <div css={xw`mt-5 sm:mt-6 flex justify-center space-x-4`}>
                  <Button type="button" onClick={handleClick}>
                    Max
                  </Button>
                  <Button type="button" onClick={handleClick}>
                    Deposit
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Portal>
  )
}

const Header = ({ children }) => {
  return (
    <div css={xw`flex items-center bg-mango-dark-light py-4 px-8`}>
      {children}
    </div>
  )
}

Modal.Header = Header

export default Modal
