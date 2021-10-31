import React, { Component } from 'react'
import { Steps } from 'intro.js-react'

export const SHOW_TOUR_KEY = 'showTour'

interface Props {
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
              <h4>Color Themes</h4>
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
              <h4>Multiple Languages</h4>
              <p>
                English not your preferred language? No problem, change it here.
                More languages coming soon...
              </p>
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
              <h4>Manual Refresh</h4>
              <p>
                Data is refreshed automatically but you can manually refresh it
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
              <h4>Customize Layout</h4>
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
              <h4>Perp Position Details</h4>
              <p>The details of your open perp position.</p>
              <p>
                If you&apos;re unfamiliar with how settling PnL works,{' '}
                <a
                  className="underline"
                  href="https://docs.mango.markets/mango-v3/overview#settle-pnl"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  read up on it
                </a>{' '}
                before you get started.
              </p>
            </div>
          ),
          position: 'left',
          tooltipClass: 'intro-tooltip',
          highlightClass: 'intro-highlight',
          disableInteraction: true,
        },
        {
          element: '#intro-step-7',
          intro: (
            <div>
              <h4>Account Details</h4>
              <p>
                Don&apos;t have a Mango Account yet? One will be created for you
                when you make your first deposit.
              </p>
              <p>
                Understanding account health is important for a fruitful
                experience.{' '}
                <a
                  className="underline"
                  href="https://docs.mango.markets/mango-v3/overview#health"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Read more
                </a>
              </p>
            </div>
          ),
          position: 'left',
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
      const el = document.querySelector<HTMLElement>('.introjs-nextbutton')
      el.style.pointerEvents = 'auto'
      el.style.opacity = '100%'
    }
  }

  componentDidUpdate(prevProps) {
    if (this.props.connected !== prevProps.connected) {
      this.steps.introJs.nextStep()
    }
  }

  render() {
    const { initialStep, stepsEnabled, steps } = this.state

    return (
      <Steps
        enabled={stepsEnabled}
        steps={steps}
        initialStep={initialStep}
        onBeforeChange={this.onBeforeChange}
        onExit={() => this.handleEndTour()}
        options={{
          skipLabel: 'Close',
          exitOnOverlayClick: false,
          showProgress: true,
          showBullets: false,
        }}
        ref={(steps) => (this.steps = steps)}
      />
    )
  }
}
export default IntroTips
