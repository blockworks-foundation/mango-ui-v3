import useMangoStore from '../stores/useMangoStore'

export function notify(newNotification: {
  type?: 'success' | 'info' | 'error'
  title: string
  description?: string
  txid?: string
}) {
  const setMangoStore = useMangoStore.getState().set
  const notifications = useMangoStore.getState().notifications

  setMangoStore((state) => {
    state.notifications = [
      ...notifications,
      { type: 'success', ...newNotification },
    ]
  })
}
