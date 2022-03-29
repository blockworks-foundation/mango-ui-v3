import React from 'react'
import { FiveOhFive } from './FiveOhFive'
import * as Sentry from '@sentry/react'

// class ErrorBoundary extends React.Component<
//   any,
//   { hasError: boolean; error: any }
// > {
//   constructor(props) {
//     super(props)
//     this.state = { hasError: false, error: null }
//   }

//   static getDerivedStateFromError(error) {
//     // Update state so the next render will show the fallback UI.
//     return { hasError: true, error: error }
//   }

//   componentDidCatch(error, errorInfo) {
//     // You can also log the error to an error reporting service
//     // logErrorToMyService(error, errorInfo)

//     if (process.env.NEXT_PUBLIC_ERROR_WEBHOOK_URL) {
//       try {
//         fetch(process.env.NEXT_PUBLIC_ERROR_WEBHOOK_URL, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             content: `UI ERROR: ${error} : ${errorInfo?.componentStack}`.slice(
//               0,
//               1999
//             ),
//           }),
//         })
//       } catch (err) {
//         console.error('Error posting to notify webhook:', err)
//       }
//     }
//   }

//   render() {
//     let children = this.props.children
//     if (this.state.hasError) {
//       // You can render any custom fallback UI
//       children = <FiveOhFive error={this.state.error} />
//     }

//     return (
//       <Sentry.ErrorBoundary fallback={(error, componentStack)}>
//         {children}
//       </Sentry.ErrorBoundary>
//     )
//   }
// }

const ErrorBoundary: React.FC<any> = (props) => {
  const postError = (error, componentStack) => {
    if (process.env.NEXT_PUBLIC_ERROR_WEBHOOK_URL) {
      try {
        fetch(process.env.NEXT_PUBLIC_ERROR_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `UI ERROR: ${error} : ${componentStack}`.slice(0, 1999),
          }),
        })
      } catch (err) {
        console.error('Error posting to notify webhook:', err)
      }
    }
  }

  return (
    <Sentry.ErrorBoundary
      fallback={({ error, componentStack }) => {
        postError(error, componentStack)

        return <FiveOhFive error={error} />
      }}
    >
      {props.children}
    </Sentry.ErrorBoundary>
  )
}

export default ErrorBoundary
