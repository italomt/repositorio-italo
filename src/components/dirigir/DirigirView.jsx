import { useState } from 'react'
import Card from '../ui/Card'
import { Car, Camera, Clock, MapPin, ExternalLink } from 'lucide-react'

// Guia de ZTL e estacionamento das cidades do trecho de carro (Milão → Roma).
// Link do Maps por coordenada, sem querystring: cliente de mensagem corta tudo
// depois do "?" e o link chega quebrado.
const maps = (lat, lng) => `https://www.google.com/maps/search/${lat},${lng}`

const CIDADES = [
  {
    id: 'milao',
    nome: 'Milão',
    bandeira: '🚘',
    zona: 'Área C (pedágio) + Área B (ambiental)',
    horario: 'Área C: seg a sex, 7h30 às 19h30 (quinta até 18h)',
    regra: 'A Área C é o centro dentro da Cerchia dei Bastioni e cobra ~€7,50 por dia. A Área B cobre quase a cidade toda, mas só barra carro antigo: carro de locadora passa.',
    cuidado: 'Saindo pela tangenziale você não cruza a Área C.',
    oficial: 'https://www.comune.milano.it/aree-tematiche/mobilita/area-c',
    parks: [
      { n: 1, nome: 'Garagens perto do hotel (Navigli/Romolo)', obs: 'O hotel fica fora da Área C: dá pra deixar o carro por ali e ir de metrô ao centro', lat: 45.4466, lng: 9.1661 },
    ],
  },
  {
    id: 'bolonha',
    nome: 'Bolonha',
    bandeira: '🍝',
    zona: 'ZTL Centro Storico (sistema Sirio)',
    horario: '7h às 20h, todos os dias',
    regra: 'Tudo dentro do anel dos viali é ZTL. Dirigir nos próprios viali é livre. São 30 câmeras nas entradas e cada passagem vira uma multa.',
    cuidado: 'No GPS, ponha o endereço do estacionamento, nunca "Piazza Maggiore".',
    oficial: 'https://www.comune.bologna.it/servizi-informazioni/sirio-vigile-elettronico-ztl',
    parks: [
      { n: 1, nome: 'Garagem Piazza VIII Agosto', obs: 'Coberta e vigiada · 10 min a pé do centro · a melhor com malas no carro', lat: 44.4996, lng: 11.3487 },
      { n: 2, nome: 'Garagem Autostazione', obs: 'Ao lado da 1, na rodoviária', lat: 44.5029, lng: 11.3472 },
      { n: 3, nome: 'Parcheggio ex Staveco', obs: 'Céu aberto, nos viali · 15 min a pé', lat: 44.4839, lng: 11.3479 },
      { n: 4, nome: 'Parcheggio libero Certosa', obs: 'Grátis sempre · ônibus 14, ~15 min', lat: 44.4925, lng: 11.3169 },
      { n: 5, nome: 'Parco Nord', obs: 'Grátis sempre · do lado da Fiera', lat: 44.5182, lng: 11.3628 },
      { n: 6, nome: 'Tanari', obs: 'Grátis com o bilhete P+BUS de €1,30', lat: 44.5059, lng: 11.3236 },
      { n: 7, nome: 'Prati di Caprara', obs: 'Mesma regra do 6', lat: 44.5084, lng: 11.3143 },
    ],
  },
  {
    id: 'florenca',
    nome: 'Florença',
    bandeira: '🎨',
    zona: 'ZTL setores A, B e O',
    horario: 'Seg a sex 7h30 às 20h · sáb 7h30 às 16h · domingo livre',
    regra: 'Até 4 de outubro ainda vale a ZTL noturna de verão: quinta, sexta e sábado, das 23h às 3h.',
    cuidado: 'O hostel em Campo di Marte fica fora da ZTL. Deixe o carro lá e vá ao centro a pé ou de ônibus.',
    oficial: 'https://www.comune.fi.it/pagina/zona-traffico-limitato/ztl-orari-e-varchi',
    parks: [
      { n: 1, nome: 'Campo di Marte (rua, perto do hostel)', obs: 'Fora da ZTL · vaga azul é paga no parquímetro', lat: 43.7772, lng: 11.2762 },
      { n: 2, nome: 'Parcheggio Beccaria', obs: 'Logo fora da ZTL, aberto 24h · ~€1,70/h', lat: 43.7711, lng: 11.2701 },
      { n: 3, nome: 'Parcheggio Parterre', obs: 'Piazza della Libertà, 24h · ~€2/h, máx €10 no dia', lat: 43.7833, lng: 11.2611 },
      { n: 4, nome: 'Villa Costanza (P&R)', obs: 'Bem fora da cidade, com bonde T1 direto ao centro · o mais barato', lat: 43.7604, lng: 11.1846 },
    ],
  },
  {
    id: 'pisa',
    nome: 'Pisa',
    bandeira: '🗼',
    zona: 'ZTL Centro Storico (setores Norte e Sul)',
    horario: '24 horas por dia, todos os dias',
    regra: 'A ZTL de Pisa não tem janela livre: vale de madrugada também.',
    cuidado: 'A Piazza dei Miracoli fica dentro da zona restrita. Só chegue a pé.',
    oficial: 'https://mobilita.pisamo.it/indice-ztl/',
    parks: [
      { n: 1, nome: 'Parcheggio Via Pietrasantina', obs: 'GRÁTIS · 900 m da torre, ~10 min a pé · tem trenzinho por €1 ida e volta', lat: 43.7311, lng: 10.3893 },
      { n: 2, nome: 'Parcheggio Via Cammeo (SABA)', obs: 'Pago, o mais perto da praça', lat: 43.7226, lng: 10.3893 },
    ],
  },
  {
    id: 'roma',
    nome: 'Roma',
    bandeira: '🏛️',
    zona: 'ZTL Centro Storico + Fascia Verde',
    horario: 'Seg a sex 6h30 às 18h · sáb 14h às 18h · noturna sex e sáb, 23h às 3h',
    regra: 'Além do centro, existem ZTLs de bairro em Trastevere, Testaccio, San Lorenzo e Tridente.',
    cuidado: 'A devolução do carro na Roma Termini (Via Giovanni Giolitti, 34) fica FORA da ZTL. Chegue por Termini e não siga em direção ao centro.',
    oficial: 'https://romamobilita.it/muoversi-a-roma/ztl-in-centro/',
    parks: [
      { n: 1, nome: 'Alamo Roma Termini (devolução)', obs: 'Via Giovanni Giolitti, 34 · loja 7h30 às 20h', lat: 41.9009, lng: 12.5034 },
    ],
  },
]

