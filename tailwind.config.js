// const colors = require('tailwindcss/colors')
// const defaultTheme = require('tailwindcss/defaultTheme')

module.exports = {
  mode: 'jit',
  purge: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  future: {
    removeDeprecatedGapUtilities: true,
    purgeLayersByDefault: true,
  },
  darkMode: false,
  theme: {
    fontFamily: {
      display: ['Lato, sans-serif'],
      body: ['Lato, sans-serif'],
    },
    extend: {
      cursor: {
        help: 'help',
      },
      colors: {
        'mango-orange': {
          DEFAULT: '#DFAB01',
          dark: '#CB9C01',
        },
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
        'mango-grey': {
          lighter: '#f7f7f7',
          light: '#e6e6e6',
          dark: '#092e34',
          darker: '#072428',
          darkest: '#061f23',
        },
        'light-theme': {
          orange: '#FF9C24',
          red: { DEFAULT: '#CC2929', dark: '#AA2222' },
          green: { DEFAULT: '#5EBF4D', dark: '#4BA53B' },
          'bkg-1': '#f7f7f7',
          'bkg-2': '#FFFFFF',
          'bkg-3': '#EDEDED',
          'fgd-1': '#061f23',
          'fgd-2': '#0C3F45',
          'fgd-3': '#446065',
          'fgd-4': '#B0B0B0',
        },
        'dark-theme': {
          yellow: '#F2C94C',
          red: { DEFAULT: '#CC2929', dark: '#AA2222' },
          green: { DEFAULT: '#5EBF4D', dark: '#4BA53B' },
          orange: { DEFAULT: '#FF9C24' },
          'bkg-1': '#1C1C1C',
          'bkg-2': '#2B2B2B',
          'bkg-3': '#424242',
          'fgd-1': '#FFFFFF',
          'fgd-2': '#F7F7F7',
          'fgd-3': '#E7E7E7',
          'fgd-4': '#878787',
        },
        'mango-theme': {
          yellow: '#F2C94C',
          red: {
            DEFAULT: '#E54033',
            dark: '#C7251A',
          },
          green: {
            DEFAULT: '#AFD803',
            dark: '#91B503',
          },
          orange: { DEFAULT: '#FF9C24' },
          'bkg-1': '#141026',
          'bkg-2': '#1D1832',
          'bkg-3': '#322E47',
          'fgd-1': '#F0EDFF',
          'fgd-2': '#FCFCFF',
          'fgd-3': '#B9B5CE',
          'fgd-4': '#706C81',
        },
        'th-bkg-1': 'var(--bkg-1)',
        'th-bkg-2': 'var(--bkg-2)',
        'th-bkg-3': 'var(--bkg-3)',
        'th-fgd-1': 'var(--fgd-1)',
        'th-fgd-2': 'var(--fgd-2)',
        'th-fgd-3': 'var(--fgd-3)',
        'th-fgd-4': 'var(--fgd-4)',
        'th-primary': 'var(--primary)',
        'th-red': 'var(--red)',
        'th-red-dark': 'var(--red-dark)',
        'th-green': 'var(--green)',
        'th-green-dark': 'var(--green-dark)',
        'th-orange': 'var(--orange)',
      },
      keyframes: {
        shake: {
          '0%, 100%': {
            transform: 'rotate(0deg)',
          },
          '20%, 60%': {
            transform: 'rotate(6deg)',
          },
          '40%, 80%': {
            transform: 'rotate(-6deg)',
          },
        },
      },
      animation: {
        shake: 'shake 0.4s linear 4',
      },
    },
  },
  variants: {
    extend: {
      cursor: ['hover', 'focus', 'disabled'],
      opacity: ['disabled'],
      backgroundColor: ['disabled'],
      textColor: ['disabled'],
    },
  },
  plugins: [],
}
