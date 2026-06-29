import { useParams } from 'react-router-dom'
import DayDetailView from '../components/viagem/DayDetailView'

export default function DayDetail() {
  const { destinoId } = useParams()
  return <DayDetailView destinoId={destinoId} showHeader />
}
