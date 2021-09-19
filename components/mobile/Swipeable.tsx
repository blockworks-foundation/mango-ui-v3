import { Component } from 'react'
import SwipeableViews from 'react-swipeable-views'

interface SwipeableProps {
  index: number
  onChangeIndex: (x) => void
  children: React.ReactNode
}

class Swipeable extends Component<SwipeableProps> {
  componentDidUpdate() {
    // @ts-ignore
    this.swipeableActions.updateHeight()
  }
  render() {
    const { children, index, onChangeIndex } = this.props
    return (
      <SwipeableViews
        action={(actions) => {
          // @ts-ignore
          this.swipeableActions = actions
        }}
        enableMouseEvents
        index={index}
        onChangeIndex={onChangeIndex}
        slideStyle={{ overflow: 'inherit' }}
        style={{ overflow: 'hidden' }}
      >
        {children}
      </SwipeableViews>
    )
  }
}

export default Swipeable
