import { useParams } from 'react-router-dom'
import CidadeDetailView from '../components/viagem/CidadeDetailView'

export default function CidadeDetail() {
  const { cidadeNome } = useParams()
  return <CidadeDetailView cidadeNome={decodeURIComponent(cidadeNome)} />
}
