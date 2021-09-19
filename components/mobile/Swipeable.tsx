import { Component } from 'react'
import SwipeableViews from 'react-swipeable-views'

// @ts-ignore
class Swipeable extends Component {
  componentDidUpdate() {
    // @ts-ignore
    this.swipeableActions.updateHeight()
  }
  render() {
    // @ts-ignore
    const { children, index, onChangeIndex } = this.props
    return (
      <SwipeableViews
        // animateHeight
        action={(actions) => {
          // @ts-ignore
          this.swipeableActions = actions
        }}
        enableMouseEvents
        index={index}
        onChangeIndex={onChangeIndex}
        style={{ overflow: 'hidden' }}
      >
        {children}
      </SwipeableViews>
    )
  }
}

export default Swipeable
