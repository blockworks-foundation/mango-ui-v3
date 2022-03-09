import { useRouter } from 'next/router'
import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/solid'

const MenuItem = ({ href, children, newWindow = false }) => {
  const { asPath } = useRouter()

  return (
    <Link href={href} shallow={true}>
      <a
        className={`flex h-full items-center justify-between border-b border-th-bkg-4 p-3 font-bold text-th-fgd-1 hover:text-th-primary md:border-none md:py-0
          ${asPath === href ? `text-th-primary` : `border-transparent`}
        `}
        target={newWindow ? '_blank' : ''}
        rel={newWindow ? 'noopener noreferrer' : ''}
      >
        {children}
        <ChevronRightIcon className="h-5 w-5 md:hidden" />
      </a>
    </Link>
  )
}

export default MenuItem
