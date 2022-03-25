import React from 'react'
import { FiveOhFive } from './FiveOhFive'

class ErrorBoundary extends React.Component<
  any,
  { hasError: boolean; error: any }
> {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error: error }
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    // logErrorToMyService(error, errorInfo)

    if (process.env.NEXT_PUBLIC_ERROR_WEBHOOK_URL) {
      try {
        fetch(process.env.NEXT_PUBLIC_ERROR_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `UI ERROR: ${error} : ${errorInfo?.componentStack}`.slice(
              0,
              1999
            ),
          }),
        })
      } catch (err) {
        console.error('Error posting to notify webhook:', err)
      }
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <FiveOhFive error={this.state.error} />
    }

    return this.props.children
  }
}

export default ErrorBoundary
