// const colors = require('tailwindcss/colors')
const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  darkMode: 'class',
  theme: {
    extend: {
      cursor: {
        help: 'help',
      },
      fontFamily: {
        sans: ['Lato', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'mango-yellow': '#F2C94C',
        'mango-red': '#E54033',
        'mango-green': '#AFD803',
        'mango-dark': {
          lighter: '#332F46',
          light: '#262337',
          DEFAULT: '#141026',
        },
        'mango-med': {
          light: '#C2BDD9',
          DEFAULT: '#9490A6',
          dark: '#706C81',
        },
        'mango-light': {
          light: '#FCFCFF',
          DEFAULT: '#F0EDFF',
          dark: '#B9B5CE',
        },
      },
    },
  },
  variants: {},
  plugins: [],
  // xwind options
  xwind: {
    mode: 'objectstyles',
  },
}
