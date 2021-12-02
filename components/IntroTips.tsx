import React, { Component } from 'react'
import { Steps } from 'intro.js-react'
import { withTranslation } from 'react-i18next'

export const SHOW_TOUR_KEY = 'showTour'

interface Props {
  connected: boolean
  t: any
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
          element: '#connect-wallet-tip',
          intro: (
            <div>
              <h4>{this.props.t('connect-wallet-tip-title')}</h4>
              <p>{this.props.t('connect-wallet-tip-desc')}</p>
            </div>
          ),
          position: 'left',
          tooltipClass: 'intro-tooltip',
          highlightClass: 'intro-highlight',
        },
        {
          element: '#profile-menu-tip',
          intro: (
            <div>
              <h4>{this.props.t('profile-menu-tip-title')}</h4>
              <p>{this.props.t('profile-menu-tip-desc')}</p>
            </div>
          ),
          tooltipClass: 'intro-tooltip',
          highlightClass: 'intro-highlight',
          disableInteraction: true,
        },
        {
          element: '#themes-tip',
          intro: (
            <div>
              <h4>{this.props.t('themes-tip-title')}</h4>
              <p>{this.props.t('themes-tip-desc')}</p>
            </div>
          ),
          tooltipClass: 'intro-tooltip',
          highlightClass: 'intro-highlight',
          disableInteraction: true,
        },
        {
          element: '#languages-tip',
          intro: (
            <div>
              <h4>{this.props.t('languages-tip-title')}</h4>
              <p>{this.props.t('languages-tip-desc')}</p>
            </div>
          ),
          tooltipClass: 'intro-tooltip',
          highlightClass: 'intro-highlight',
          disableInteraction: true,
        },
        {
          element: '#data-refresh-tip',
          intro: (
            <div>
              <h4>{this.props.t('data-refresh-tip-title')}</h4>
              <p>{this.props.t('data-refresh-tip-desc')}</p>
            </div>
          ),
          tooltipClass: 'intro-tooltip',
          highlightClass: 'intro-highlight',
          disableInteraction: true,
        },
        {
          element: '#layout-tip',
          intro: (
            <div>
              <h4>{this.props.t('layout-tip-title')}</h4>
              <p>{this.props.t('layout-tip-desc')}</p>
            </div>
          ),
          tooltipClass: 'intro-tooltip',
          highlightClass: 'intro-highlight',
          disableInteraction: true,
        },
        {
          element: '#perp-positions-tip',
          intro: (
            <div>
              <h4>{this.props.t('perp-positions-tip-title')}</h4>
              <p>
                {this.props.t('perp-positions-tip-desc')}{' '}
                <a
                  className="underline"
                  href="https://docs.mango.markets/mango-v3/perp-faq#what-is-my-unsettled-pnl"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {this.props.t('read-more')}
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
          element: '#account-details-tip',
          intro: (
            <div>
              <h4>{this.props.t('account-details-tip-title')}</h4>
              <p>{this.props.t('account-details-tip-desc')}</p>
            </div>
          ),
          position: 'left',
          tooltipClass: 'intro-tooltip',
          highlightClass: 'intro-highlight',
          disableInteraction: true,
        },
        {
          element: '#account-details-tip',
          intro: (
            <div>
              <h4>{this.props.t('collateral-available-tip-title')}</h4>
              <p>
                {this.props.t('collateral-available-tip-desc')}{' '}
                <a
                  className="underline"
                  href="https://docs.mango.markets/mango-v3/token-specs"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {this.props.t('read-more')}
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
          element: '#account-details-tip',
          intro: (
            <div>
              <h4>{this.props.t('account-health-tip-title')}</h4>
              <p>
                {this.props.t('account-health-tip-desc')}{' '}
                <a
                  className="underline"
                  href="https://docs.mango.markets/mango-v3/overview#health"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  {this.props.t('read-more')}
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
          doneLabel: this.props.t('get-started'),
          exitOnOverlayClick: false,
          nextLabel: this.props.t('next'),
          overlayOpacity: 0.6,
          scrollToElement: true,
          showBullets: false,
          showProgress: true,
          skipLabel: this.props.t('close'),
        }}
        ref={(steps) => (this.steps = steps)}
      />
    )
  }
}
export default withTranslation()(IntroTips)
