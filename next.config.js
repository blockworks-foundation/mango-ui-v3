const { i18n } = require('./next-i18next.config')

const moduleExports = {
  i18n,
  async redirects() {
    return [
      {
        source: '/market',
        destination: '/',
        permanent: true,
      },
      {
        source: '/spot/:name',
        destination: '/',
        permanent: true,
      },
      {
        source: '/perp/:name',
        destination: '/',
        permanent: true,
      },
    ]
  },
  webpack: (config, { isServer }) => {
    // Important: return the modified config
    if (!isServer) {
      config.resolve.fallback.fs = false
    }

    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    return config
  },
}

module.exports = moduleExports
