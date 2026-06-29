import Modal from '../ui/Modal'
import GastoForm from '../financas/GastoForm'

export default function GastoRapido({ aberto, onClose, onSalvar, destinoId, dataGasto }) {
  return (
    <Modal aberto={aberto} onClose={onClose} titulo="Novo gasto">
      <GastoForm
        onSalvar={async (gasto) => {
          await onSalvar({
            ...gasto,
            destino_id: destinoId,
            data_gasto: dataGasto,
          })
          onClose()
        }}
        onCancelar={onClose}
        compact
      />
    </Modal>
  )
}
