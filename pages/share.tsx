import Head from 'next/head'
import TopBar from '../components/TopBar'
import MarketSelect from '../components/MarketSelect'
import { PageBodyWrapper } from '../components/styles'

const Share = ({
  side,
  market,
  pnl,
  avgEntry,
  markPrice,
  leverage,
  metaTags,
}) => {
  return (
    <>
      <Head>
        {metaTags &&
          Object.entries(metaTags).map((entry) => (
            <meta
              key={entry[0]}
              name={entry[0]}
              // content={entry[1]}
            />
          ))}
      </Head>
      <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all `}>
        <TopBar />
        <MarketSelect />
        <PageBodyWrapper className="p-1 sm:px-2 sm:py-1 md:px-2 md:py-1">
          <a
            className="bg-th-bkg-3 block mt-6 px-4 py-3 rounded-full text-center text-th-fgd-1 w-full"
            href={`https://twitter.com/intent/tweet?text=I'm ${side} %24${market} perp on %40mangomarkets&url=https://deploy-preview-58--hardcore-williams-253780.netlify.app?market=${market}&side=${side}&pnl=${pnl}&avgEntry=${avgEntry}&markPrice=${markPrice}&leverage=${leverage}`}
            target="_blank"
            rel="noreferrer"
          >
            Tweet Position
          </a>
        </PageBodyWrapper>
      </div>
    </>
  )
}

export default Share

export async function getServerSideProps({ query }) {
  const {
    side = null,
    market = null,
    pnl = null,
    avgEntry = null,
    markPrice = null,
    leverage = null,
  } = query
  const metaTags = {
    'twitter:card': 'summary_large_image',
    'twitter:description':
      'Mango Markets - Decentralised, cross-margin trading up to 10x leverage with lightning speed and near-zero fees.',
    'twitter:image': `https://og-image-saml33.vercel.app/${side}.png&market=${market}&avgEntry=${avgEntry}&markPrice=${markPrice}&pnl=${pnl}`,
    'twitter:title': 'Trade on Mango Markets',
  }

  return {
    props: {
      side,
      market,
      pnl,
      avgEntry,
      markPrice,
      leverage,
      metaTags,
    },
  }
}
