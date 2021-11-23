import OpenOrdersTable from '../OpenOrdersTable'
import { useTranslation } from 'next-i18next'

const AccountOrders = () => {
  const { t } = useTranslation('common')

  return (
    <>
      <div className="pb-3.5 text-th-fgd-1 text-lg">{t('open-orders')}</div>
      <OpenOrdersTable />
    </>
  )
}

export default AccountOrders
