import Head from 'next/head'
import TopBar from '../components/TopBar'
import MarketSelect from '../components/MarketSelect'
import { PageBodyWrapper } from '../components/styles'

const Share = ({ side, market, pnl, avgEntry, markPrice, leverage }) => {
  return (
    <>
      <Head>
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Trade on Mango Markets" />
        <meta
          name="twitter:description"
          content="Mango Markets - Decentralised, cross-margin trading up to 10x leverage with lightning speed and near-zero fees."
        />
        <meta
          name="twitter:image"
          content={`https://og-image-saml33.vercel.app/${side}.png&market=${market}&avgEntry=${avgEntry}&markPrice=${markPrice}&pnl=${pnl}`}
        />
      </Head>
      <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all `}>
        <TopBar />
        <MarketSelect />
        <PageBodyWrapper className="p-1 sm:px-2 sm:py-1 md:px-2 md:py-1">
          <a
            className="bg-th-bkg-3 block mt-6 px-4 py-3 rounded-full text-center text-th-fgd-1 w-full"
            href={`https://twitter.com/intent/tweet?text=I'm ${side} %24${market.slice(
              -5
            )} perp on %40mangomarkets&url=https://deploy-preview-58--hardcore-williams-253780.netlify.app?market=${market}&side=${side}&pnl=${pnl}&avgEntry=${avgEntry}&markPrice=${markPrice}&leverage=${leverage}`}
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
  // const side = query.side
  // const market = query.market
  // const pnl = query.pnl
  // const avgEntry = query.avgEntry
  // const markPrice = query.markPrice
  // const leverage = query.leverage
  const {
    side = null,
    market = null,
    pnl = null,
    avgEntry = null,
    markPrice = null,
    leverage = null,
  } = query
  // const {
  //   data: { event },
  // } = await getEventLandingDetailsApi(slug);
  //   const metaTags = {
  //       "og:title": `${event.title} - ${event.edition}, ${event.country} Ticket Price, Registration, Dates & Reviews`,
  //       "og:description": event.description.split(0, 150),
  //       "og:image": event.logo.url,
  //       "og:url": `https://someurl.com/events/${event.slug}`,
  //     };
  return {
    props: {
      side,
      market,
      pnl,
      avgEntry,
      markPrice,
      leverage,
    },
  }
}
