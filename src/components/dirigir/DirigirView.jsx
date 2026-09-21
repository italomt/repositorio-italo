import { useEffect, useRef, useState } from 'react'
import Card from '../ui/Card'
import { carregarLeaflet } from '../../lib/leaflet'
import { Car, Camera, Clock, MapPin, ExternalLink, Fuel } from 'lucide-react'

// Guia de ZTL, estacionamento e combustível do trecho de carro (Milão → Roma).
// Link do Maps pelo nome + endereço, tudo no caminho da URL: sem querystring,
// porque cliente de mensagem corta o link depois do "?" e ele chega quebrado.
const maps = (nome, endereco) =>
  `https://www.google.com/maps/search/${encodeURIComponent(`${nome}, ${endereco}`).replace(/%20/g, '+')}`

const P = (n, nome, end, obs, lat, lng) => ({ n, nome, end, obs, lat, lng })

const CIDADES = [
  {
    id: 'milao',
    nome: 'Milão',
    emoji: '🚘',
    zona: 'Área C (pedágio) e Área B (ambiental)',
    horario: 'Área C: seg a sex, 7h30 às 19h30 (quinta até 18h)',
    regra: 'A Área C é o centro dentro da Cerchia dei Bastioni e cobra ~€7,50 por dia. A Área B cobre quase a cidade toda, mas só barra carro antigo: carro de locadora passa.',
    cuidado: 'Saindo pela tangenziale você não cruza a Área C.',
    oficial: 'https://www.comune.milano.it/aree-tematiche/mobilita/area-c',
    parks: [
      P(1, 'Parking ATM Famagosta', 'Via Giovanni Palatucci, Milano', 'Park and ride barato, metrô M2 direto ao centro', 45.4356, 9.1694),
      P(2, 'Parcheggio ATM Romolo', 'Largo Tazio Nuvolari, Milano', 'M2 Romolo, a parada do hotel de vocês', 45.4418, 9.1680),
    ],
  },
  {
    id: 'bolonha',
    nome: 'Bolonha',
    emoji: '🍝',
    zona: 'ZTL Centro Storico (sistema Sirio)',
    horario: '7h às 20h, todos os dias',
    regra: 'Tudo dentro do anel dos viali é ZTL. Dirigir nos próprios viali é livre. São 30 câmeras nas entradas e cada passagem vira uma multa.',
    cuidado: 'No GPS, destino é o estacionamento, nunca a Piazza Maggiore.',
    oficial: 'https://www.comune.bologna.it/servizi-informazioni/sirio-vigile-elettronico-ztl',
    parks: [
      P(1, 'Parcheggio Piazza VIII Agosto', "Piazza dell'Otto Agosto 33, Bologna", 'Coberta e vigiada, 10 min a pé do centro. A melhor com malas no carro', 44.4996, 11.3487),
      P(2, 'Parcheggio Autostazione', 'Piazza XX Settembre, Bologna', 'Ao lado da 1, na rodoviária', 44.5029, 11.3472),
      P(3, 'Parcheggio ex Staveco', 'Viale Enrico Panzacchi 10, Bologna', 'Céu aberto, nos viali, 15 min a pé', 44.4839, 11.3479),
      P(4, 'Parcheggio libero Certosa', 'Largo Vittime dei Lager Nazisti, Bologna', 'Grátis sempre, ônibus 14', 44.4925, 11.3169),
      P(5, 'Parco Nord', 'Via Stalingrado 79, Bologna', 'Grátis sempre, do lado da Fiera', 44.5182, 11.3628),
      P(6, 'Tanari Parking', 'Via Luigi Tanari 17, Bologna', 'Grátis com o bilhete P+BUS de €1,30', 44.5059, 11.3236),
      P(7, 'Prati di Caprara', 'Via Prati di Caprara, Bologna', 'Mesma regra do 6', 44.5084, 11.3143),
    ],
  },
  {
    id: 'florenca',
    nome: 'Florença',
    emoji: '🎨',
    zona: 'ZTL setores A, B e O',
    horario: 'Seg a sex 7h30 às 20h · sáb 7h30 às 16h · domingo livre',
    regra: 'Até 4 de outubro vale também a ZTL noturna de verão: quinta, sexta e sábado das 23h às 3h.',
    cuidado: 'O hostel em Campo di Marte fica fora da ZTL. Deixem o carro lá.',
    oficial: 'https://www.comune.fi.it/pagina/zona-traffico-limitato/ztl-orari-e-varchi',
    parks: [
      P(1, 'Campo Marte Fs', 'Via Mannelli, Firenze', 'Rua perto do hostel, fora da ZTL. Vaga azul é paga', 43.7769, 11.2767),
      P(2, 'Parking Beccaria', 'Viale Giovanni Amendola 7, Firenze', 'Logo fora da ZTL, 24h, ~€1,70/h', 43.7697, 11.2708),
      P(3, 'Parcheggio Parterre', 'Via del Ponte Rosso 4, Firenze', 'Piazza della Libertà, 24h, máx €10 no dia', 43.7855, 11.2624),
      P(4, 'Parcheggio Villa Costanza', 'Scandicci, Firenze', 'Fora da cidade, bonde T1 direto ao centro. O mais barato', 43.7546, 11.1726),
    ],
  },
  {
    id: 'pisa',
    nome: 'Pisa',
    emoji: '🗼',
    zona: 'ZTL Centro Storico, setores Norte e Sul',
    horario: '24 horas por dia, todos os dias',
    regra: 'A ZTL de Pisa não tem janela livre: vale de madrugada também. A Piazza dei Miracoli está dentro dela.',
    cuidado: 'Não existe polígono público de Pisa: a regra segura é não cruzar as muralhas de carro.',
    oficial: 'https://mobilita.pisamo.it/indice-ztl/',
    parks: [
      P(1, 'Parcheggio Via Pietrasantina', 'Via Pietrasantina, Pisa', 'GRÁTIS, 900 m da torre. Trenzinho por €1 ida e volta', 43.7292, 10.3909),
      P(2, 'Parcheggio PisaMo Via Cammeo', 'Via Cammeo Carlo Salomone 51, Pisa', 'Pago, o mais perto da praça', 43.7238, 10.3908),
    ],
  },
  {
    id: 'roma',
    nome: 'Roma',
    emoji: '🏛️',
    zona: 'ZTL Centro Storico, Tridente e Fascia Verde',
    horario: 'Seg a sex 6h30 às 18h · sáb 14h às 18h · noturna sex e sáb, 23h às 3h',
    regra: 'Fora o centro, existem ZTLs de bairro em Trastevere, Testaccio, San Lorenzo e Tridente.',
    cuidado: 'A devolução do carro fica FORA da ZTL. Chegue por Termini e não siga em direção ao centro.',
    oficial: 'https://romamobilita.it/muoversi-a-roma/ztl-in-centro/',
    parks: [
      P(1, 'Locauto Rent Roma Termini', 'Via Marsala 53, Roma', 'Devolução do carro, 1º andar. Garagem fechada de 1h às 5h', 41.9006, 12.5051),
    ],
  },
]

