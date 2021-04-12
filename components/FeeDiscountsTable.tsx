import xw from 'xwind'
import { percentFormat } from '../utils/index'
import useSrmAccount from '../hooks/useSrmAccount'
import useMangoStore from '../stores/useMangoStore'
import Button from './Button'

const FeeDiscountsTable = () => {
  const { totalSrm, rates } = useSrmAccount()
  const connected = useMangoStore((s) => s.wallet.connected)

  return (
    <div css={xw`flex flex-col items-center bg-th-bkg-1 py-6 mt-4 rounded-md`}>
      <div
        css={xw`flex flex-col sm:flex-row justify-between m-auto text-th-fgd-4 text-base font-light text-center`}
      >
        <div css={xw`px-4`}>
          <div>Total SRM in Mango</div>
          <div css={xw`text-th-fgd-1 text-lg font-semibold`}>
            {totalSrm.toFixed(0)}
          </div>
        </div>
        <div css={xw`px-4 mt-4 sm:mt-0`}>
          <div>Maker Fee</div>
          <div css={xw`text-th-fgd-1 text-lg font-semibold`}>
            {rates ? percentFormat.format(rates.maker) : null}
          </div>
        </div>
        <div css={xw`px-4 mt-4 sm:mt-0`}>
          <div>Taker Fee</div>
          <div css={xw`text-th-fgd-1 text-lg font-semibold`}>
            {rates ? percentFormat.format(rates.taker) : null}
          </div>
        </div>
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
          <Button disabled>Connect wallet to deposit SRM</Button>
        )}
      </div>
    </div>
  )
}

export default FeeDiscountsTable
