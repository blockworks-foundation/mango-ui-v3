import React from 'react'
import xw from 'xwind'
import styled from '@emotion/styled'

const Wrapper = styled.div`
  border: 1px solid #584f81;
`

export default function FloatingElement({ css = undefined, children }) {
  return (
    <Wrapper
      css={xw`m-1 px-2 py-4 h-full bg-mango-dark rounded-lg overflow-auto`}
    >
      {children}
    </Wrapper>
  )
}
