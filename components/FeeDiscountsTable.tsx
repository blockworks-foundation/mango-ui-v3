import xw from 'xwind'
import { percentFormat } from '../utils/index'
import useSrmAccount from '../hooks/useSrmAccount'
import useMangoStore from '../stores/useMangoStore'
import Button from './Button'

const FeeDiscountsTable = () => {
  const { totalSrm, rates } = useSrmAccount()
  const connected = useMangoStore((s) => s.wallet.connected)

  return (
    <div css={xw`flex bg-mango-dark-light py-6 mt-4`}>
      <div
        css={xw`flex flex-col justify-center m-auto text-gray-300 text-base font-light text-center`}
      >
        <div>
          <span css={xw`font-bold mr-2`}>Total SRM deposits in Mango:</span>{' '}
          {totalSrm}
        </div>
        <div css={xw`mt-2`}>
          <span css={xw`mr-2`}>Maker Fee:</span>{' '}
          {rates ? percentFormat.format(rates.maker) : null}%
        </div>
        <div>
          <span css={xw`mr-2`}>Taker Fee:</span>{' '}
          {rates ? percentFormat.format(rates.taker) : null}%
        </div>
        <div css={xw`mt-6`}>
          {connected ? (
            <div css={xw`bg-mango-dark p-6`}>
              <div css={xw`text-gray-500`}>Your contributed SRM: 0</div>
              <div css={xw`flex space-x-4 mt-8`}>
                <Button>Deposit</Button>
                <Button>Withdraw</Button>
              </div>
            </div>
          ) : (
            <button
              disabled
              css={xw`px-8 cursor-default font-light py-2.5 bg-mango-dark text-mango-med-dark text-lg`}
            >
              Connect a wallet to deposit SRM
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default FeeDiscountsTable
