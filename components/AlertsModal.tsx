import React, { useEffect, useState } from 'react'
import { RadioGroup } from '@headlessui/react'
import {
  InformationCircleIcon,
  DuplicateIcon,
  ExclamationIcon,
} from '@heroicons/react/outline'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/plain.css'
import Button from './Button'
import Input from './Input'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import { notify } from '../utils/notifications'
import { copyToClipboard } from '../utils'
import Modal from './Modal'
import Loading from './Loading'
import MarginAccountSelect from './MarginAccountSelect'
import Tooltip from './Tooltip'
import Select from './Select'

export default function AlertsModal({ isOpen, onClose }) {
  const connected = useMangoStore((s) => s.wallet.connected)
  const marginAccounts = useMangoStore((s) => s.marginAccounts)
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)

  const [selectedMarginAccount, setSelectedMarginAccount] = useState<any>(
    marginAccounts[0]
  )
  const [collateralRatioThresh, setCollateralRatioThresh] = useState(113)
  const [alertProvider, setAlertProvider] = useState('sms')
  const [phoneNumber, setPhoneNumber] = useState<any>({ phone: null })
  const [email, setEmail] = useState<string>('')
  const [tgCode, setTgCode] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [useCustomRatio, setUseCustomRatio] = useState(false)

  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(() => {
        setIsCopied(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isCopied])

  const handleCopyTgCode = (code) => {
    setIsCopied(true)
    copyToClipboard(code)
  }

  const resetForm = () => {
    setAlertProvider('sms')
    setPhoneNumber({ phone: null })
    setEmail('')
    setTgCode('')
    setCollateralRatioThresh(113)
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
    setSubmitting(true)
    const fetchUrl = `https://mango-margin-call.herokuapp.com/alerts`
    const body = {
      mangoGroupPk: selectedMangoGroup.publicKey.toString(),
      marginAccountPk: selectedMarginAccount.publicKey.toString(),
      collateralRatioThresh,
      alertProvider,
      phoneNumber,
      email,
    }
    const headers = { 'Content-Type': 'application/json' }
    fetch(fetchUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(body),
    })
      .then((response: any) => {
        if (!response.ok) {
          throw response
        }
        return response.json()
      })
      .then((json: any) => {
        if (alertProvider === 'tg') {
          setTgCode(json.code)
        } else {
          notify({
            message: 'You have succesfully saved your alert',
            type: 'success',
          })
          resetForm()
        }
      })
      .catch((err) => {
        if (typeof err.text === 'function') {
          err.text().then((errorMessage: string) => {
            notify({
              message: errorMessage,
              type: 'error',
            })
          })
        } else {
          notify({
            message: 'Something went wrong',
            type: 'error',
          })
        }
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  const ratioPresets = [113, 115, 120, 130, 150, 200]

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {tgCode !== '' ? (
        <TelegramModal
          tgCode={tgCode}
          setTgCode={setTgCode}
          handleCopyToClipboard={handleCopyTgCode}
          isCopied={isCopied}
        />
      ) : (
        <>
          <Modal.Header>
            <div className={`text-th-fgd-3 flex-shrink invisible w-5`}>X</div>
            <ElementTitle noMarignBottom>
              Set Liquidation Alert{' '}
              <Tooltip
                content="Your account can be liquidated if your collateral ratio is below 110%.
            Set an alert above 110% and we'll let you know if it falls
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
                  <MarginAccountSelect onChange={setSelectedMarginAccount} />
                </div>
              ) : null}
              <div className="pb-4">
                <div className={`text-th-fgd-1 pb-2`}>
                  Alert me when my collateral ratio is below:
                </div>
                {useCustomRatio ? (
                  <Input
                    type="number"
                    value={collateralRatioThresh}
                    onChange={(e) => setCollateralRatioThresh(e.target.value)}
                    suffix="%"
                  />
                ) : (
                  <Select
                    value={collateralRatioThresh + '%'}
                    onChange={(v) => setCollateralRatioThresh(v)}
                  >
                    {ratioPresets.map((option, index) => (
                      <Select.Option key={index} value={option}>
                        {option}%
                      </Select.Option>
                    ))}
                  </Select>
                )}
                <Button
                  className="px-0 py-0 mt-2 border-0 font-normal text-th-fgd-3 text-xs hover:bg-transparent hover:opacity-60"
                  onClick={() => setUseCustomRatio(!useCustomRatio)}
                >
                  {useCustomRatio
                    ? 'Choose a suggested collateral ratio threshold'
                    : 'Enter a custom collateral ratio threshold'}
                </Button>
              </div>
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

const TelegramModal = ({
  tgCode,
  setTgCode,
  handleCopyToClipboard,
  isCopied,
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
      <Button onClick={() => setTgCode('')} className="w-full">
        Okay, Got It
      </Button>
    </div>
  )
}
