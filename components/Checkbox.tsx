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

const Checkbox = ({ checked, children, ...props }) => (
  <label className="cursor-pointer flex items-center">
    <HiddenCheckbox checked={checked} {...props} type="checkbox" />
    <div
      className={`${
        checked ? 'border-th-primary' : 'border-th-fgd-4'
      } border cursor-pointer default-transition flex items-center justify-center rounded h-4 w-4`}
    >
      <CheckIcon
        className={`${checked ? 'block' : 'hidden'} h-4 w-4 text-th-primary`}
      />
    </div>
    <span className="ml-2 text-xs text-th-fgd-3">{children}</span>
  </label>
)

export default Checkbox
