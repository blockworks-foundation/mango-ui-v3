import React, { useCallback } from 'react'
import { FiveOhFive } from './FiveOhFive'
import * as Sentry from '@sentry/react'
import { useRouter } from 'next/router'

const ErrorBoundary: React.FC<any> = (props) => {
  const { asPath } = useRouter()

  const postError = useCallback(
    (error, componentStack) => {
      if (process.env.NEXT_PUBLIC_ERROR_WEBHOOK_URL) {
        try {
          fetch(process.env.NEXT_PUBLIC_ERROR_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content:
                `UI ERROR: (${asPath}) ${error} : ${componentStack}`.slice(
                  0,
                  1999
                ),
            }),
          })
        } catch (err) {
          console.error('Error posting to notify webhook:', err)
        }
      }
    },
    [asPath]
  )

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
