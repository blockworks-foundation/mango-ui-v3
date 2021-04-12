import Head from 'next/head'
import { Global } from '@emotion/react'
import xw from 'xwind'
import { ThemeProvider } from 'next-themes'
import '../node_modules/react-grid-layout/css/styles.css'
import '../node_modules/react-resizable/css/styles.css'
import '../styles/index.css'

function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <title>Mango Markets</title>
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600&display=swap"
          rel="stylesheet"
        />

        <script src="/datafeeds/udf/dist/polyfills.js"></script>
        <script src="/datafeeds/udf/dist/bundle.js"></script>
      </Head>
      <Global
        //tailwind base styles + keyframes + ring and shadow classes variables  ... to global styles
        styles={xw`XWIND_BASE XWIND_GLOBAL`}
      />
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  )
}

export default App