function CidadeCard({ c }) {
  const [aberto, setAberto] = useState(false)
  return (
    <Card className="overflow-hidden">
      <button onClick={() => setAberto(!aberto)} className="tap-scale w-full flex items-center gap-3 p-4 text-left">
        <span className="text-2xl flex-shrink-0">{c.bandeira}</span>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[16px]">{c.nome}</p>
          <p className="text-[13px] text-muted truncate">{c.zona}</p>
        </div>
        <span className="text-muted text-xl flex-shrink-0">{aberto ? '⌄' : '›'}</span>
      </button>

      {aberto && (
        <div className="px-4 pb-4 space-y-3">
          <div className="bg-fill rounded-ios p-3">
            <p className="text-[12px] text-muted font-semibold uppercase tracking-wide mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Quando pega multa
            </p>
            <p className="text-[14px] font-medium">{c.horario}</p>
            <p className="text-[13px] text-muted mt-2">{c.regra}</p>
          </div>

          <div className="bg-orange/10 rounded-ios p-3">
            <p className="text-[13px] text-text flex gap-2">
              <Camera className="w-4 h-4 text-orange flex-shrink-0 mt-0.5" />
              <span>{c.cuidado}</span>
            </p>
          </div>

          <div>
            <p className="text-[12px] text-muted font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> Onde estacionar
            </p>
            {c.parks.map((p) => (
              <a
                key={p.n}
                href={maps(p.lat, p.lng)}
                target="_blank"
                rel="noreferrer"
                className="tap-scale flex items-start gap-3 py-2.5 border-b border-separator last:border-b-0"
              >
                <span className="w-6 h-6 rounded-full bg-green text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                  {p.n}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-medium">{p.nome}</span>
                  <span className="block text-[13px] text-muted">{p.obs}</span>
                </span>
                <ExternalLink className="w-4 h-4 text-blue flex-shrink-0 mt-1" />
              </a>
            ))}
          </div>

          <a href={c.oficial} target="_blank" rel="noreferrer" className="block text-[13px] text-blue font-medium">
            Mapa oficial da prefeitura →
          </a>
        </div>
      )}
    </Card>
  )
}

export default function DirigirView() {
  return (
    <div className="space-y-4">
      <div className="bg-fill rounded-ios p-4">
        <p className="text-[15px] font-semibold flex items-center gap-2 mb-1">
          <Car className="w-4 h-4 text-blue" /> Carro de Milão até Roma
        </p>
        <p className="text-[13px] text-muted">
          ZTL é zona de tráfego limitado: entrar de carro sem permissão vira multa automática por câmera, cobrada depois pela locadora com taxa em cima.
          Cada cidade tem horário próprio. Toque na cidade para ver a regra e os estacionamentos.
        </p>
      </div>

      {CIDADES.map((c) => <CidadeCard key={c.id} c={c} />)}

      <div className="bg-fill rounded-ios p-4">
        <p className="text-[12px] text-muted font-semibold uppercase tracking-wide mb-2">Vale para qualquer cidade</p>
        <ul className="text-[14px] space-y-1.5 list-disc pl-4">
          <li>No GPS, destino é sempre o <strong>estacionamento</strong>, nunca a praça central.</li>
          <li>Vaga <strong>azul</strong> é paga, <strong>branca</strong> perto do centro costuma ser de morador, <strong>amarela</strong> é reservada.</li>
          <li>Com as malas no carro, prefira garagem coberta.</li>
          <li>A multa chega meses depois, pela locadora, com taxa administrativa.</li>
        </ul>
      </div>
    </div>
  )
}
