import { useCallback, useState } from 'react'
import {
  ExternalLinkIcon,
  InformationCircleIcon,
} from '@heroicons/react/outline'
import FloatingElement from './FloatingElement'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import useMarketList from '../hooks/useMarketList'
import { floorToDecimal, tokenPrecision } from '../utils/index'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import Button from './Button'
import Tooltip from './Tooltip'
import MarginAccountSelect from './MarginAccountSelect'
import { MarginAccount } from '@blockworks-foundation/mango-client'

export default function MarginBalances() {
  const setMangoStore = useMangoStore((s) => s.set)
  const marginAccounts = useMangoStore((s) => s.marginAccounts)
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const selectedMarginAccount = useMangoStore(
    (s) => s.selectedMarginAccount.current
  )
  const connected = useMangoStore((s) => s.wallet.connected)
  const { symbols } = useMarketList()

  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const handleCloseDeposit = useCallback(() => {
    setShowDepositModal(false)
  }, [])

  const handleCloseWithdraw = useCallback(() => {
    setShowWithdrawModal(false)
  }, [])

  const handleMarginAccountChange = (marginAccount: MarginAccount) => {
    setMangoStore((state) => {
      state.selectedMarginAccount.current = marginAccount
    })
  }

  return (
    <>
      <FloatingElement>
        <ElementTitle>
          Margin Account
          <Tooltip
            content={
              <AddressTooltip
                owner={selectedMarginAccount?.owner.toString()}
                marginAccount={selectedMarginAccount?.publicKey.toString()}
              />
            }
          >
            <div>
              <InformationCircleIcon
                className={`h-5 w-5 ml-2 text-th-primary cursor-help`}
              />
            </div>
          </Tooltip>
        </ElementTitle>
        <div>
          {marginAccounts.length > 1 ? (
            <MarginAccountSelect
              onChange={handleMarginAccountChange}
              className="mb-2"
            />
          ) : null}
        </div>
        {selectedMangoGroup ? (
          <table className={`min-w-full`}>
            <thead>
              <tr className={`text-center text-th-fgd-4 mb-2 text-xs`}>
                <th scope="col" className={`flex-auto font-normal text-left`}>
                  Assets
                </th>
                <th
                  scope="col"
                  className={`flex-auto font-normal text-right px-2`}
                >
                  Deposits
                </th>
                <th
                  scope="col"
                  className={`flex-auto font-normal text-right px-2`}
                >
                  Borrows
                </th>
                <th
                  scope="col"
                  className="flex-auto font-normal flex justify-end items-center"
                >
                  <Tooltip content="Deposit APR and Borrow APY">
                    <div>Deposits / Borrows</div>
                  </Tooltip>
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(symbols).map(([name], i) => (
                <tr key={name} className={`text-th-fgd-1`}>
                  <td className={`flex items-center py-2`}>
                    <img
                      alt=""
                      width="20"
                      height="20"
                      src={`/assets/icons/${name.toLowerCase()}.svg`}
                      className={`mr-2.5`}
                    />
                    <span>{name}</span>
                  </td>
                  <td className={`text-right px-2`}>
                    {selectedMarginAccount
                      ? floorToDecimal(
                          selectedMarginAccount.getUiDeposit(
                            selectedMangoGroup,
                            i
                          ),
                          tokenPrecision[name]
                        ).toFixed(tokenPrecision[name])
                      : (0).toFixed(tokenPrecision[name])}
                  </td>
                  <td className={`text-right px-2`}>
                    {selectedMarginAccount
                      ? selectedMarginAccount
                          .getUiBorrow(selectedMangoGroup, i)
                          .toFixed(tokenPrecision[name])
                      : (0).toFixed(tokenPrecision[name])}
                  </td>
                  <td className={`text-right`}>
                    <span className={`text-th-green`}>
                      {(selectedMangoGroup.getDepositRate(i) * 100).toFixed(2)}%
                    </span>
                    <span className={`text-th-fgd-4`}>{'  /  '}</span>
                    <span className={`text-th-red`}>
                      {(selectedMangoGroup.getBorrowRate(i) * 100).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        <div className={`flex justify-center items-center mt-4`}>
          <Button
            onClick={() => setShowDepositModal(true)}
            className="w-1/2"
            disabled={!connected}
          >
            <span>Deposit</span>
          </Button>
          <Button
            onClick={() => setShowWithdrawModal(true)}
            className="ml-4 w-1/2"
            disabled={!connected || !selectedMarginAccount}
          >
            <span>Withdraw</span>
          </Button>
        </div>
        <div className={`text-center mt-4 text-th-fgd-4 text-sm`}>
          Settle funds in the Balances tab
        </div>
      </FloatingElement>
      {showDepositModal && (
        <DepositModal isOpen={showDepositModal} onClose={handleCloseDeposit} />
      )}
      {showWithdrawModal && (
        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={handleCloseWithdraw}
        />
      )}
    </>
  )
}

const AddressTooltip = ({
  owner,
  marginAccount,
}: {
  owner?: string
  marginAccount?: string
}) => {
  return (
    <>
      {owner && marginAccount ? (
        <>
          <div className={`flex flex-nowrap text-th-fgd-3`}>
            Margin Account:
            <a
              className="text-th-fgd-1 default-transition hover:text-th-primary"
              href={'https://explorer.solana.com/address/' + marginAccount}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className={`ml-2 flex items-center`}>
                <span className={`underline`}>
                  {marginAccount.toString().substr(0, 5) +
                    '...' +
                    marginAccount.toString().substr(-5)}
                </span>
                <ExternalLinkIcon className={`h-4 w-4 ml-1`} />
              </div>
            </a>
          </div>
          <div className={`flex flex-nowrap text-th-fgd-3 pt-2`}>
            Account Owner:
            <a
              className="text-th-fgd-1 default-transition hover:text-th-primary"
              href={'https://explorer.solana.com/address/' + owner}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className={`ml-2 flex items-center`}>
                <span className={`underline`}>
                  {owner.toString().substr(0, 5) +
                    '...' +
                    owner.toString().substr(-5)}
                </span>
                <ExternalLinkIcon className={`h-4 w-4 ml-1`} />
              </div>
            </a>
          </div>
        </>
      ) : (
        'Connect a wallet and deposit funds to start trading'
      )}
    </>
  )
}
