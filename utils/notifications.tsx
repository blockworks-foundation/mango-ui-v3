import useMangoStore from '../stores/useMangoStore'

export function notify(newNotification: {
  type?: 'success' | 'info' | 'error'
  title: string
  description?: string
  txid?: string
}) {
  const setMangoStore = useMangoStore.getState().set
  const notifications = useMangoStore.getState().notifications
  const lastId = useMangoStore.getState().notificationIdCounter
  const newId = lastId + 1

  setMangoStore((state) => {
    state.notificationIdCounter = newId
    state.notifications = [
      ...notifications,
      { id: newId, type: 'success', show: true, ...newNotification },
    ]
  })
}
