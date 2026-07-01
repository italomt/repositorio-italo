import { useEffect, useRef, useState } from 'react'
import { carregarGoogleMaps } from '../../lib/maps'
import { AlertTriangle, MapPin } from 'lucide-react'

export default function EnderecoAutocomplete({ value, onChange, onSelecionar, placeholder, cidade }) {
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

    if (!texto || texto.trim().length < 3) {
      setSugestoes([])
      return
    }

    debounceRef.current = setTimeout(async () => {
      setBuscando(true)
      try {
        const maps = await carregarGoogleMaps()
        const { AutocompleteSessionToken, AutocompleteSuggestion } = await maps.importLibrary('places')

        if (!sessionTokenRef.current) sessionTokenRef.current = new AutocompleteSessionToken()

        const input = cidade ? `${texto}, ${cidade}` : texto
        const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input,
          includedPrimaryTypes: ['street_address', 'premise', 'establishment'],
          sessionToken: sessionTokenRef.current,
        })
        setSugestoes(suggestions ?? [])
      } catch (e) {
        setErro('Não foi possível buscar endereços agora.')
        setSugestoes([])
      } finally {
        setBuscando(false)
      }
    }, 300)
  }

  async function handleSelecionar(suggestion) {
    const place = suggestion.placePrediction.toPlace()
    await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location', 'addressComponents'] })

    const endereco = place.formattedAddress ?? place.displayName ?? ''
    const lat = place.location?.lat?.()
    const lng = place.location?.lng?.()

    onChange(endereco)
    onSelecionar({ endereco, nome: place.displayName ?? null, latitude: lat ?? null, longitude: lng ?? null })
    setSugestoes([])
    sessionTokenRef.current = null
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder ?? 'Digite o endereço...'}
        className="w-full bg-card rounded-ios px-4 py-3 text-[15px] font-sans placeholder:text-muted"
      />

      {sugestoes.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-card rounded-ios shadow-ios-lg z-40 overflow-hidden">
          {sugestoes.map((s, i) => (
            <button
              key={s.placePrediction.placeId ?? i}
              onClick={() => handleSelecionar(s)}
              className="tap-scale w-full text-left px-4 py-3 text-[14px] border-b border-separator last:border-0 flex items-start gap-2"
            >
              <MapPin className="w-4 h-4 text-muted mt-0.5 flex-shrink-0" />
              <span>{s.placePrediction.text.text}</span>
            </button>
          ))}
        </div>
      )}

      {buscando && <p className="text-[12px] text-muted mt-1">Buscando...</p>}
      {erro && <p className="text-[12px] text-red mt-1"><AlertTriangle className="w-3.5 h-3.5 inline-block mr-1" /> {erro}</p>}
    </div>
  )
}
