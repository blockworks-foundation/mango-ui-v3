import { memo, useMemo, useState, PureComponent } from 'react'
import { SearchIcon } from '@heroicons/react/outline'
import { TokenInfo } from '@solana/spl-token-registry'
import Modal from './Modal'
import { FixedSizeList } from 'react-window'

const generateSearchTerm = (item: TokenInfo, searchValue: string) => {
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

const startSearch = (items: TokenInfo[], searchValue: string) => {
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
        <div
          key={tokenInfo?.address}
          className="flex justify-between items-center py-4 hover:bg-th-bkg-4 cursor-pointer px-6"
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
              <div className="text-th-fgd-2">
                {tokenInfo?.symbol || 'unknown'}
              </div>
              <div className="text-th-fgd-4">
                {tokenInfo?.name || 'unknown'}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

const SwapTokenSelect = ({
  isOpen,
  sortedTokenMints,
  onClose,
  tokenMap,
  onTokenSelect,
}: {
  isOpen: boolean
  sortedTokenMints: Array<string>
  onClose?: (x?) => void
  tokenMap: Map<string, TokenInfo>
  onTokenSelect?: (x?) => void
}) => {
  const [search, setSearch] = useState('')

  const tokenInfos = useMemo(() => {
    return sortedTokenMints
      .map((token) => {
        return tokenMap.get(token)
      })
      .filter((tokenInfo) => {
        return !tokenInfo?.name || !tokenInfo?.symbol ? false : true
      })
  }, [sortedTokenMints, tokenMap])

  const handleUpdateSearch = (e) => {
    setSearch(e.target.value)
  }

  const sortedTokens = search ? startSearch(tokenInfos, search) : tokenInfos

  return (
    <Modal isOpen={isOpen} onClose={onClose} hideClose noPadding alignTop>
      <div className="flex flex-col pb-2 md:h-2/3">
        <div className="flex items-center text-th-fgd-4 text-lg p-6">
          <SearchIcon className="w-8 h-8" />
          <input
            type="text"
            className="flex-1 ml-4 bg-th-bkg-2 focus:outline-none"
            placeholder="Search by token or paste address"
            autoFocus
            value={search}
            onChange={handleUpdateSearch}
          />
        </div>
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
