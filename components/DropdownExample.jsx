import { Menu, Transition } from '@headlessui/react'
import useMarketList from '../hooks/useMarketList'
import useMarket from '../hooks/useMarket'

const DropdownExample = () => {
  const { spotMarkets } = useMarketList()
  const { marketName } = useMarket()

  // const handleChange = (e) => {
  //   console.log('new market selected', e)
  // }

  return (
    <div className={`ml-4`}>
      <Menu>
        {({ open }) => (
          <>
            <Menu.Button>{marketName}</Menu.Button>
            <Transition
              show={open}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items>
                {Object.entries(spotMarkets).map(([name, address]) => (
                  <Menu.Item key={address}>
                    {({ active }) => (
                      <a
                        className={`${active && 'bg-blue-500'}`}
                        href="/account-settings"
                      >
                        {name}
                      </a>
                    )}
                  </Menu.Item>
                ))}
              </Menu.Items>
            </Transition>
          </>
        )}
      </Menu>
    </div>
  )
}

export default DropdownExample
