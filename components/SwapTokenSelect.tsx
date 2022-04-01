import { memo, useMemo, useState, PureComponent, useEffect } from 'react'
import { SearchIcon } from '@heroicons/react/outline'
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
          className="flex w-full cursor-pointer items-center justify-between rounded-none py-4 px-6 font-normal hover:bg-th-bkg-4 focus:bg-th-bkg-3 focus:outline-none"
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
}: {
  isOpen: boolean
  sortedTokenMints: Token[]
  onClose?: (x?) => void
  onTokenSelect?: (x?) => void
}) => {
  const [search, setSearch] = useState('')

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
    return sortedTokenMints.filter((token) => {
      return !token?.name || !token?.symbol ? false : true
    })
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
            className="ml-4 flex-1 bg-th-bkg-2 focus:outline-none"
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
