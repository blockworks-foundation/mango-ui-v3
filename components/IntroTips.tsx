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
          position: 'left',
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
              <h4>Multilingual?</h4>
              <p>Choose another language here. More coming soon...</p>
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
              <h4>Manual Data Refresh</h4>
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
              <p>
                Perp positions accrue Unsettled PnL as price changes. This can
                be settled by anyone at anytime. Settling PnL adds or removes
                that amount from your USDC balance.{' '}
                <a
                  className="underline"
                  href="https://docs.mango.markets/mango-v3/perp-faq#what-is-my-unsettled-pnl"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Read More
                </a>
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
                When you make your first deposit we&apos;ll set you up with a
                Mango Account. You&apos;ll need at least 0.0035 SOL in your
                wallet to cover the rent/cost of creating the account.
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
              <h4>Collateral Available</h4>
              <p>
                This reflects the collateral value in your account that can be
                used to take on leverage. Assets carry different collateral
                weights depending on the risk they present to the platform.
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
              <h4>Account Health</h4>
              <p>
                To avoid liqudation you must keep your account health above 0%.
                To increase the health of your account, reduce borrows or
                deposit funds.{' '}
                <a
                  className="underline"
                  href="https://docs.mango.markets/mango-v3/overview#health"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Read More
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
          doneLabel: 'Get Started',
          overlayOpacity: 0.6,
        }}
        ref={(steps) => (this.steps = steps)}
      />
    )
  }
}
export default IntroTips
