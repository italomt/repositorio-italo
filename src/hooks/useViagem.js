import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { geocodificar } from '../lib/maps'

const CACHE_KEY = 'active_viagem_id'

export function useViagem() {
  const [viagens, setViagens] = useState([])
  const [viagem, setViagem] = useState(null)
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async (activeId) => {
    setLoading(true)

    const { data: todas } = await supabase
      .from('viagens')
      .select('*')
      .order('created_at', { ascending: false })

    const lista = todas || []
    setViagens(lista)

    if (lista.length === 0) {
      setViagem(null)
      setLoading(false)
      return
    }

    let targetId = activeId

    // Tenta carregar do profile (fonte da verdade)
    if (!targetId) {
      try {
        const { data } = await supabase.auth.getUser()
        const user = data?.user
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('active_viagem_id')
            .eq('id', user.id)
            .maybeSingle()
          if (profile?.active_viagem_id && lista.some((v) => v.id === profile.active_viagem_id)) {
            targetId = profile.active_viagem_id
          }
        }
      } catch { /* sessão expirada, ignora */ }
    }

    // Fallback: localStorage cache
    if (!targetId) {
      const cached = localStorage.getItem(CACHE_KEY)
      if (cached && lista.some((v) => v.id === cached)) {
        targetId = cached
      }
    }

    // Fallback: primeira viagem
    if (!targetId) {
      targetId = lista[0].id
    }

    const ativa = lista.find((v) => v.id === targetId) || lista[0]
    setViagem(ativa)

    // Sincroniza cache
    if (ativa) {
      localStorage.setItem(CACHE_KEY, ativa.id)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    carregar()
  }, [carregar])

  // Escuta troca de viagem vinda de outra instância do hook
  useEffect(() => {
    const handler = (e) => {
      setViagens((prev) => {
        const nova = prev.find((v) => v.id === e.detail)
        if (nova) setViagem(nova)
        return prev
      })
    }
    window.addEventListener('viagem-trocada', handler)
    return () => window.removeEventListener('viagem-trocada', handler)
  }, [])

  const selecionarViagem = useCallback(async (viagemId) => {
    const nova = viagens.find((v) => v.id === viagemId)
    if (!nova) return

    setViagem(nova)
    localStorage.setItem(CACHE_KEY, viagemId)

    try {
      const { data } = await supabase.auth.getUser()
      const user = data?.user
      if (user) {
        await supabase
          .from('profiles')
          .update({ active_viagem_id: viagemId })
          .eq('id', user.id)
      }
    } catch { /* ignora */ }

    window.dispatchEvent(new CustomEvent('viagem-trocada', { detail: viagemId }))
  }, [viagens])

  function gerarCodigo() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)]
    return code
  }

  const criarViagem = useCallback(async (dados) => {
    // 1. Gera código único
    let codigo
    for (let tentativa = 0; tentativa < 10; tentativa++) {
      codigo = gerarCodigo()
      const { count } = await supabase
        .from('viagens')
        .select('*', { count: 'exact', head: true })
        .eq('codigo_convite', codigo)
      if (count === 0) break
    }

    // 2. Cria viagem
    const { data: nova, error: errViagem } = await supabase
      .from('viagens')
      .insert({
        nome: dados.nome,
        data_inicio: dados.data_inicio,
        data_fim: dados.data_fim,
        tipo: dados.tipo || 'lazer',
        status: 'planejando',
        moeda_principal: 'EUR',
        codigo_convite: codigo,
      })
      .select()
      .single()

    if (errViagem || !nova) return { data: null, error: errViagem }

    // 2. Cria cidade com geocodificação
    let geo = null
    try { geo = await geocodificar(`${dados.cidade}, ${dados.pais || ''}`) } catch {}
    const { data: cidade } = await supabase
      .from('cidades')
      .upsert({
        nome: dados.cidade,
        pais: dados.pais || '',
        flag_emoji: dados.flag_emoji || null,
        ...(geo ? { latitude: geo.latitude, longitude: geo.longitude } : {}),
      }, { onConflict: 'nome,pais' })
      .select()
      .single()

    // 3. Cria dias para todas as cidades
    let offset = 0
    const todasCidades = [
      { nome: dados.cidade, pais: dados.pais, dias: dados.dias_na_cidade || 1, flag: dados.flag_emoji },
      ...(dados.cidades_extras || []),
    ]

    for (const cidadePlan of todasCidades) {
      let cidadeId = cidade?.id
      if (cidadePlan.nome !== dados.cidade || cidadePlan.pais !== dados.pais) {
        // Geocodifica para obter coordenadas
        let geo = null
        try { geo = await geocodificar(`${cidadePlan.nome}, ${cidadePlan.pais}`) } catch {}
        
        const { data: novaCidade } = await supabase
          .from('cidades')
          .upsert({
            nome: cidadePlan.nome,
            pais: cidadePlan.pais,
            flag_emoji: cidadePlan.flag || null,
            ...(geo ? { latitude: geo.latitude, longitude: geo.longitude } : {}),
          }, { onConflict: 'nome,pais' })
          .select()
          .single()
        cidadeId = novaCidade?.id || null
      }

      for (let i = 0; i < cidadePlan.dias; i++) {
        const dia = new Date(dados.data_inicio + 'T00:00:00')
        dia.setDate(dia.getDate() + offset + i)
        await supabase.from('dias').insert({
          viagem_id: nova.id,
          cidade_id: cidadeId,
          data: dia.toISOString().slice(0, 10),
          status: 'planejando',
        })
      }
      offset += cidadePlan.dias
    }

    // 4. Cria hospedagens
    if (dados.hoteis?.length) {
      const cidadeIdMap = [
        cidade?.id,
        ...(dados.cidades_extras || []).map((c, i) => {
          // Precisamos buscar o ID de cada cidade extra
          return null // será preenchido abaixo
        }),
      ]

      // Busca IDs das cidades extras
      for (let i = 0; i < (dados.cidades_extras || []).length; i++) {
        const c = dados.cidades_extras[i]
        if (c.nome && c.pais) {
          const { data: cid } = await supabase
            .from('cidades')
            .select('id')
            .eq('nome', c.nome)
            .eq('pais', c.pais)
            .maybeSingle()
          cidadeIdMap[i + 1] = cid?.id || null
        }
      }

      for (const h of dados.hoteis) {
        const cid = cidadeIdMap[h.cidade_idx]
        if (cid) {
          await supabase.from('hospedagens').insert({
            viagem_id: nova.id,
            cidade_id: cid,
            nome: h.nome,
            endereco: h.endereco || null,
            latitude: h.latitude,
            longitude: h.longitude,
            tipo: 'hotel',
            status: 'reservada',
          })
        }
      }
    }

    // 5. Cria transporte se informado
    if (dados.transporte && cidade?.id) {
      await supabase.from('transportes').insert({
        viagem_id: nova.id,
        tipo: dados.transporte,
        status: 'pendente',
      })
    }

    // 6. Adiciona criador como owner
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        await supabase.from('usuarios_viagem').upsert({
          viagem_id: nova.id,
          usuario_id: userData.user.id,
          papel: 'owner',
          status: 'aceito',
        }, { onConflict: 'viagem_id,usuario_id' })
      }
    } catch { /* ignora */ }

    // 7. Torna ativa
    await selecionarViagem(nova.id)
    await carregar(nova.id)

    return { data: nova, error: null }
  }, [carregar, selecionarViagem])

  const atualizarViagem = useCallback(async (id, campos) => {
    const { error } = await supabase.from('viagens').update(campos).eq('id', id)
    if (!error) {
      setViagens((prev) => prev.map((v) => (v.id === id ? { ...v, ...campos } : v)))
      if (viagem?.id === id) setViagem((prev) => ({ ...prev, ...campos }))
    }
    return { error }
  }, [viagem?.id])

  const viagemId = viagem?.id ?? null

  return {
    viagens,
    viagem,
    viagemId,
    loading,
    recarregar: carregar,
    selecionarViagem,
    criarViagem,
    atualizarViagem,
  }
}
