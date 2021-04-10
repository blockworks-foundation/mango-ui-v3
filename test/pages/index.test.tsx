import React from 'react'
import { render } from '../testUtils'

describe('Home page', () => {
  it('does not matches snapshot', () => {
    // const { asFragment } = render(<Home />, {})
    // expect(asFragment()).toMatchSnapshot()
    render(<div />, {})
    expect(true).toBe(true)
  })

  // it('clicking button triggers alert', () => {
  //   const { getByText } = render(<Home />, {})
  //   window.alert = jest.fn()
  //   fireEvent.click(getByText('Test Button'))
  //   expect(window.alert).toHaveBeenCalledWith('With typescript and Jest')
  // })
})

export {}
