import { memo, useMemo, useState, PureComponent, useEffect } from 'react'
import { SearchIcon } from '@heroicons/react/solid'
import Modal from './Modal'
import { FixedSizeList } from 'react-window'
import { Token } from '../@types/types'

const generateSearchTerm = (item: Token, searchValue: string) => {
  const normalizedSearchValue = searchValue.toLowerCase()
  const values = `${item.symbol} ${item.name}`.toLowerCase()

  const isMatchingWithSymbol =
    item.symbol.toLowerCase().indexOf(normalizedSearchValue) >= 0
  const matchingSymbolPercent = isMatchingWithSymbol
    ? normalizedSearchValue.length / item.symbol.length
    : 0

  return {
    token: item,
    matchingIdx: values.indexOf(normalizedSearchValue),
    matchingSymbolPercent,
  }
}

const startSearch = (items: Token[], searchValue: string) => {
  return items
    .map((item) => generateSearchTerm(item, searchValue))
    .filter((item) => item.matchingIdx >= 0)
    .sort((i1, i2) => i1.matchingIdx - i2.matchingIdx)
    .sort((i1, i2) => i2.matchingSymbolPercent - i1.matchingSymbolPercent)
    .map((item) => item.token)
}

type ItemRendererProps = {
  data: any
  index: number
  style: any
}

class ItemRenderer extends PureComponent<ItemRendererProps> {
  render() {
    // Access the items array using the "data" prop:
    const tokenInfo = this.props.data.items[this.props.index]

    return (
      <div style={this.props.style}>
        <button
          key={tokenInfo?.address}
          className="flex w-full cursor-pointer items-center justify-between rounded-none py-4 px-6 font-normal focus:bg-th-bkg-3 focus:outline-none md:hover:bg-th-bkg-4"
          onClick={() => this.props.data.onSubmit(tokenInfo)}
        >
          <div className="flex items-center">
            <img
              src={tokenInfo?.logoURI}
              width="24"
              height="24"
              alt={tokenInfo?.symbol}
            />
            <div className="ml-4">
              <div className="text-left text-th-fgd-2">
                {tokenInfo?.symbol || 'unknown'}
              </div>
              <div className="text-left text-th-fgd-4">
                {tokenInfo?.name || 'unknown'}
              </div>
            </div>
          </div>
        </button>
      </div>
    )
  }
}

const SwapTokenSelect = ({
  isOpen,
  sortedTokenMints,
  onClose,
  onTokenSelect,
  walletTokens,
}: {
  isOpen: boolean
  sortedTokenMints: Token[]
  onClose?: (x?) => void
  onTokenSelect?: (x?) => void
  walletTokens?: Array<any>
}) => {
  const [search, setSearch] = useState('')

  const popularTokenSymbols = ['USDC', 'SOL', 'USDT', 'MNGO', 'BTC', 'ETH']

  const popularTokens = useMemo(() => {
    return walletTokens?.length
      ? sortedTokenMints.filter((token) => {
          const walletMints = walletTokens.map((tok) =>
            tok.account.mint.toString()
          )
          return !token?.name || !token?.symbol
            ? false
            : popularTokenSymbols.includes(token.symbol) &&
                walletMints.includes(token.address)
        })
      : sortedTokenMints.filter((token) => {
          return !token?.name || !token?.symbol
            ? false
            : popularTokenSymbols.includes(token.symbol)
        })
  }, [walletTokens])

  useEffect(() => {
    function onEscape(e) {
      if (e.keyCode === 27) {
        onClose?.()
      }
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [])

  const tokenInfos = useMemo(() => {
    if (sortedTokenMints?.length) {
      const filteredTokens = sortedTokenMints.filter((token) => {
        return !token?.name || !token?.symbol ? false : true
      })
      if (walletTokens?.length) {
        const walletMints = walletTokens.map((tok) =>
          tok.account.mint.toString()
        )
        return filteredTokens.sort(
          (a, b) =>
            walletMints.indexOf(b.address) - walletMints.indexOf(a.address)
        )
      } else {
        return filteredTokens
      }
    } else {
      return []
    }
  }, [sortedTokenMints])

  const handleUpdateSearch = (e) => {
    setSearch(e.target.value)
  }

  const sortedTokens = search ? startSearch(tokenInfos, search) : tokenInfos

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideClose noPadding alignTop>
      <div className="flex flex-col pb-2 md:h-2/3">
        <div className="flex items-center p-6 text-lg text-th-fgd-4">
          <SearchIcon className="h-8 w-8" />
          <input
            type="text"
            className="ml-4 flex-1 bg-th-bkg-1 focus:outline-none"
            placeholder="Search by token or paste address"
            autoFocus
            value={search}
            onChange={handleUpdateSearch}
          />
        </div>
        {popularTokens.length && onTokenSelect ? (
          <div className="flex flex-wrap px-4">
            {popularTokens.map((token) => (
              <button
                className="mx-1 mb-2 flex items-center rounded-md border border-th-fgd-4 bg-th-bkg-1 py-1 px-3 hover:border-th-fgd-3 focus:border-th-fgd-2"
                onClick={() => onTokenSelect(token)}
                key={token.address}
              >
                <img
                  alt=""
                  width="16"
                  height="16"
                  src={`/assets/icons/${token.symbol.toLowerCase()}.svg`}
                  className={`mr-1.5`}
                />
                <span className="text-th-fgd-1">{token.symbol}</span>
              </button>
            ))}
          </div>
        ) : null}
        <FixedSizeList
          width="100%"
          height={403}
          itemData={{ items: sortedTokens, onSubmit: onTokenSelect }}
          itemCount={sortedTokens.length}
          itemSize={72}
          className="thin-scroll"
        >
          {ItemRenderer}
        </FixedSizeList>
      </div>
    </Modal>
  )
}

export default memo(SwapTokenSelect)
