import useMangoStore from '../stores/useMangoStore'

export type Notification = {
  type: 'success' | 'info' | 'error' | 'confirm'
  title: string
  description?: null | string
  txid?: string
  show: boolean
  id: number
}

export function notify(newNotification: {
  type?: 'success' | 'info' | 'error' | 'confirm'
  title: string
  description?: string
  txid?: string
}) {
  const setMangoStore = useMangoStore.getState().set
  const notifications = useMangoStore.getState().notifications
  const lastId = useMangoStore.getState().notificationIdCounter
  const newId = lastId + 1

  const newNotif: Notification = {
    id: newId,
    type: 'success',
    show: true,
    description: null,
    ...newNotification,
  }

  setMangoStore((state) => {
    state.notificationIdCounter = newId
    state.notifications = [...notifications, newNotif]
  })
}
