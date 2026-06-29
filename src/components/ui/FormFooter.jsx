import Button from './Button'

export default function FormFooter({ onCancel, onSave, saveLabel = 'Salvar', saving = false, disabled = false, variant = 'primary' }) {
  return (
    <div className="flex gap-2 pt-2">
      {onCancel && (
        <Button variant="outline" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
      )}
      <Button className={onCancel ? 'flex-1' : 'w-full'} onClick={onSave} disabled={saving || disabled} variant={variant}>
        {saving ? 'Salvando...' : saveLabel}
      </Button>
    </div>
  )
}
