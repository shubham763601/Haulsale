// pages/account/index.js
import React, { useContext, useEffect, useState } from 'react'
import UserContext from '../../lib/userContext'
import { supabase } from '../../lib/supabaseClient'

export default function AccountPage() {
  const { user } = useContext(UserContext)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function loadProfile() {
      if (!user) {
        setProfile(null)
        setLoading(false)
        return
      }

      try {
        // Adjust table name if you use `profiles` or `users` etc.
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) {
          console.error('Error loading profile', error)
          setProfile(null)
        } else {
          if (!mounted) return
          setProfile(data)
        }
      } catch (e) {
        console.error(e)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProfile()
    return () => { mounted = false }
  }, [user])

  if (loading) return <div>Loading profile...</div>

  if (!user) return <div>Please sign in to view your account</div>

  return (
    <div>
      <h1>Account</h1>
      <p>Email: {user.email}</p>
      <pre>{JSON.stringify(profile, null, 2)}</pre>
    </div>
  )
}