function MapaZTL({ cidade, dados }) {
  const ref = useRef(null)
  const mapa = useRef(null)
  const camada = useRef(null)

  useEffect(() => {
    let vivo = true

    carregarLeaflet()
      .then((L) => {
        if (!vivo || !ref.current) return

        if (!mapa.current) {
          mapa.current = L.map(ref.current, { scrollWheelZoom: false }).setView([cidade.parks[0].lat, cidade.parks[0].lng], 13)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap',
          }).addTo(mapa.current)
          camada.current = L.layerGroup().addTo(mapa.current)
        }

        const map = mapa.current
        camada.current.clearLayers()
        const areas = []
        const d = dados?.[cidade.id] || {}

        if (d.ztl) {
          const g = L.geoJSON(d.ztl, { style: { color: '#c0392b', weight: 2, fillColor: '#c0392b', fillOpacity: 0.28 } }).addTo(camada.current)
          g.eachLayer((l) => l.bindTooltip(l.feature?.properties?.nome || 'Zona restrita'))
          areas.push(g.getBounds())
        }
        if (d.extra) {
          const g = L.geoJSON(d.extra, { style: { color: '#7a288c', weight: 2, fillColor: '#7a288c', fillOpacity: 0.4 } }).addTo(camada.current)
          areas.push(g.getBounds())
        }
        if (d.cams) {
          d.cams.features.forEach((f) => {
            const c = f.geometry.coordinates
            L.circleMarker([c[1], c[0]], { radius: 5, color: '#fff', weight: 1.5, fillColor: '#c0392b', fillOpacity: 1 })
              .addTo(camada.current)
              .bindPopup(`<b>Câmera: ${f.properties.nome || ''}</b><br>${f.properties.desc || ''}`)
          })
        }

        const pinos = cidade.parks.map((p) =>
          L.marker([p.lat, p.lng], {
            icon: L.divIcon({
              className: '',
              html: `<div style="background:#1e7a46;color:#fff;border:2px solid #fff;border-radius:50%;width:26px;height:26px;font:700 14px/22px -apple-system,sans-serif;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,.4)">${p.n}</div>`,
              iconSize: [26, 26],
              iconAnchor: [13, 13],
            }),
          })
            .addTo(camada.current)
            .bindPopup(`<b>${p.n}. ${p.nome}</b><br>${p.obs}<br><a href="${maps(p.nome, p.end)}" target="_blank">Abrir no Google Maps</a>`),
        )

        let b = L.featureGroup(pinos).getBounds()
        areas.forEach((a) => { b = b.extend(a) })
        map.invalidateSize()
        map.fitBounds(b.pad(0.12))
      })
      .catch(() => {})

    return () => { vivo = false }
  }, [cidade, dados])

  return <div ref={ref} className="w-full h-56 rounded-ios bg-fill" />
}

