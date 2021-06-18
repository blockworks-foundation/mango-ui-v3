import React, { FunctionComponent, useEffect, useMemo, useState } from 'react'
import { Disclosure } from '@headlessui/react'
import {
  ExclamationCircleIcon,
  InformationCircleIcon,
} from '@heroicons/react/outline'
import {
  ChevronLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/solid'
import { nativeToUi, sleep } from '@blockworks-foundation/mango-client'
import {
  MerpsAccount as MarginAccount,
  uiToNative,
} from '@blockworks-foundation/mango-client'
import Modal from './Modal'
import Input from './Input'
import AccountSelect from './AccountSelect'
import { ElementTitle } from './styles'
import useMangoStore, {
  mangoClient,
  WalletToken,
} from '../stores/useMangoStore'
import useMarketList from '../hooks/useMarketList'
import {
  getSymbolForTokenMintAddress,
  DECIMALS,
  trimDecimals,
} from '../utils/index'
import useConnection from '../hooks/useConnection'
// import { deposit, initMarginAccountAndDeposit } from '../utils/mango'
import { PublicKey } from '@solana/web3.js'
import Loading from './Loading'
import Button, { LinkButton } from './Button'
import Tooltip from './Tooltip'
import Slider from './Slider'
import InlineNotification from './InlineNotification'
import { notify } from '../utils/notifications'
import useMangoGroupConfig from '../hooks/useMangoGroupConfig'
import { QUOTE_INDEX } from '@blockworks-foundation/mango-client/lib/src/MerpsGroup'
import { deposit } from '../utils/mango'

interface DepositModalProps {
  onClose: () => void
  isOpen: boolean
  settleDeficit?: number
  tokenSymbol?: string
}

const DepositModal: FunctionComponent<DepositModalProps> = ({
  isOpen,
  onClose,
  settleDeficit,
  tokenSymbol = '',
}) => {
  // const groupConfig = useMangoGroupConfig()
  // const tokenSymbols = useMemo(() => groupConfig.tokens.map(t => t.symbol), [groupConfig]);

  const [inputAmount, setInputAmount] = useState(settleDeficit || 0)
  const [submitting, setSubmitting] = useState(false)
  const [simulation, setSimulation] = useState(null)
  const [showSimulation, setShowSimulation] = useState(false)
  const [invalidAmountMessage, setInvalidAmountMessage] = useState('')
  const [sliderPercentage, setSliderPercentage] = useState(0)
  const [maxButtonTransition, setMaxButtonTransition] = useState(false)
  const { connection, programId } = useConnection()
  const walletTokens = useMangoStore((s) => s.wallet.tokens)
  const actions = useMangoStore((s) => s.actions)
  const [selectedAccount, setSelectedAccount] = useState(walletTokens[0])

  const prices = [] //useMangoStore((s) => s.selectedMangoGroup.prices)
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const selectedMarginAccount = useMangoStore(
    (s) => s.selectedMarginAccount.current
  )

  useEffect(() => {
    if (tokenSymbol) {
      const symbolAccount = walletTokens.find(
        (a) => a.config.symbol === tokenSymbol
      )
      if (symbolAccount) {
        setSelectedAccount(symbolAccount)
      } else {
        setSelectedAccount(null)
      }
    }
  }, [tokenSymbol, walletTokens])

  /* TODO: simulation
  useEffect(() => {
    if (!selectedMangoGroup || !selectedMarginAccount || !selectedAccount)
      return

    const mintDecimals = selectedMangoGroup.mintDecimals[tokenIndex]
    const groupIndex = selectedMangoGroup.indexes[tokenIndex]
    const deposits = selectedMarginAccount.getUiDeposit(
      selectedMangoGroup,
      tokenIndex
    )

    // simulate change to deposits based on input amount
    const newDeposit = Math.max(0, +inputAmount + +deposits)

    // clone MarginAccount and arrays to not modify selectedMarginAccount
    const simulation = new MarginAccount(null, selectedMarginAccount)
    simulation.deposits = [...selectedMarginAccount.deposits]
    simulation.borrows = [...selectedMarginAccount.borrows]

    // update with simulated values
    simulation.deposits[tokenIndex] =
      uiToNative(newDeposit, mintDecimals).toNumber() / groupIndex.deposit

    const equity = simulation.computeValue(selectedMangoGroup, prices)
    const assetsVal = simulation.getAssetsVal(selectedMangoGroup, prices)
    const liabsVal = simulation.getLiabsVal(selectedMangoGroup, prices)
    const collateralRatio = simulation.getCollateralRatio(
      selectedMangoGroup,
      prices
    )
    const leverage = 1 / Math.max(0, collateralRatio - 1)
    setSimulation({
      equity,
      assetsVal,
      liabsVal,
      collateralRatio,
      leverage,
    })
  }, [
    inputAmount,
    prices,
    tokenIndex,
    selectedMarginAccount,
    selectedMangoGroup,
  ])
  */

  const handleAccountSelect = (account) => {
    setInputAmount(0)
    setSliderPercentage(0)
    setInvalidAmountMessage('')
    setSelectedAccount(account)
  }

  const setMaxForSelectedAccount = () => {
    setInputAmount(selectedAccount.uiBalance)
    setSliderPercentage(100)
    setInvalidAmountMessage('')
    setMaxButtonTransition(true)
  }

  const handleDeposit = () => {
    setSubmitting(true)
    deposit({
      amount: inputAmount,
      fromTokenAcc: selectedAccount.account,
    }).then(() => {
      setSubmitting(false)
      onClose()
      actions.fetchMarginAccounts()
    })
  }

  const renderAccountRiskStatus = (
    collateralRatio: number,
    isRiskLevel?: boolean,
    isStatusIcon?: boolean
  ) => {
    if (collateralRatio < 1.25) {
      return isRiskLevel ? (
        <div className="text-th-red">High</div>
      ) : isStatusIcon ? (
        'bg-th-red'
      ) : (
        'border-th-red text-th-red'
      )
    } else if (collateralRatio > 1.25 && collateralRatio < 1.5) {
      return isRiskLevel ? (
        <div className="text-th-orange">Moderate</div>
      ) : isStatusIcon ? (
        'bg-th-orange'
      ) : (
        'border-th-orange text-th-orange'
      )
    } else {
      return isRiskLevel ? (
        <div className="text-th-green">Low</div>
      ) : isStatusIcon ? (
        'bg-th-green'
      ) : (
        'border-th-green text-th-green'
      )
    }
  }

  const validateAmountInput = (amount) => {
    if (Number(amount) <= 0) {
      setInvalidAmountMessage('Enter an amount to deposit')
    }
    if (selectedAccount && Number(amount) > selectedAccount.uiBalance) {
      setInvalidAmountMessage(
        'Insufficient balance. Reduce the amount to deposit'
      )
    }
  }

  const onChangeAmountInput = (amount) => {
    setInputAmount(amount)

    if (!selectedAccount) {
      setInvalidAmountMessage(
        'Please fund wallet with one of the supported assets.'
      )
      return
    }

    const max = selectedAccount.uiBalance
    setSliderPercentage((amount / max) * 100)
    setInvalidAmountMessage('')
  }

  const onChangeSlider = async (percentage) => {
    setSliderPercentage(percentage)

    if (!selectedAccount) {
      setInvalidAmountMessage(
        'Please fund wallet with one of the supported assets.'
      )
      return
    }

    const max = selectedAccount.uiBalance
    const amount = (percentage / 100) * max
    if (percentage === 100) {
      setInputAmount(amount)
    } else {
      setInputAmount(
        trimDecimals(amount, DECIMALS[selectedAccount.config.symbol])
      )
    }
    setInvalidAmountMessage('')
    validateAmountInput(amount)
  }

  // turn off slider transition for dragging slider handle interaction
  useEffect(() => {
    if (maxButtonTransition) {
      setMaxButtonTransition(false)
    }
  }, [maxButtonTransition])

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      {!showSimulation ? (
        <>
          <Modal.Header>
            <ElementTitle noMarignBottom>Deposit Funds</ElementTitle>
          </Modal.Header>
          {tokenSymbol && !selectedAccount ? (
            <InlineNotification
              desc={`Add ${tokenSymbol} to your wallet and fund it with ${tokenSymbol} to deposit.`}
              title={`No ${tokenSymbol} wallet address found`}
              type="error"
            />
          ) : null}
          {settleDeficit ? (
            <InlineNotification
              desc={`Deposit ${settleDeficit} ${tokenSymbol} before settling your borrow.`}
              title="Not enough balance to settle"
              type="error"
            />
          ) : null}
          <AccountSelect
            accounts={walletTokens}
            selectedAccount={selectedAccount}
            onSelectAccount={handleAccountSelect}
          />
          <div className="flex justify-between pb-2 pt-4">
            <div className={`text-th-fgd-1`}>Amount</div>
            <div
              className="text-th-fgd-1 underline cursor-pointer default-transition hover:text-th-primary hover:no-underline"
              onClick={setMaxForSelectedAccount}
            >
              Max
            </div>
          </div>
          <div className="flex">
            <Input
              type="number"
              min="0"
              className={`border border-th-fgd-4 flex-grow pr-11`}
              placeholder="0.00"
              error={!!invalidAmountMessage}
              onBlur={(e) => validateAmountInput(e.target.value)}
              value={inputAmount}
              onChange={(e) => onChangeAmountInput(e.target.value)}
              suffix={selectedAccount?.config.symbol}
            />
            {/* {simulation ? (
              <Tooltip content="Projected Leverage" className="py-1">
                <span
                  className={`${renderAccountRiskStatus(
                    simulation?.collateralRatio
                  )} bg-th-bkg-1 border flex font-semibold h-10 items-center justify-center ml-2 rounded text-th-fgd-1 w-14`}
                >
                  {simulation?.leverage < 5
                    ? simulation?.leverage.toFixed(2)
                    : '>5'}
                  x
                </span>
              </Tooltip>
            ) : null} */}
          </div>
          {invalidAmountMessage ? (
            <div className="flex items-center pt-1.5 text-th-red">
              <ExclamationCircleIcon className="h-4 w-4 mr-1.5" />
              {invalidAmountMessage}
            </div>
          ) : null}
          <div className="pt-3 pb-4">
            <Slider
              disabled={null}
              value={sliderPercentage}
              onChange={(v) => onChangeSlider(v)}
              step={1}
              maxButtonTransition={maxButtonTransition}
            />
          </div>
          <div className={`pt-8 flex justify-center`}>
            <Button
              onClick={() => setShowSimulation(true)}
              className="w-full"
              disabled={
                inputAmount <= 0 ||
                !selectedAccount ||
                inputAmount > selectedAccount.uiBalance
              }
            >
              Next
            </Button>
          </div>
        </>
      ) : (
        <>
          <Modal.Header>
            <ElementTitle noMarignBottom>Confirm Deposit</ElementTitle>
          </Modal.Header>
          <div className="bg-th-bkg-1 p-4 rounded-lg text-th-fgd-1 text-center">
            <div className="text-th-fgd-3 pb-1">{`You're about to deposit`}</div>
            <div className="flex items-center justify-center">
              <div className="font-semibold relative text-xl">
                {inputAmount}
                <span className="absolute bottom-0.5 font-normal ml-1.5 text-xs text-th-fgd-4">
                  {selectedAccount?.config.symbol}
                </span>
              </div>
            </div>
          </div>
          {simulation ? (
            <Disclosure>
              {({ open }) => (
                <>
                  <Disclosure.Button
                    className={`border border-th-fgd-4 default-transition font-normal mt-4 pl-3 pr-2 py-2.5 ${
                      open ? 'rounded-b-none' : 'rounded-md'
                    } text-th-fgd-1 w-full hover:bg-th-bkg-3 focus:outline-none`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className="flex h-2 w-2 mr-2.5 relative">
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${renderAccountRiskStatus(
                              simulation?.collateralRatio,
                              false,
                              true
                            )} opacity-75`}
                          ></span>
                          <span
                            className={`relative inline-flex rounded-full h-2 w-2 ${renderAccountRiskStatus(
                              simulation?.collateralRatio,
                              false,
                              true
                            )}`}
                          ></span>
                        </span>
                        Account Health Check
                        <Tooltip content="The details of your account after this deposit.">
                          <InformationCircleIcon
                            className={`h-5 w-5 ml-2 text-th-fgd-3 cursor-help`}
                          />
                        </Tooltip>
                      </div>
                      {open ? (
                        <ChevronUpIcon className="h-5 w-5 mr-1" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5 mr-1" />
                      )}
                    </div>
                  </Disclosure.Button>
                  <Disclosure.Panel
                    className={`border border-th-fgd-4 border-t-0 p-4 rounded-b-md`}
                  >
                    <div>
                      <div className="flex justify-between pb-2">
                        <div className="text-th-fgd-4">Account Value</div>
                        <div className="text-th-fgd-1">
                          ${simulation?.assetsVal.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex justify-between pb-2">
                        <div className="text-th-fgd-4">Account Risk</div>
                        <div className="text-th-fgd-1">
                          {renderAccountRiskStatus(
                            simulation?.collateralRatio,
                            true
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between pb-2">
                        <div className="text-th-fgd-4">Leverage</div>
                        <div className="text-th-fgd-1">
                          {simulation?.leverage.toFixed(2)}x
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <div className="text-th-fgd-4">Collateral Ratio</div>
                        <div className="text-th-fgd-1">
                          {simulation?.collateralRatio * 100 < 200
                            ? Math.floor(simulation?.collateralRatio * 100)
                            : '>200'}
                          %
                        </div>
                      </div>
                      {simulation?.liabsVal > 0.05 ? (
                        <div className="flex justify-between pt-2">
                          <div className="text-th-fgd-4">Borrow Value</div>
                          <div className="text-th-fgd-1">
                            ${simulation?.liabsVal.toFixed(2)}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>
          ) : null}
          <div className={`mt-5 flex justify-center`}>
            <Button onClick={handleDeposit} className="w-full">
              <div className={`flex items-center justify-center`}>
                {submitting && <Loading className="-ml-1 mr-3" />}
                Confirm
              </div>
            </Button>
          </div>
          <LinkButton
            className="flex items-center mt-4 text-th-fgd-3"
            onClick={() => setShowSimulation(false)}
          >
            <ChevronLeftIcon className="h-5 w-5 mr-1" />
            Back
          </LinkButton>
        </>
      )}
    </Modal>
  )
}

export default React.memo(DepositModal)
