import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const carregarProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null)
      return
    }
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile(data)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      carregarProfile(data.session?.user?.id).finally(() => setLoading(false))
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      setSession(novaSessao)
      carregarProfile(novaSessao?.user?.id)
    })

    return () => listener.subscription.unsubscribe()
  }, [carregarProfile])

  const cadastrar = useCallback(async (email, senha, nome) => {
    const { data, error } = await supabase.auth.signUp({ email, password: senha })
    if (error) return { error }

    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, nome })
      await carregarProfile(data.user.id)
    }
    return { error: null }
  }, [carregarProfile])

  const entrar = useCallback(async (email, senha) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    return { error }
  }, [])

  const sair = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return { session, profile, usuario: session?.user, loading, cadastrar, entrar, sair }
}
