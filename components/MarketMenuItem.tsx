import { useState } from 'react'
import { useRouter } from 'next/router'
import { QuestionMarkCircleIcon } from '@heroicons/react/outline'
import Link from 'next/link'
import * as MonoIcons from './icons'
import { initialMarket } from './SettingsModal'

const MarketMenuItem: React.FC<{ menuTitle: string; linksArray: any[] }> = ({
  menuTitle = '',
  linksArray = [],
}) => {
  const { asPath } = useRouter()
  const [openState, setOpenState] = useState(false)

  const iconName = `${menuTitle.slice(0, 1)}${menuTitle
    .slice(1, 4)
    .toLowerCase()}MonoIcon`

  const SymbolIcon = MonoIcons[iconName] || QuestionMarkCircleIcon

  const onHover = (open, action) => {
    if (
      (!open && action === 'onMouseEnter') ||
      (open && action === 'onMouseLeave')
    ) {
      setOpenState((openState) => !openState)
    }
  }

  const isSelected =
    asPath.includes(`=${menuTitle}`) ||
    (asPath === '/' && initialMarket.name.includes(menuTitle))

  return (
    <div className="relative">
      <div
        onMouseEnter={() => onHover(openState, 'onMouseEnter')}
        onMouseLeave={() => onHover(openState, 'onMouseLeave')}
        className="flex h-10 cursor-pointer flex-col px-3"
      >
        <div
          className={`flex h-10 items-center text-th-fgd-3 hover:text-th-primary focus:outline-none ${
            isSelected ? 'text-th-primary' : ''
          }`}
        >
          <SymbolIcon className={`mr-1.5 hidden h-3.5 w-auto lg:block `} />
          <span className={`text-xs font-normal`}>{menuTitle}</span>
        </div>
        {openState ? (
          <div className="absolute top-10 z-10">
            <div className="relative divide-y divide-th-fgd-4 rounded rounded-t-none bg-th-bkg-3 px-3">
              {linksArray.map((m) => (
                <Link
                  href={{
                    pathname: '/',
                    query: { name: m.name },
                  }}
                  key={m.name}
                  shallow={true}
                >
                  <a
                    className={`block whitespace-nowrap py-2 text-xs hover:text-th-primary ${
                      asPath.includes(m.name) ||
                      (asPath === '/' && initialMarket.name === m.name)
                        ? 'text-th-primary'
                        : 'text-th-fgd-1'
                    }`}
                  >
                    {m.name}
                  </a>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default MarketMenuItem
