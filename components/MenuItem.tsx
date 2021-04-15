import { useRouter } from 'next/router'
import Link from 'next/link'

const MenuItem = ({ href, children }) => {
  const { asPath } = useRouter()

  return (
    <Link href={href}>
      <a
        className={`block text-th-fgd-1 font-medium items-center pl-3 pr-4 py-2 
          sm:inline-flex sm:ml-4 sm:px-1 sm:py-0 border-l-4 sm:border-l-0 sm:border-b-2 text-lg tracking-wide hover:text-th-primary
          ${
            asPath === href
              ? `border-th-primary`
              : `border-transparent hover:border-th-primary`
          }
        `}
      >
        {children}
      </a>
    </Link>
  )
}

export default MenuItem
