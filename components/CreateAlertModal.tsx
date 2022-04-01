import React, { FunctionComponent, useEffect, useState } from 'react'
import { PlusCircleIcon, TrashIcon } from '@heroicons/react/outline'
import Modal from './Modal'
import Input, { Label } from './Input'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import Button, { LinkButton } from './Button'
import { notify } from '../utils/notifications'
import { useTranslation } from 'next-i18next'
import ButtonGroup from './ButtonGroup'
import InlineNotification from './InlineNotification'

interface CreateAlertModalProps {
  onClose: () => void
  isOpen: boolean
  repayAmount?: string
  tokenSymbol?: string
}

const CreateAlertModal: FunctionComponent<CreateAlertModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation(['common', 'alerts'])
  const actions = useMangoStore((s) => s.actions)
  const mangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const activeAlerts = useMangoStore((s) => s.alerts.activeAlerts)
  const loading = useMangoStore((s) => s.alerts.loading)
  const submitting = useMangoStore((s) => s.alerts.submitting)
  const error = useMangoStore((s) => s.alerts.error)
  const [email, setEmail] = useState<string>('')
  const [invalidAmountMessage, setInvalidAmountMessage] = useState('')
  const [health, setHealth] = useState('')
  const [showCustomHealthForm, setShowCustomHealthForm] = useState(false)
  const [showAlertForm, setShowAlertForm] = useState(false)

  const healthPresets = ['5', '10', '15', '25', '30']

  const validateEmailInput = (amount) => {
    if (Number(amount) <= 0) {
      setInvalidAmountMessage(t('enter-amount'))
    }
  }

  const onChangeEmailInput = (amount) => {
    setEmail(amount)
    setInvalidAmountMessage('')
  }

  async function onCreateAlert() {
    if (!email) {
      notify({
        title: t('alerts:email-address-required'),
        type: 'error',
      })
      return
    } else if (!health) {
      notify({
        title: t('alerts:alert-health-required'),
        type: 'error',
      })
      return
    }
    const body = {
      mangoGroupPk: mangoGroup?.publicKey.toString(),
      mangoAccountPk: mangoAccount?.publicKey.toString(),
      health,
      alertProvider: 'mail',
      email,
    }
    const success: any = await actions.createAlert(body)
    if (success) {
      setShowAlertForm(false)
    }
  }

  const handleCancelCreateAlert = () => {
    if (activeAlerts.length > 0) {
      setShowAlertForm(false)
    } else {
      onClose()
    }
  }

  useEffect(() => {
    actions.loadAlerts(mangoAccount?.publicKey)
  }, [])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {!loading && !submitting ? (
        <>
          {activeAlerts.length > 0 && !showAlertForm ? (
            <>
              <Modal.Header>
                <div className="flex w-full items-center justify-between">
                  <div className="w-20" />
                  <ElementTitle noMarginBottom>
                    {t('alerts:active-alerts')}
                  </ElementTitle>
                  <Button
                    className="min-w-20 flex h-8 items-center justify-center pt-0 pb-0 text-xs"
                    disabled={activeAlerts.length >= 5}
                    onClick={() => setShowAlertForm(true)}
                  >
                    <div className="flex items-center">
                      <PlusCircleIcon className="mr-1.5 h-4 w-4" />
                      {t('alerts:new-alert')}
                    </div>
                  </Button>
                </div>
              </Modal.Header>
              <div className="mt-2 border-b border-th-fgd-4">
                {activeAlerts.map((alert, index) => (
                  <div
                    className="flex items-center justify-between border-t border-th-fgd-4 p-4"
                    key={`${alert._id}${index}`}
                  >
                    <div className="text-th-fgd-1">
                      {t('alerts:alert-info', { health: alert.health })}
                    </div>
                    <TrashIcon
                      className="default-transition h-5 w-5 cursor-pointer text-th-fgd-3 hover:text-th-primary"
                      onClick={() => actions.deleteAlert(alert._id)}
                    />
                  </div>
                ))}
              </div>
              {activeAlerts.length >= 3 ? (
                <div className="mt-1 text-center text-xxs text-th-fgd-3">
                  {t('alerts:alerts-max')}
                </div>
              ) : null}
            </>
          ) : showAlertForm ? (
            <>
              <Modal.Header>
                <ElementTitle noMarginBottom>
                  {t('alerts:create-alert')}
                </ElementTitle>
                <p className="mt-1 text-center">
                  {t('alerts:alerts-disclaimer')}
                </p>
              </Modal.Header>
              {error ? (
                <div className="my-4">
                  <InlineNotification title={error} type="error" />
                </div>
              ) : null}
              <Label>{t('email-address')}</Label>
              <Input
                type="email"
                error={!!invalidAmountMessage}
                onBlur={(e) => validateEmailInput(e.target.value)}
                value={email || ''}
                onChange={(e) => onChangeEmailInput(e.target.value)}
              />
              <div className="mt-4 flex items-end">
                <div className="w-full">
                  <div className="flex justify-between">
                    <Label>{t('alerts:alert-health')}</Label>

                    <LinkButton
                      className="mb-1.5"
                      onClick={() =>
                        setShowCustomHealthForm(!showCustomHealthForm)
                      }
                    >
                      {showCustomHealthForm ? t('presets') : t('custom')}
                    </LinkButton>
                  </div>
                  {showCustomHealthForm ? (
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      onChange={(e) => setHealth(e.target.value)}
                      suffix={
                        <div className="text-base font-bold text-th-fgd-3">
                          %
                        </div>
                      }
                      value={health}
                    />
                  ) : (
                    <ButtonGroup
                      activeValue={health.toString()}
                      onChange={(p) => setHealth(p)}
                      unit="%"
                      values={healthPresets}
                    />
                  )}
                </div>
              </div>
              <Button className="mt-6 w-full" onClick={() => onCreateAlert()}>
                {t('alerts:create-alert')}
              </Button>
              <LinkButton
                className="mt-4 w-full text-center"
                onClick={handleCancelCreateAlert}
              >
                {t('cancel')}
              </LinkButton>
            </>
          ) : error ? (
            <div>
              <InlineNotification title={error} type="error" />
              <Button
                className="mx-auto mt-6 flex justify-center"
                onClick={() => actions.loadAlerts()}
              >
                {t('try-again')}
              </Button>
            </div>
          ) : (
            <div>
              <Modal.Header>
                <ElementTitle noMarginBottom>
                  {t('alerts:no-alerts')}
                </ElementTitle>
                <p className="mt-1 text-center">{t('alerts:no-alerts-desc')}</p>
              </Modal.Header>
              <Button
                className="m-auto flex justify-center"
                onClick={() => setShowAlertForm(true)}
              >
                {t('alerts:new-alert')}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-3">
          <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
          <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
          <div className="h-12 w-full animate-pulse rounded-md bg-th-bkg-3" />
        </div>
      )}
    </Modal>
  )
}

export default React.memo(CreateAlertModal)
