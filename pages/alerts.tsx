import React, { useState } from 'react'
import { RadioGroup } from '@headlessui/react'
import PhoneInput from 'react-phone-input-2'
import 'react-phone-input-2/lib/plain.css'
import Button from '../components/Button'
import FloatingElement from '../components/FloatingElement'
import Input from '../components/Input'
import { ElementTitle } from '../components/styles'
import TopBar from '../components/TopBar'
import useMangoStore from '../stores/useMangoStore'
import { notify } from '../utils/notifications'
import Modal from '../components/Modal'
import Loading from '../components/Loading'
import MarginAccountSelect from '../components/MarginAccountSelect'

export default function Alerts() {
  const connected = useMangoStore((s) => s.wallet.connected)
  const marginAccounts = useMangoStore((s) => s.marginAccounts)
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)

  const [selectedMarginAccount, setSelectedMarginAccount] = useState<any>(null)
  const [collateralRatioThresh, setCollateralRatioThresh] = useState(113)
  const [alertProvider, setAlertProvider] = useState('sms')
  const [phoneNumber, setPhoneNumber] = useState<any>({ phone: null })
  const [email, setEmail] = useState<string>('')
  const [tgCode, setTgCode] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

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

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all `}>
      <TopBar />
      <div className="min-h-screen w-full md:max-w-xl mx-auto px-4 sm:px-6 sm:py-1 md:px-8 md:py-1 lg:px-12 mt-4">
        <FloatingElement className="p-7 !overflow-visible">
          <ElementTitle>Select Margin Account</ElementTitle>
          <MarginAccountSelect
            value={marginAccounts[0]}
            onChange={setSelectedMarginAccount}
          />
          <ElementTitle className="pt-3">Liquidation Alert</ElementTitle>
          <div className="mb-4 text-base font-thin">
            You will receive an alert when your maintenance collateral ratio is
            at or below the specified ratio below
          </div>
          <Input.Group>
            <Input
              type="number"
              value={collateralRatioThresh}
              onChange={(e) => setCollateralRatioThresh(e.target.value)}
              prefix={'Ratio'}
              suffix="%"
            />
          </Input.Group>

          <RadioGroup
            value={alertProvider}
            onChange={(val) => setAlertProvider(val)}
            className="flex mt-4 border border-th-fgd-4"
          >
            <RadioGroup.Option
              value="sms"
              className="flex-1 outline-none focus:outline-none"
            >
              {({ checked }) => (
                <button
                  className={`${
                    checked ? 'bg-th-primary' : ''
                  } text-th-fgd-1  text-center py-1.5 w-full rounded-none border-r border-th-fgd-4`}
                >
                  SMS
                </button>
              )}
            </RadioGroup.Option>
            <RadioGroup.Option
              value="mail"
              className="outline-none focus:outline-none flex-1"
            >
              {({ checked }) => (
                <button
                  className={`${
                    checked ? 'bg-th-primary' : ''
                  } text-th-fgd-1  text-center py-1.5 w-full rounded-none border-r border-th-fgd-4`}
                >
                  E-MAIL
                </button>
              )}
            </RadioGroup.Option>
            <RadioGroup.Option
              value="tg"
              className="outline-none focus:outline-none flex-1"
            >
              {({ checked }) => (
                <button
                  className={`${
                    checked ? 'bg-th-primary' : ''
                  } text-th-fgd-1  text-center py-1.5 w-full rounded-none`}
                >
                  TELEGRAM
                </button>
              )}
            </RadioGroup.Option>
          </RadioGroup>
          <div className="py-4">
            {alertProvider === 'sms' ? (
              <PhoneInput
                containerClass="w-full"
                inputClass="!w-full !bg-th-bkg-1 !rounded !h-10 !text-th-fgd-1 
                !border !border-th-fgd-4"
                buttonClass="!bg-th-bkg-2 !border !border-th-fgd-4 !pl-1 !hover:bg-th-bkg-2"
                dropdownClass="!bg-th-bkg-2 !border !border-th-fgd-4 !pl-1 thin-scroll"
                country="us"
                inputProps={{
                  name: 'phone',
                  required: true,
                  autoFocus: true,
                }}
                onChange={(val) => setPhoneNumber({ phone: val, code: '' })}
              />
            ) : null}
            {alertProvider === 'mail' ? (
              <Input.Group>
                <Input
                  prefix={'Email'}
                  value={email}
                  type="mail"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Input.Group>
            ) : null}
            {alertProvider === 'tg' ? (
              <>
                <p>Instructions</p>
                <ol className="list-decimal pl-8">
                  <li>Connect wallet</li>
                  <li>Click the Save alert button</li>
                  <li>Follow instructions in the dialog</li>
                </ol>
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
                {submitting ? <Loading /> : 'Save Alert'}
              </div>
            ) : (
              'Connect Wallet To Save'
            )}
          </Button>
        </FloatingElement>
      </div>
      {tgCode !== '' ? (
        <TelegramModal
          isOpen={tgCode !== ''}
          onClose={() => setTgCode('')}
          tgCode={tgCode}
        />
      ) : null}
    </div>
  )
}

const TelegramModal = ({ tgCode, isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="text-th-fgd-1 p-6 pt-0">
        <div className="w-full text-center text-xl">
          Claim Alert in Telegram
        </div>
        <div className="rounded border mt-4 border-th-bkg-3 p-4 bg-th-bkg-3">
          <ol className="ml-6 list-decimal space-y-2 text-base font-thin">
            <li>
              Please copy this code -{' '}
              <span className="italic font-black">{tgCode}</span>
            </li>
            <li>
              Visit this telegram channel -{' '}
              <a
                target="_blank"
                rel="noopener noreferrer"
                href="https://t.me/mango_alerts_bot"
                className="text-th-primary"
              >
                https://t.me/mango_alerts_bot
              </a>
            </li>
            <li>Paste the code and send</li>
            <li>This alert can be claimed within 15 minutes</li>
          </ol>
        </div>
      </div>
    </Modal>
  )
}
