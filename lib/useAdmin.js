// lib/useAdmin.js
import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { useRouter } from 'next/router'

export default function useAdmin({ redirect = true } = {}) {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let mounted = true
    async function check() {
      setLoading(true)
      const { data } = await supabase.auth.getSession()
      const user = data?.session?.user ?? null
      if (!user) {
        if (redirect) router.replace('/auth/login')
        if (mounted) { setIsAdmin(false); setLoading(false) }
        return
      }

      // fetch profile
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        if (mounted) { setIsAdmin(false); setLoading(false) }
        return
      }

      const admin = profile?.role === 'admin'
      if (!admin && redirect) router.replace('/')
      if (mounted) { setIsAdmin(admin); setLoading(false) }
    }

    check()
    return () => { mounted = false }
  }, [])

  return { loading, isAdmin }
}
