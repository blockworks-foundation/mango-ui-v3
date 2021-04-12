import useMangoStore from '../stores/useMangoStore'

export function notify(newNotification: {
  type?: string
  message: string
  description?: string
  txid?: string
}) {
  const setMangoStore = useMangoStore.getState().set

  setMangoStore((state) => {
    state.notifications = [
      ...state.notifications,
      { type: 'success', ...newNotification },
    ]
  })
}
