import React, { Component } from 'react'
import { Steps } from 'intro.js-react'

export const SHOW_TOUR_KEY = 'showTour'

interface Props {
  showTour: boolean
  connected: boolean
}

interface State {
  steps: any
  stepsEnabled: boolean
  initialStep: number
}

class IntroTips extends Component<Props, State> {
  steps: any
  constructor(props) {
    super(props)
    this.state = {
      stepsEnabled: true,
      initialStep: 0,
      steps: [
        {
          element: '#intro-step-0',
          intro: (
            <div>
              <h4>Connect your wallet</h4>
              <p>We&apos;ll show you around...</p>
            </div>
          ),
          tooltipClass: 'intro-tooltip',
          highlightClass: 'intro-highlight',
        },
        {
          element: '#intro-step-1',
          intro: (
            <div>
              <h4>Profile Menu</h4>
              <p>
                Access your Mango Accounts, copy your wallet address and
                disconnect here.
              </p>
            </div>
          ),
          tooltipClass: 'intro-tooltip',
          highlightClass: 'intro-highlight',
          disableInteraction: true,
        },
        {
          element: '#intro-step-2',
          intro: (
            <div>
              <h4>Pick a theme</h4>
              <p>Mango, Dark or Light (if you&apos;re that way inclined).</p>
            </div>
          ),
          tooltipClass: 'intro-tooltip',
          highlightClass: 'intro-highlight',
          disableInteraction: true,
        },
        {
          element: '#intro-step-3',
          intro: (
            <div>
              <h4>English not your preferred language?</h4>
              <p>No problem, change it here. More languages coming soon...</p>
            </div>
          ),
          tooltipClass: 'intro-tooltip',
          highlightClass: 'intro-highlight',
          disableInteraction: true,
        },
        {
          element: '#intro-step-4',
          intro: (
            <div>
              <h4>Refresh your account data</h4>
              <p>
                Data is refreshed automatically but you can manually refresh
                here.
              </p>
            </div>
          ),
          tooltipClass: 'intro-tooltip',
          highlightClass: 'intro-highlight',
          disableInteraction: true,
        },
        {
          element: '#intro-step-5',
          intro: (
            <div>
              <h4>Customize the layout</h4>
              <p>
                Unlock to re-arrange and re-size the trading panels to your
                liking.
              </p>
            </div>
          ),
          tooltipClass: 'intro-tooltip',
          highlightClass: 'intro-highlight',
          disableInteraction: true,
        },
        {
          element: '#intro-step-6',
          intro: (
            <div>
              <h4>Perp position details</h4>
              <p>
                When you open a perp position, you&apos;ll see the details here.
                If you&apos;re unfamiliar with how settling PnL works, we&apos;d
                recommend reading up on it before you get started.
              </p>
            </div>
          ),
          tooltipClass: 'intro-tooltip',
          highlightClass: 'intro-highlight',
          disableInteraction: true,
        },
      ],
    }
  }

  handleEndTour = () => {
    localStorage.setItem('showTour', 'false')
    this.setState({ stepsEnabled: false })
  }

  onBeforeChange = (nextStepIndex) => {
    if (nextStepIndex === 1) {
      this.steps.updateStepElement(nextStepIndex)
      document.querySelector<HTMLElement>(
        '.introjs-tooltipbuttons'
      ).style.display = 'block'
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.connected !== prevProps.connected) {
      this.steps.introJs.nextStep()
    }
  }

  render() {
    const { initialStep, stepsEnabled, steps } = this.state
    const { showTour } = this.props

    return showTour ? (
      <Steps
        enabled={stepsEnabled}
        steps={steps}
        initialStep={initialStep}
        onBeforeChange={this.onBeforeChange}
        onExit={() => this.handleEndTour()}
        options={{
          skipLabel: 'Skip Tour',
          exitOnOverlayClick: false,
        }}
        ref={(steps) => (this.steps = steps)}
      />
    ) : null
  }
}
export default IntroTips
