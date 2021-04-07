import React from 'react'
import xw from 'xwind'
import styled from '@emotion/styled'

const Wrapper = styled.div`
  border: 1px solid #584f81;
`

export default function FloatingElement({ shrink = false, children }) {
  return (
    <Wrapper
      css={[
        xw`m-1 p-4 bg-mango-dark rounded-lg overflow-auto`,
        shrink ? null : xw`h-full`,
      ]}
    >
      {children}
    </Wrapper>
  )
}
