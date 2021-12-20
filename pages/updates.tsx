import { useState, useEffect } from 'react'
import { PlusCircleIcon } from '@heroicons/react/outline'
import TopBar from '../components/TopBar'
import PageBodyContainer from '../components/PageBodyContainer'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { useTranslation } from 'next-i18next'
import useMangoStore, { UpdateRequest } from '../stores/useMangoStore'
import Button from '../components/Button'
import Input from '../components/Input'

export async function getStaticProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, ['common'])),
      // Will be passed to the page component as props
    },
  }
}

export default function UpdatesPage() {
  const { t } = useTranslation('common')
  const actions = useMangoStore((s) => s.actions)
  // const updates = useMangoStore((s) => s.globalUpdates.updates)
  const [showNewUpdateForm, setShowNewUpdateForm] = useState(null)
  const [
    updateMessage,
    // setUpdateMessage
  ] = useState('')

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
    actions.createUpdate(update)
  }

  return (
    <div className={`bg-th-bkg-1 text-th-fgd-1 transition-all`}>
      <TopBar />
      <PageBodyContainer>
        <div className="flex flex-col sm:flex-row py-4 md:pb-4 md:pt-10">
          <h1 className={`text-th-fgd-1 text-2xl font-semibold`}>
            {t('global-updates')}
          </h1>
          <Button
            className="col-span-1 flex items-center justify-center pt-0 pb-0 h-8 pl-3 pr-3 text-xs"
            disabled={showNewUpdateForm}
            onClick={() => setShowNewUpdateForm(true)}
          >
            <div className="flex items-center">
              <PlusCircleIcon className="h-4 w-4 mr-1.5" />
              {t('new')}
            </div>
          </Button>
        </div>
        {showNewUpdateForm ? (
          <>
            <div className="mb-1 text-th-fgd-1 text-xs">Update Message</div>
            <Input
              type="text"
              className={`border border-th-fgd-4 flex-grow pr-11`}
              value={updateMessage || ''}
              onChange={(e) => setShowNewUpdateForm(e.target.value)}
            />
            <Button
              onClick={() =>
                handleSendUpdate({ message: updateMessage, expiryDate: '' })
              }
            >
              {t('send-update')}
            </Button>
          </>
        ) : (
          <></>
        )}
      </PageBodyContainer>
    </div>
  )
}
