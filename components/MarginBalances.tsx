import { useCallback, useState } from 'react'
import {
  ExternalLinkIcon,
  InformationCircleIcon,
} from '@heroicons/react/outline'
import FloatingElement from './FloatingElement'
import { ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import useMarketList from '../hooks/useMarketList'
import { tokenPrecision } from '../utils/index'
import DepositModal from './DepositModal'
import WithdrawModal from './WithdrawModal'
import Button from './Button'
import Tooltip from './Tooltip'

export default function MarginBalances() {
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
        {selectedMangoGroup ? (
          <table className={`min-w-full`}>
            <thead>
              <tr className={`text-center text-th-fgd-4 mb-2`}>
                <th scope="col" className={`flex-auto font-normal`}>
                  Assets
                </th>
                <th scope="col" className={`flex-auto font-normal`}>
                  Deposits
                </th>
                <th scope="col" className={`flex-auto font-normal`}>
                  Borrows
                </th>
                <th scope="col" className={`flex-auto font-normal`}>
                  Interest (APY)
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
                  <td className={`text-center`}>
                    {selectedMarginAccount
                      ? selectedMarginAccount
                          .getUiDeposit(selectedMangoGroup, i)
                          .toFixed(tokenPrecision[name])
                      : (0).toFixed(tokenPrecision[name])}
                  </td>
                  <td className={`text-center`}>
                    {selectedMarginAccount
                      ? selectedMarginAccount
                          .getUiBorrow(selectedMangoGroup, i)
                          .toFixed(tokenPrecision[name])
                      : (0).toFixed(tokenPrecision[name])}
                  </td>
                  <td className={`text-center`}>
                    <span className={`text-th-green`}>
                      +{(selectedMangoGroup.getDepositRate(i) * 100).toFixed(2)}
                      %
                    </span>
                    <span className={`text-th-fgd-4`}>{'  /  '}</span>
                    <span className={`text-th-red`}>
                      -{(selectedMangoGroup.getBorrowRate(i) * 100).toFixed(2)}%
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
          <div className={`flex flex-nowrap`}>
            Margin Account:
            <a
              href={'https://explorer.solana.com/address/' + marginAccount}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className={`ml-4 flex`}>
                <ExternalLinkIcon
                  className={`h-5 w-5 mr-1 text-mango-yellow`}
                />
                <span className={`text-mango-yellow hover:opacity-50`}>
                  {marginAccount}
                </span>
              </div>
            </a>
          </div>
          <div className={`flex mt-2`}>
            Account Owner:
            <a
              href={'https://explorer.solana.com/address/' + owner}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className={`ml-4 flex`}>
                <ExternalLinkIcon
                  className={`h-5 w-5 mr-1 text-mango-yellow`}
                />
                <span className={`text-mango-yellow hover:opacity-50`}>
                  {owner}
                </span>
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
