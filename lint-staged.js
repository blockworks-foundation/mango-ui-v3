module.exports = {
  '*.{js,jsx,ts,tsx}': ['eslint --quiet', () => 'tsc-files --noEmit'],
  '*.{js,jsx,ts,tsx,json,css,js}': ['prettier --write'],
}
