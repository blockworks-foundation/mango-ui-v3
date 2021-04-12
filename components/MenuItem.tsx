import { useRouter } from 'next/router'
import xw from 'xwind'
import Link from 'next/link'

const MenuItem = ({ href, children }) => {
  const { asPath } = useRouter()

  return (
    <Link href={href} passHref>
      <a
        css={[
          xw`block text-th-fgd-1 font-semibold items-center pl-3 pr-4 py-2 sm:inline-flex sm:ml-4 sm:px-1 sm:pt-1 sm:pb-0 border-l-4 sm:border-l-0 sm:border-b-2 text-base`,
          asPath === href
            ? xw`border-th-primary`
            : xw`border-transparent hover:border-th-primary`,
        ]}
      >
        {children}
      </a>
    </Link>
  )
}

export default MenuItem
