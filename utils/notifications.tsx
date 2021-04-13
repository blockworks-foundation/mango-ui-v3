import useMangoStore from '../stores/useMangoStore'

export function notify(newNotification: {
  type?: string
  message: string
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
