import { useEffect, useState } from 'react'
import { notify } from '../utils/notifications'
import { BellIcon } from '@heroicons/react/outline'
import useMangoStore from '../stores/useMangoStore'
import { IconButton, LinkButton } from './Button'

const Updates = () => {
  const actions = useMangoStore((s) => s.actions)
  const updates = useMangoStore((s) => s.globalUpdates.updates)
  const mangoAccount = useMangoStore((s) => s.selectedMangoAccount.current)
  const [showUpdates, setShowUpdates] = useState(false)

  const newUpdates = updates.filter(
    (u) => !u.hasSeen.includes(mangoAccount?.publicKey.toString())
  )

  const updatesToShow = updates.filter(
    (u) => !u.hasCleared.includes(mangoAccount?.publicKey.toString())
  )

  useEffect(() => {
    actions.loadUpdates()
  }, [])

  const updateHasSeenCount = async (update) => {
    const fetchUrl = `https://mango-alerts-v3.herokuapp.com/update-seen`
    const headers = { 'Content-Type': 'application/json' }

    return fetch(fetchUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(update),
    })
  }

  const updateCleared = (update) => {
    const fetchUrl = `https://mango-alerts-v3.herokuapp.com/clear-updates`
    const headers = { 'Content-Type': 'application/json' }

    return fetch(fetchUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(update),
    })
  }

  const handleShowUpdates = async () => {
    setShowUpdates(!showUpdates)
    if (newUpdates.length > 0) {
      const promises = []
      for (const update of newUpdates) {
        const mangoAccountPk = mangoAccount?.publicKey.toString()
        if (!update.hasSeen.includes(mangoAccountPk)) {
          const newUpdate = {
            ...update,
            hasSeen: [...update.hasSeen, mangoAccountPk],
          }
          promises.push(updateHasSeenCount(newUpdate))
        }
      }
      const result = await Promise.all(promises)
      if (result && result.filter((r) => r.ok).length === newUpdates.length) {
        await actions.loadUpdates()
      } else {
        notify({
          title: 'Something went wrong updating new notification count',
          type: 'error',
        })
      }
    }
  }

  const handleClearUpdates = async (updates) => {
    const promises = []
    for (const update of updates) {
      const mangoAccountPk = mangoAccount?.publicKey.toString()
      if (!update.hasCleared.includes(mangoAccountPk)) {
        const newUpdate = {
          ...update,
          hasCleared: [...update.hasCleared, mangoAccountPk],
        }
        promises.push(updateCleared(newUpdate))
      }
    }
    const result = await Promise.all(promises)
    if (result && result.filter((r) => r.ok).length === updatesToShow.length) {
      await actions.loadUpdates()
    } else {
      notify({
        title: 'Something went wrong clearing notifications',
        type: 'error',
      })
    }
  }

  return (
    <div className="relative">
      {newUpdates.length > 0 ? (
        <div className="absolute -top-2 -right-1 z-20">
          <span className="w-4 h-4 bg-th-red relative inline-flex rounded-full flex items-center justify-center text-xxs">
            {newUpdates.length}
          </span>
        </div>
      ) : null}
      <IconButton onClick={() => handleShowUpdates()}>
        <BellIcon className="w-4 h-4" />
      </IconButton>
      {showUpdates ? (
        <div className="absolute bg-th-bkg-1 mt-4 p-3 outline-none right-0 rounded-md shadow-lg w-64 z-20">
          <div className="space-y-2">
            <div className="border-b border-th-bkg-4 flex items-center justify-between pb-2">
              <h3 className="font-bold text-th-fgd-1 text-base">Updates</h3>
              <LinkButton
                className="text-xs"
                onClick={() => handleClearUpdates(updatesToShow)}
              >
                Clear All
              </LinkButton>
            </div>
            {updatesToShow.length > 0 ? (
              updatesToShow.map((u, index) => (
                <div
                  className="border-b border-th-bkg-4 pb-2 text-th-fgd-1"
                  key={index}
                >
                  {u.message}
                </div>
              ))
            ) : (
              <div className="p-2 text-center text-th-fgd-3">No updates</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default Updates
