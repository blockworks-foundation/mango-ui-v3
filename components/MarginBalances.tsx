import { Popover } from 'antd'
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

export default function MarginStats() {
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
          <Popover
            content={
              <AddressTooltip
                owner={selectedMarginAccount?.owner.toString()}
                marginAccount={selectedMarginAccount?.publicKey.toString()}
              />
            }
            placement="topLeft"
            trigger="hover"
          >
            <div>
              <InformationCircleIcon
                className={`h-5 w-5 ml-2 text-mango-yellow cursor-help`}
              />
            </div>
          </Popover>
        </ElementTitle>
        {selectedMangoGroup ? (
          <table className={`min-w-full`}>
            <thead>
              <tr className={`text-center text-th-fgd-4 mb-2`}>
                <th scope="col" className={`flex-auto font-light`}>
                  Assets
                </th>
                <th scope="col" className={`flex-auto font-light`}>
                  Deposits
                </th>
                <th scope="col" className={`flex-auto font-light`}>
                  Borrows
                </th>
                <th scope="col" className={`flex-auto font-light`}>
                  Interest (APY)
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(symbols).map(([name], i) => (
                <tr key={name} className={`text-th-fgd-1 tracking-wide`}>
                  <td className={`flex items-center py-2`}>
                    <img
                      alt=""
                      width="20"
                      height="20"
                      src={`/assets/icons/${name.toLowerCase()}.svg`}
                      className={`mr-4`}
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
                          .getUiDeposit(selectedMangoGroup, i)
                          .toFixed(tokenPrecision[name])
                      : (0).toFixed(tokenPrecision[name])}
                  </td>
                  <td className={`text-center`}>
                    <span className={`text-th-green`}>
                      +{(selectedMangoGroup.getDepositRate(i) * 100).toFixed(2)}
                      %
                    </span>
                    <span>{'  /  '}</span>
                    <span className={`text-th-red`}>
                      -{(selectedMangoGroup.getBorrowRate(i) * 100).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        <div className={`flex justify-around items-center mt-4`}>
          <div>
            <Button
              onClick={() => setShowDepositModal(true)}
              disabled={!connected}
            >
              <span>Deposit</span>
            </Button>
          </div>
          <div>
            <Button
              onClick={() => setShowWithdrawModal(true)}
              className="ml-4"
              disabled={!connected}
            >
              <span>Withdraw</span>
            </Button>
          </div>
        </div>
        <div className={`text-center mt-4 text-th-fgd-4 tracking-wider`}>
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
          <div className={`flex`}>
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
