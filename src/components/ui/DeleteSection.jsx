import { useState } from 'react'
import Button from './Button'

export default function DeleteSection({ onDelete, itemName, label }) {
  const [confirmando, setConfirmando] = useState(false)

  if (!confirmando) {
    return (
      <button
        onClick={() => setConfirmando(true)}
        className="tap-scale w-full text-red text-[15px] font-semibold py-2"
      >
        {label || `Excluir ${itemName || 'item'}`}
      </button>
    )
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" className="flex-1" onClick={() => setConfirmando(false)}>
        Cancelar
      </Button>
      <Button variant="danger" className="flex-1" onClick={() => { onDelete(); setConfirmando(false) }}>
        Confirmar exclusão
      </Button>
    </div>
  )
}
