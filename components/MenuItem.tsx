import { useRouter } from 'next/router'
import Link from 'next/link'

const MenuItem = ({ href, children }) => {
  const { asPath } = useRouter()

  return (
    <Link href={href}>
      <a
        className={`block text-th-fgd-1 font-bold items-center pl-3 pr-4 py-2 
          md:inline-flex md:ml-4 md:px-1 md:py-0 hover:text-th-primary hover:opacity-100
          ${
            asPath === href
              ? `text-th-primary`
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
