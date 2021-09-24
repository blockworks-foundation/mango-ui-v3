import React from 'react'
import styled from '@emotion/styled'
import { CheckIcon } from '@heroicons/react/solid'

const HiddenCheckbox = styled.input`
  border: 0;
  clip: rect(0 0 0 0);
  clippath: inset(50%);
  height: 1px;
  margin: -1px;
  overflow: hidden;
  padding: 0;
  position: absolute;
  white-space: nowrap;
  width: 1px;
`

const Checkbox = ({ checked, ...props }) => (
  <>
    <HiddenCheckbox checked={checked} {...props} type="checkbox" />
    <div
      className={`${
        checked ? 'bg-th-fgd-4' : 'bg-th-bkg-4'
      } cursor-pointer default-transition inline-block rounded h-4 w-4`}
    >
      <CheckIcon
        className={`${checked ? 'block' : 'hidden'} h-4 w-4 text-th-primary`}
      />
    </div>
  </>
)

export default Checkbox
