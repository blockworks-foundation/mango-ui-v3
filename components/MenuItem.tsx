import { useRouter } from 'next/router'
import xw from 'xwind'
import Link from 'next/link'

const MenuItem = ({ href, children }) => {
  const { asPath } = useRouter()

  return (
    <Link href={href} passHref>
      <a
        css={[
          xw`block text-white sm:inline-flex items-center pl-3 pr-4 py-2 sm:px-1 sm:pt-1 sm:pb-0 border-l-4 sm:border-l-0 sm:border-b-2 text-lg font-light`,
          asPath === href
            ? xw`border-mango-yellow`
            : xw`border-transparent hover:border-mango-yellow`,
        ]}
      >
        {children}
      </a>
    </Link>
  )
}

export default MenuItem
