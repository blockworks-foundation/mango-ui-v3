import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { EyeIcon, PlusCircleIcon, TrashIcon } from '@heroicons/react/outline'
import TopBar from '../components/TopBar'
import PageBodyContainer from '../components/PageBodyContainer'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import useMangoStore, { UpdateRequest } from '../stores/useMangoStore'
import Button, { LinkButton } from '../components/Button'
import Input from '../components/Input'
import ButtonGroup from '../components/ButtonGroup'
import Modal from '../components/Modal'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      // Will be passed to the page component as props
    },
  }
}

const expiryOffsetOptions = ['1', '3', '7', '30', '∞']

export default function UpdatesPage() {
  const actions = useMangoStore((s) => s.actions)
  const updates = useMangoStore((s) => s.globalUpdates.updates)
  const [showNewUpdateForm, setShowNewUpdateForm] = useState(null)
  const [updateMessage, setUpdateMessage] = useState('')
  const [password, setPassword] = useState('')
  const [expiryDate, setExpiryDate] = useState<any>(
    new Date(new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).getTime()).getTime()
  )
  const [expiryOffset, setExpiryOffset] = useState('1')
  const [deleteUpdateId, setDeleteUpdateId] = useState('')

  useEffect(() => {
    actions.loadUpdates()
  }, [])

  useEffect(() => {
    // @ts-ignore
    if (window.solana) {
      // @ts-ignore
      window.solana.connect({ onlyIfTrusted: true })
    }
  }, [])

  const handleSendUpdate = async (update: UpdateRequest) => {
    const success: any = await actions.createUpdate(update)
    if (success) {
      setShowNewUpdateForm(false)
      setUpdateMessage('')
      setPassword('')
    }
  }

  const handleSetExpiry = (offset) => {
    let days = offset
    if (offset === '∞') {
      days = 9999
    }
    setExpiryOffset(offset)
    setExpiryDate(
      new Date(
        new Date(Date.now() + days * 24 * 60 * 60 * 1000).getTime()
      ).getTime()
    )
  }

  const handleConfirmDelete = async (id: string, password: string) => {
    const req = { id, password }
    const success: any = await actions.deleteUpdate(req)
    if (success) {
      setDeleteUpdateId('')
    }
  }

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 md:pb-4 md:pt-10">
          <h1 className={`text-th-fgd-1 text-2xl font-semibold`}>
            Global Updates
          </h1>
          <Button
            className="col-span-1 flex items-center justify-center pt-0 pb-0 h-8 pl-3 pr-3 text-xs"
            disabled={showNewUpdateForm}
            onClick={() => setShowNewUpdateForm(true)}
          >
            <div className="flex items-center">
              <PlusCircleIcon className="h-4 w-4 mr-1.5" />
              New Update
            </div>
          </Button>
        </div>
        <div className="bg-th-bkg-2 p-4 sm:p-6 rounded-lg">
          {showNewUpdateForm ? (
            <div className="max-w-full md:max-w-screen-md">
              <h2 className={`mb-4 text-th-fgd-1 text-base font-semibold`}>
                New Update
              </h2>
              <div className="mb-1 text-th-fgd-1 text-xs">Update Message</div>
              <Input
                type="text"
                className={`border border-th-fgd-4 flex-grow mb-4 pr-11`}
                value={updateMessage || ''}
                onChange={(e) => setUpdateMessage(e.target.value)}
              />
              <div className="mb-1 text-th-fgd-1 text-xs">
                Delete message after (days)
              </div>
              <ButtonGroup
                activeValue={expiryOffset}
                onChange={(v) => handleSetExpiry(v)}
                values={expiryOffsetOptions}
              />

              <div className="mb-4 mt-2 text-th-fgd-4 text-xs">
                {`Update will be deleted automatically on ${dayjs(
                  expiryDate
                ).format('D MMM YYYY, h:mma')}`}
              </div>
              <div className="bg-th-bkg-3 mt-4 p-4 rounded-md text-th-fgd-3">
                <div className="font-bold mb-1 text-base text-th-fgd-1">
                  Message Preview
                </div>
                {updateMessage.length > 0
                  ? updateMessage
                  : 'Proofread your update before posting.'}
              </div>
              <div className="mb-1 mt-4 text-th-fgd-1 text-xs">Password</div>
              <Input
                type="password"
                className={`border border-th-fgd-4 flex-grow pr-11`}
                value={password || ''}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="flex items-center mt-6">
                <Button
                  disabled={updateMessage.length === 0 || password.length === 0}
                  onClick={() =>
                    handleSendUpdate({
                      message: updateMessage,
                      expiryDate: expiryDate,
                      password: password,
                    })
                  }
                >
                  Send Update
                </Button>
                <LinkButton
                  className="ml-4"
                  onClick={() => setShowNewUpdateForm(false)}
                >
                  Cancel
                </LinkButton>
              </div>
            </div>
          ) : (
            <>
              <h2 className={`mb-4 text-th-fgd-1 text-base font-semibold`}>
                Active Updates
              </h2>
              {updates.length > 0 ? (
                <div className="space-y-3">
                  {updates.map((u: any, index) => (
                    <div
                      className="bg-th-bkg-3 flex items-center justify-between p-4 rounded-md"
                      key={index}
                    >
                      <div>
                        <div className="mb-2">{u.message}</div>
                        <div className="flex space-x-3">
                          <div className="text-th-fgd-3 text-xs">
                            Created:{' '}
                            {dayjs(u.date).format('DD MMM YYYY, h:mma')}
                          </div>
                          <div className="text-th-fgd-3 text-xs">
                            Expires:{' '}
                            {dayjs(u.expiryDate).format('DD MMM YYYY, h:mma')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <div className="flex items-center mr-4 text-th-fgd-3">
                          <EyeIcon className="h-4 mr-1 text-th-fgd-4 w-4" />
                          {u.hasSeen.length}
                        </div>
                        <Button
                          className="col-span-1 flex items-center justify-center pt-0 pb-0 h-8 pl-3 pr-3 text-xs"
                          onClick={() => setDeleteUpdateId(u._id)}
                        >
                          <div className="flex items-center">
                            <TrashIcon className="h-4 w-4 mr-1.5" />
                            Delete
                          </div>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-th-bkg-3 p-4 rounded-md text-center text-th-fgd-3">
                  No active updates
                </div>
              )}
              {deleteUpdateId ? (
                <Modal
                  isOpen={deleteUpdateId}
                  onClose={() => setDeleteUpdateId('')}
                >
                  <h2 className="font-bold text-lg text-th-fgd-1">
                    Enter Password
                  </h2>
                  <div className="mb-1 mt-4 text-th-fgd-1 text-xs">
                    Password
                  </div>
                  <Input
                    type="password"
                    className={`border border-th-fgd-4 flex-grow pr-11`}
                    value={password || ''}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Button
                    className="mt-6"
                    disabled={password.length === 0}
                    onClick={() =>
                      handleConfirmDelete(deleteUpdateId, password)
                    }
                  >
                    Confirm Delete
                  </Button>
                </Modal>
              ) : null}
            </>
          )}
        </div>
      </PageBodyContainer>
    </div>
  )
}
