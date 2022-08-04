import Modal from './Modal'
import Button from './Button'
import useLocalStorageState from '../hooks/useLocalStorageState'
import { ElementTitle } from './styles'
import Switch from './Switch'
import { useTranslation } from 'next-i18next'

const EditTableColumnsModal = ({
  columns,
  isOpen,
  onClose,
  storageKey,
}: {
  columns: { [key: string]: boolean }
  isOpen: boolean
  onClose?: (x) => void
  storageKey: string
}) => {
  const { t } = useTranslation('common')
  const [tableColumns, setTableColumns] = useLocalStorageState(
    storageKey,
    columns
  )

  const handleToggleColumn = (column) => {
    const newColumns = { ...tableColumns, [column[0]]: !column[1] }
    setTableColumns(newColumns)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <Modal.Header>
        <ElementTitle noMarginBottom>{t('edit-table-columns')}</ElementTitle>
      </Modal.Header>
      <div className="space-y-2">
        {Object.entries(tableColumns).map((entry: any) => (
          <div className="flex items-center justify-between" key={entry[0]}>
            <p className="mb-0">{t(entry[0])}</p>
            <Switch
              checked={entry[1]}
              onChange={() => handleToggleColumn(entry)}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <Button className="mt-6" onClick={onClose}>
          {t('save')}
        </Button>
      </div>
    </Modal>
  )
}

export default EditTableColumnsModal
