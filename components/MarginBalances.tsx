import { Popover } from 'antd'
import { useCallback, useState } from 'react'
import xw from 'xwind'
import {
  ExternalLinkIcon,
  InformationCircleIcon,
} from '@heroicons/react/outline'
import FloatingElement from './FloatingElement'
import { Button, ElementTitle } from './styles'
import useMangoStore from '../stores/useMangoStore'
import useMarketList from '../hooks/useMarketList'
import { tokenPrecision } from '../utils/index'
import DepositModal from './DepositModal'

export default function MarginStats() {
  const selectedMangoGroup = useMangoStore((s) => s.selectedMangoGroup.current)
  const selectedMarginAccount = useMangoStore(
    (s) => s.selectedMarginAccount.current
  )
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
                css={xw`h-5 w-5 ml-2 text-mango-yellow cursor-help`}
              />
            </div>
          </Popover>
        </ElementTitle>
        {selectedMangoGroup ? (
          <table css={xw`min-w-full`}>
            <thead>
              <tr css={xw`text-center text-mango-med-dark mb-2`}>
                <th scope="col" css={xw`flex-auto`}>
                  Assets
                </th>
                <th scope="col" css={xw`flex-auto`}>
                  Deposits
                </th>
                <th scope="col" css={xw`flex-auto`}>
                  Borrows
                </th>
                <th scope="col" css={xw`flex-auto`}>
                  Interest
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(symbols).map(([name], i) => (
                <tr
                  key={name}
                  css={xw`text-mango-med-dark text-gray-300 tracking-wide`}
                >
                  <td css={xw`flex items-center py-2`}>
                    <img
                      alt=""
                      width="20"
                      height="20"
                      src={`/assets/icons/${name.toLowerCase()}.svg`}
                      css={xw`mr-4`}
                    />
                    <span>{name}</span>
                  </td>
                  <td css={xw`text-center`}>
                    {selectedMarginAccount
                      ? selectedMarginAccount
                          .getUiDeposit(selectedMangoGroup, i)
                          .toFixed(tokenPrecision[name])
                      : (0).toFixed(tokenPrecision[name])}
                  </td>
                  <td css={xw`text-center`}>
                    {selectedMarginAccount
                      ? selectedMarginAccount
                          .getUiDeposit(selectedMangoGroup, i)
                          .toFixed(tokenPrecision[name])
                      : (0).toFixed(tokenPrecision[name])}
                  </td>
                  <td css={xw`text-center`}>
                    <span css={xw`text-mango-green`}>
                      +{(selectedMangoGroup.getDepositRate(i) * 100).toFixed(2)}
                      %
                    </span>
                    <span>{'  /  '}</span>
                    <span css={xw`text-mango-red`}>
                      -{(selectedMangoGroup.getBorrowRate(i) * 100).toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
        <div css={xw`flex justify-around items-center mt-4`}>
          <div>
            <Button onClick={() => setShowDepositModal(true)}>
              <span>Deposit</span>
            </Button>
          </div>
          <div>
            <Button onClick={() => setShowWithdrawModal(true)} css={xw`ml-4`}>
              <span>Withdraw</span>
            </Button>
          </div>
        </div>
        <div css={xw`text-center mt-4 text-mango-med tracking-wider`}>
          Settle funds in the Balances tab
        </div>
      </FloatingElement>
      {showDepositModal && (
        <DepositModal isOpen={showDepositModal} onClose={handleCloseDeposit} />
      )}
      {showWithdrawModal && (
        <DepositModal
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
          <div css={xw`flex`}>
            Margin Account:
            <a
              href={'https://explorer.solana.com/address/' + marginAccount}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div css={xw`ml-4 flex`}>
                <ExternalLinkIcon css={xw`h-5 w-5 mr-1 text-mango-yellow`} />
                <span css={xw`text-mango-yellow hover:opacity-50`}>
                  {marginAccount}
                </span>
              </div>
            </a>
          </div>
          <div css={xw`flex mt-2`}>
            Account Owner:
            <a
              href={'https://explorer.solana.com/address/' + owner}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div css={xw`ml-4 flex`}>
                <ExternalLinkIcon css={xw`h-5 w-5 mr-1 text-mango-yellow`} />
                <span css={xw`text-mango-yellow hover:opacity-50`}>
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
