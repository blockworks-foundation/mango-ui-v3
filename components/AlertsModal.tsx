import React, { FunctionComponent, useEffect, useState } from 'react'
import { PublicKey } from '@solana/web3.js'
import { RadioGroup } from '@headlessui/react'
import {
  CheckCircleIcon,
  DuplicateIcon,
  ExclamationIcon,
  InformationCircleIcon,
} from '@heroicons/react/outline'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/plain.css'
import Button from './Button'
import Input from './Input'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import useAlertsStore from '../stores/useAlertsStore'
import { notify } from '../utils/notifications'
import { copyToClipboard } from '../utils'
import Modal from './Modal'
import Loading from './Loading'
import MarginAccountSelect from './MarginAccountSelect'
import Tooltip from './Tooltip'
import Select from './Select'

interface AlertsModalProps {
  marginAccount?: {
    publicKey: PublicKey
  }
  alert?: {
    alertProvider: string
    collateralRatioThresh: number
    acc: PublicKey
  }
  isOpen: boolean
  onClose: () => void
}

const AlertsModal: FunctionComponent<AlertsModalProps> = ({
  isOpen,
  onClose,
  alert,
  marginAccount,
}) => {
  const connected = useMangoStore((s) => s.wallet.connected)
  const marginAccounts = useMangoStore((s) => s.marginAccounts)
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const actions = useAlertsStore((s) => s.actions)
  const submitting = useAlertsStore((s) => s.submitting)
  const success = useAlertsStore((s) => s.success)
  const set = useAlertsStore((s) => s.set)
  const tgCode = useAlertsStore((s) => s.tgCode)

  // select by default:
  // 1. margin account passed in directly (from the margin account info on the trade page)
  // 2. previous alert's margin account (when re-activating from the alerts page)
  // 3, the first margin account
  const [selectedMarginAccount, setSelectedMarginAccount] = useState<any>(
    marginAccount || alert?.acc || marginAccounts[0]
  )
  const [collateralRatioPreset, setCollateralRatioPreset] = useState('113')
  const [customCollateralRatio, setCustomCollateralRatio] = useState('')
  const [alertProvider, setAlertProvider] = useState('sms')
  const [phoneNumber, setPhoneNumber] = useState<any>({ phone: null })
  const [email, setEmail] = useState<string>('')
  const [showTgCode, setShowTgCode] = useState<boolean>(false)
  const [isCopied, setIsCopied] = useState(false)

  const ratioPresets = ['Custom', '113', '115', '120', '130', '150', '200']

  const collateralRatioThresh =
    collateralRatioPreset !== 'Custom'
      ? parseInt(collateralRatioPreset)
      : parseInt(customCollateralRatio)

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  useEffect(() => {
    if (tgCode) {
      setShowTgCode(true)
    }
  }, [tgCode])

  useEffect(() => {
    if (alert) {
      const isPreset = ratioPresets.find(
        (preset) => preset === alert.collateralRatioThresh.toString()
      )
      if (isPreset) {
        setCollateralRatioPreset(alert.collateralRatioThresh.toString())
      } else {
        setCollateralRatioPreset('Custom')
        setCustomCollateralRatio(alert.collateralRatioThresh.toString())
      }
      setAlertProvider(alert.alertProvider)
      const alertAccount = marginAccounts.find(
        (account) => account.publicKey.toString() === alert.acc.toString()
      )
      setSelectedMarginAccount(alertAccount)
    }
  }, [alert])

  const handleCopyTgCode = (code) => {
    setIsCopied(true)
    copyToClipboard(code)
  }

  const handleNewFromTgCode = () => {
    set((s) => {
      s.tgCode = null
    })
    resetForm()
  }

  const handleCloseModal = () => {
    set((s) => {
      (s.success = ''), (s.tgCode = null)
    })
    resetForm()
    onClose()
  }

  const handleNewFromSuccess = () => {
    resetForm()
    set((s) => {
      s.success = ''
    })
  }

  const resetForm = () => {
    setAlertProvider('sms')
    setPhoneNumber({ phone: null })
    setEmail('')
    setCollateralRatioPreset('113')
    setCustomCollateralRatio('')
  }

  async function onSubmit() {
    if (!connected) {
      notify({
        message: 'Please connect wallet',
        type: 'error',
      })
      return
    } else if (!selectedMarginAccount) {
      notify({
        message: 'Please select a margin account',
        type: 'error',
      })
      return
    } else if (alertProvider === 'sms' && !phoneNumber.phone) {
      notify({
        message: 'Please provide phone number',
        type: 'error',
      })
      return
    } else if (alertProvider === 'mail' && !email) {
      notify({
        message: 'Please provide e-mail',
        type: 'error',
      })
      return
    }
    const body = {
      mangoGroupPk: selectedMangoGroup.publicKey.toString(),
      marginAccountPk: selectedMarginAccount.publicKey.toString(),
      collateralRatioThresh,
      alertProvider,
      phoneNumber,
      email,
    }
    actions.createAlert(body)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleCloseModal}>
      {tgCode && showTgCode ? (
        <TelegramModal
          handleCloseModal={handleCloseModal}
          handleCopyToClipboard={handleCopyTgCode}
          handleNewFromTgCode={handleNewFromTgCode}
          isCopied={isCopied}
          tgCode={tgCode}
        />
      ) : success ? (
        <div className="flex flex-col items-center text-th-fgd-1">
          <CheckCircleIcon className="h-6 w-6 text-th-green mb-1" />
          <div className="font-bold text-lg pb-1">{success}</div>
          <p className="text-center">
            {"We'll let you know if it's triggered."}
          </p>
          <div className="flex pt-2 w-full">
            <Button
              onClick={() => handleNewFromSuccess()}
              className="w-full mr-2"
            >
              New Alert
            </Button>
            <Button onClick={() => handleCloseModal()} className="w-full ml-2">
              Close
            </Button>
          </div>
        </div>
      ) : (
        <>
          <Modal.Header>
            <div className={`text-th-fgd-3 flex-shrink invisible w-5`}>X</div>
            <ElementTitle noMarignBottom>
              Create Liquidation Alert{' '}
              <Tooltip
                content="Your account can be liquidated if your collateral ratio is below 110%.
            Set an alert above 110% and we'll let you know if it is equal to or falls
            below that value."
              >
                <div>
                  <InformationCircleIcon
                    className={`h-5 w-5 ml-2 text-th-primary cursor-help`}
                  />
                </div>
              </Tooltip>
            </ElementTitle>
          </Modal.Header>
          {marginAccounts.length > 0 ? (
            <>
              {marginAccounts.length > 1 ? (
                <div className="pb-4">
                  <div className={`text-th-fgd-1 pb-2`}>Margin Account</div>
                  <MarginAccountSelect
                    onChange={setSelectedMarginAccount}
                    value={selectedMarginAccount}
                  />
                </div>
              ) : null}
              <div className="pb-4">
                <div className={`text-th-fgd-1 pb-2`}>
                  Alert me when my collateral ratio is below:
                </div>
                <Select
                  value={
                    collateralRatioPreset !== 'Custom'
                      ? `${collateralRatioPreset}%`
                      : collateralRatioPreset
                  }
                  onChange={(v) => setCollateralRatioPreset(v)}
                >
                  {ratioPresets.map((option, index) => (
                    <Select.Option key={index} value={option}>
                      {option !== 'Custom' ? `${option}%` : option}
                    </Select.Option>
                  ))}
                </Select>
              </div>
              {collateralRatioPreset === 'Custom' ? (
                <div className="pb-4">
                  <div className={`text-th-fgd-1 pb-2`}>
                    Custom collateral ratio
                  </div>
                  <Input
                    type="number"
                    value={customCollateralRatio}
                    onChange={(e) => setCustomCollateralRatio(e.target.value)}
                    suffix="%"
                  />
                </div>
              ) : null}
              <div className="pb-4">
                <div className={`text-th-fgd-1 pb-2`}>Alert me via:</div>
                <RadioGroup
                  value={alertProvider}
                  onChange={(val) => setAlertProvider(val)}
                  className="flex border border-th-fgd-4 rounded"
                >
                  <RadioGroup.Option
                    value="sms"
                    className="flex-1 focus:outline-none"
                  >
                    {({ checked }) => (
                      <button
                        className={`${
                          checked ? 'bg-th-bkg-3 rounded-l' : ''
                        } font-normal text-th-fgd-1 text-center py-1.5 w-full rounded-none border-r border-th-fgd-4 hover:bg-th-bkg-3 focus:outline-none`}
                      >
                        SMS
                      </button>
                    )}
                  </RadioGroup.Option>
                  <RadioGroup.Option
                    value="mail"
                    className="focus:outline-none flex-1"
                  >
                    {({ checked }) => (
                      <button
                        className={`${
                          checked ? 'bg-th-bkg-3' : ''
                        } font-normal text-th-fgd-1  text-center py-1.5 w-full rounded-none border-r border-th-fgd-4 hover:bg-th-bkg-3 focus:outline-none`}
                      >
                        E-mail
                      </button>
                    )}
                  </RadioGroup.Option>
                  <RadioGroup.Option
                    value="tg"
                    className="focus:outline-none flex-1"
                  >
                    {({ checked }) => (
                      <button
                        className={`${
                          checked ? 'bg-th-bkg-3 rounded-r' : ''
                        } font-normal text-th-fgd-1 text-center py-1.5 w-full rounded-none hover:bg-th-bkg-3 focus:outline-none`}
                      >
                        Telegram
                      </button>
                    )}
                  </RadioGroup.Option>
                </RadioGroup>
              </div>
              <div className="pb-4">
                {alertProvider === 'sms' ? (
                  <>
                    <div className={`text-th-fgd-1 pb-2`}>Mobile Number</div>
                    <PhoneInput
                      containerClass="w-full"
                      inputClass="!w-full !bg-th-bkg-1 !rounded !h-10 !text-th-fgd-1
                !border !border-th-fgd-4 !border-l hover:!border-th-primary focus:!border-th-primary default-transition"
                      buttonClass="!bg-th-bkg-2 !border !border-th-fgd-4 !pl-1 hover:!bg-th-bkg-3 focus:!bg-th-primary !rounded-l default-transition"
                      dropdownClass="!bg-th-bkg-1 !border-0 !pl-1 !text-th-fgd-1 !rounded !mt-2 !max-h-40 thin-scroll"
                      country="us"
                      inputProps={{
                        name: 'phone',
                        required: true,
                      }}
                      onChange={(val) =>
                        setPhoneNumber({ phone: val, code: '' })
                      }
                    />
                  </>
                ) : null}
                {alertProvider === 'mail' ? (
                  <>
                    <div className={`text-th-fgd-1 pb-2`}>Email</div>
                    <Input
                      value={email}
                      type="mail"
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </>
                ) : null}
              </div>
              <Button
                disabled={!connected}
                onClick={onSubmit}
                className="w-full mb-2"
              >
                {connected ? (
                  <div className="flex justify-center">
                    {submitting ? (
                      <Loading />
                    ) : alertProvider === 'tg' ? (
                      'Generate Telegram Bot Code'
                    ) : (
                      'Save Alert'
                    )}
                  </div>
                ) : (
                  'Connect Wallet To Save'
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="flex flex-col items-center text-th-fgd-1 p-4 mb-4 rounded-lg border border-th-fgd-4">
                <ExclamationIcon className="w-8 h-8 text-th-red" />
                <div className="font-bold text-base pb-1">
                  No Margin Accounts Found
                </div>
                <p className="mb-0">
                  Make a deposit to initialize a margin account.
                </p>
              </div>
              <Button onClick={onClose} className="w-full">
                Okay, Got It
              </Button>
            </>
          )}
        </>
      )}
    </Modal>
  )
}

export default AlertsModal

const TelegramModal = ({
  handleCloseModal,
  handleCopyToClipboard,
  handleNewFromTgCode,
  isCopied,
  tgCode,
}) => {
  return (
    <div className="text-th-fgd-1">
      <ElementTitle>Claim Your Alert in Telegram</ElementTitle>
      <p className="text-center">This code will expire in 15 minutes</p>

      <div className="text-center relative bg-th-bkg-1 py-2 px-8 mt-4 rounded text-lg">
        {tgCode}{' '}
        <div
          className="absolute top-3.5 cursor-pointer right-4 flex items-center text-xs pl-2 text-th-fgd-1 hover:text-th-primary default-transition"
          onClick={() => handleCopyToClipboard(tgCode)}
        >
          <DuplicateIcon className="w-4 h-4 mr-1" />
          {isCopied ? 'Copied!' : 'Copy'}
        </div>
      </div>
      <div className="bg-th-bkg-3 p-4 rounded-lg mt-2 mb-4">
        <ol className="ml-6 list-decimal space-y-2">
          <li>Copy the code above</li>
          <li>
            Go to{' '}
            <a
              target="_blank"
              rel="noopener noreferrer"
              href="https://t.me/mango_alerts_bot"
            >
              https://t.me/mango_alerts_bot
            </a>
          </li>
          <li>Paste the code and send message</li>
        </ol>
      </div>

      <div className="flex pt-2 w-full">
        <Button onClick={() => handleNewFromTgCode()} className="w-full mr-2">
          New Alert
        </Button>
        <Button onClick={() => handleCloseModal()} className="w-full ml-2">
          Close
        </Button>
      </div>
    </div>
  )
}