export default function DirigirView() {
  const [ativa, setAtiva] = useState(0)
  const [dados, setDados] = useState(null)
  const cidade = CIDADES[ativa]

  useEffect(() => {
    let vivo = true
    fetch('/ztl-italia.json')
      .then((r) => r.json())
      .then((d) => { if (vivo) setDados(d) })
      .catch(() => {})
    return () => { vivo = false }
  }, [])

  return (
    <div className="space-y-4">
      <div className="bg-fill rounded-ios p-4">
        <p className="text-[15px] font-semibold flex items-center gap-2 mb-1">
          <Car className="w-4 h-4 text-blue" /> Carro de Milão até Roma
        </p>
        <p className="text-[13px] text-muted">
          ZTL é zona de tráfego limitado: entrar de carro sem permissão vira multa automática por câmera.
          Em vermelho, onde não entrar. Em verde, onde estacionar.
        </p>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {CIDADES.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setAtiva(i)}
            className={`tap-scale flex-shrink-0 px-3.5 py-1.5 rounded-full text-[14px] font-semibold ${i === ativa ? 'bg-blue text-white' : 'bg-fill text-text'}`}
          >
            {c.emoji} {c.nome}
          </button>
        ))}
      </div>

      <MapaZTL cidade={cidade} dados={dados} />

      <div className="bg-orange/10 rounded-ios p-3">
        <p className="text-[12px] text-muted font-semibold uppercase tracking-wide mb-1 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" /> Quando pega multa
        </p>
        <p className="text-[14px] font-medium">{cidade.horario}</p>
        <p className="text-[13px] text-muted mt-1">{cidade.zona}</p>
      </div>

      <Card className="p-4">
        <p className="text-[12px] text-muted font-semibold uppercase tracking-wide mb-2">Regra</p>
        <p className="text-[14px]">{cidade.regra}</p>
        <p className="text-[13px] text-muted mt-2 flex gap-2">
          <Camera className="w-4 h-4 text-orange flex-shrink-0 mt-0.5" />
          <span>{cidade.cuidado}</span>
        </p>
        <a href={cidade.oficial} target="_blank" rel="noreferrer" className="block text-[13px] text-blue font-medium mt-3">
          Mapa oficial da prefeitura →
        </a>
      </Card>

      <Card className="p-4">
        <p className="text-[12px] text-muted font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5" /> Onde estacionar
        </p>
        {cidade.parks.map((p) => (
          <a
            key={p.n}
            href={maps(p.nome, p.end)}
            target="_blank"
            rel="noreferrer"
            className="tap-scale flex items-start gap-3 py-2.5 border-b border-separator last:border-b-0"
          >
            <span className="w-6 h-6 rounded-full bg-green text-white text-[12px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
              {p.n}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-medium">{p.nome}</span>
              <span className="block text-[12px] text-muted">{p.end}</span>
              <span className="block text-[13px] text-muted">{p.obs}</span>
            </span>
            <ExternalLink className="w-4 h-4 text-blue flex-shrink-0 mt-1" />
          </a>
        ))}
      </Card>

      <Card className="p-4">
        <p className="text-[12px] text-muted font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Fuel className="w-3.5 h-3.5" /> Abastecer na Itália
        </p>
        <ul className="text-[14px] space-y-1.5 list-disc pl-4">
          <li>O carro é <strong>diesel</strong>: bomba <strong>Gasolio</strong>, bico preto. "Benzina" é gasolina e queima o motor.</li>
          <li><strong>Fai da te</strong> é self-service e é o normal. <strong>Servito</strong> tem frentista e custa uns 20 a 30 centavos a mais por litro.</li>
          <li>No self-service, pague primeiro: insira o cartão ou a nota na máquina da ilha, escolha o número da bomba e depois abasteça.</li>
          <li>Posto de estrada (Autogrill, Eni, Q8) é mais caro. Fora da autoestrada sai bem mais barato.</li>
          <li>Muitos postos fecham na hora do almoço e à noite, mas as máquinas automáticas seguem funcionando.</li>
        </ul>

        <p className="text-[12px] text-muted font-semibold uppercase tracking-wide mt-4 mb-2">Quanto encher na devolução</p>
        <ul className="text-[14px] space-y-1.5 list-disc pl-4">
          <li>Não precisa contar litro: <strong>cheio é até a bomba desarmar sozinha</strong>. A locadora confere o ponteiro no F.</li>
          <li>Abasteça <strong>nos últimos 20 a 30 km antes de Roma</strong>. Enchendo muito longe, o ponteiro sai do F e eles cobram a diferença.</li>
          <li>Peça o <strong>scontrino</strong> e guarde: tem data, hora e litros, e é a sua prova.</li>
          <li>Na última parada, pague <strong>com cartão na bomba</strong> ou num posto com frentista. Dinheiro na máquina vira crédito em papel só daquele posto.</li>
          <li>Conta do trajeto: ~900 km no total, tanque de ~45 litros, uns 18 a 20 km/l na estrada. Dá cerca de <strong>50 litros e €85 a €95</strong> no total.</li>
          <li>Plano: <strong>tanque cheio ao sair de Pisa</strong>, que é mais barato fora da autoestrada, e um <strong>complemento pequeno perto de Roma</strong> pra fechar no F.</li>
        </ul>
      </Card>

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
