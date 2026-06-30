import FormFooter from './FormFooter'
import DeleteSection from './DeleteSection'

export default function TravelFooterActions({ onSave, onCancel, saving, disabled, saveLabel = 'Salvar', onDelete, deleteLabel }) {
  return (
    <>
      <FormFooter onCancel={onCancel} onSave={onSave} saveLabel={saveLabel} saving={saving} disabled={disabled} />
      {onDelete && <DeleteSection onDelete={onDelete} itemName={deleteLabel} />}
    </>
  )
}
