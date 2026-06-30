import FormField from './FormField'
import FormFooter from './FormFooter'
import DeleteSection from './DeleteSection'

export default function TravelForm({ title, onSave, onCancel, saving, disabled, saveLabel = 'Salvar', onDelete, children }) {
  return (
    <div className="space-y-3">
      {children}
      <FormFooter onCancel={onCancel} onSave={onSave} saveLabel={saveLabel} saving={saving} disabled={disabled} />
      {onDelete && <DeleteSection onDelete={onDelete} />}
    </div>
  )
}
