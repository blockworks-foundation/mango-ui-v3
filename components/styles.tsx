import styled from '@emotion/styled'
import xw from 'xwind'

export const ElementTitle = styled.div(
  xw`flex justify-center mb-4 text-lg items-center`
)

export const Button = styled.button(xw`
  px-8 py-2 
  border border-mango-dark-lighter 
  bg-mango-dark-light hover:bg-mango-dark-lighter
  text-mango-yellow
  focus:outline-none active:border-mango-yellow`)
