import { useEffect, useRef, useState } from 'react'
import { carregarGoogleMaps, bandeiraDoPais } from '../../lib/maps'
import { AlertTriangle } from 'lucide-react'

// Input de cidade com autocomplete do Google Places (API nova, AutocompleteSuggestion)
// — ao escolher, preenche automaticamente o país e a bandeira corretos.
export default function CidadeAutocomplete({ value, onChange, onSelecionarLugar, placeholder }) {
  const [sugestoes, setSugestoes] = useState([])
  const [erro, setErro] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const sessionTokenRef = useRef(null)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    function fecharFora(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setSugestoes([])
    }
    document.addEventListener('mousedown', fecharFora)
    return () => document.removeEventListener('mousedown', fecharFora)
  }, [])

  function handleChange(texto) {
    onChange(texto)
    setErro(null)
    clearTimeout(debounceRef.current)

    if (!texto || texto.trim().length < 2) {
      setSugestoes([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      try {
        const maps = await carregarGoogleMaps()
        const { AutocompleteSessionToken, AutocompleteSuggestion } = await maps.importLibrary('places')

        if (!sessionTokenRef.current) sessionTokenRef.current = new AutocompleteSessionToken()

        const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: texto,
          includedPrimaryTypes: ['locality'],
          sessionToken: sessionTokenRef.current,
        })
        setSugestoes(suggestions ?? [])
      } catch (e) {
        setErro('Não foi possível buscar cidades agora.')
        setSugestoes([])
      } finally {
        setBuscando(false)
      }
    }, 300)
  }

  async function handleSelecionar(suggestion) {
    const place = suggestion.placePrediction.toPlace()
    await place.fetchFields({ fields: ['addressComponents', 'displayName', 'location'] })

    const componentes = place.addressComponents ?? []
    const cidade =
      componentes.find((c) => c.types.includes('locality'))?.longText ??
      componentes.find((c) => c.types.includes('postal_town'))?.longText ??
      place.displayName ??
      ''
    const paisComponente = componentes.find((c) => c.types.includes('country'))
    const pais = paisComponente?.longText ?? ''
    const codigoPais = paisComponente?.shortText ?? ''
    const lat = place.location?.lat?.() ?? null
    const lng = place.location?.lng?.() ?? null

    onChange(cidade)
    onSelecionarLugar({ cidade, pais, flagEmoji: bandeiraDoPais(codigoPais), latitude: lat, longitude: lng })
    setSugestoes([])
    sessionTokenRef.current = null
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder ?? 'Digite o nome da cidade...'}
        className="w-full bg-fill rounded-ios px-4 py-3 text-[15px] placeholder:text-muted"
      />

      {sugestoes.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-card rounded-ios shadow-ios-lg z-40 overflow-hidden">
          {sugestoes.map((s, i) => (
            <button
              key={s.placePrediction.placeId ?? i}
              onClick={() => handleSelecionar(s)}
              className="tap-scale w-full text-left px-4 py-3 text-[14px] border-b border-separator last:border-0"
            >
              {s.placePrediction.text.text}
            </button>
          ))}
        </div>
      )}

      {buscando && <p className="text-[12px] text-muted mt-1">Buscando...</p>}
      {erro && <p className="text-[12px] text-red mt-1"><AlertTriangle className="w-3.5 h-3.5 inline-block mr-1" /> {erro}</p>}
    </div>
  )
}
