import xw from 'xwind'
import { percentFormat } from '../utils/index'
import useSrmAccount from '../hooks/useSrmAccount'
import useMangoStore from '../stores/useMangoStore'

const FeeDiscountsTable = () => {
  const { totalSrm, rates } = useSrmAccount()
  const connected = useMangoStore((s) => s.wallet.connected)

  return (
    <div css={xw`flex bg-mango-dark-light py-6`}>
      <div
        css={xw`flex flex-col justify-center m-auto text-gray-300 text-base font-light text-center`}
      >
        <div>Total SRM in Mango: {totalSrm}</div>
        <div css={xw`mt-2`}>
          Maker Fee: {rates ? percentFormat.format(rates.maker) : null}%
        </div>
        <div>
          Taker Fee: {rates ? percentFormat.format(rates.taker) : null}%
        </div>
        <div css={xw`mt-6`}>
          {connected ? (
            <div css={xw`bg-mango-dark p-6`}>
              <div css={xw`text-gray-500`}>Your contributed SRM: 0</div>
              <div css={xw`flex space-x-4 mt-8`}>
                <button
                  css={xw`px-8 py-2 border border-mango-dark-lighter bg-mango-dark-light text-mango-yellow hover:bg-mango-dark-lighter`}
                >
                  Deposit
                </button>
                <button
                  css={xw`px-8 py-2 border border-mango-dark-lighter bg-mango-dark-light text-mango-yellow hover:bg-mango-dark-lighter`}
                >
                  Withdraw
                </button>
              </div>
            </div>
          ) : (
            <button disabled css={xw`px-8 cursor-default py-2 bg-mango-dark`}>
              Connect a wallet to deposit SRM
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default FeeDiscountsTable
