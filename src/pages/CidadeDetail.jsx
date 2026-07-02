import { useParams } from 'react-router-dom'
import CidadeDetailView from '../components/viagem/CidadeDetailView'

export default function CidadeDetail() {
  const { cidadeId } = useParams()
  return <CidadeDetailView cidadeId={cidadeId} />
}
