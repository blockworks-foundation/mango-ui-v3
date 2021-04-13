const withAntdLess = require('next-plugin-antd-less')

module.exports = withAntdLess({
  target: 'serverless',
  lessVarsFilePath: './styles/theme.less',
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    })

    return config
  },
})
