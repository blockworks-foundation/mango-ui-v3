import React from 'react'
import { FiveOhFive } from './FiveOhFive'
import * as Sentry from '@sentry/react'

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
