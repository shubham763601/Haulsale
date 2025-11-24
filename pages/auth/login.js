// pages/auth/login.js
import React, { useState, useContext } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
import UserContext from '../../lib/userContext'

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useContext(UserContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSignIn(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Example: password sign-in. If you use OTP/OAuth, replace this with signInWithOtp or signInWithOAuth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message || 'Sign in failed')
        setLoading(false)
        return
      }

      // data.session?.user will contain the user
      setUser(data?.user ?? data?.session?.user ?? null)

      // Redirect where you want after login
      router.push('/')
    } catch (err) {
      setError(err.message ?? String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: 20 }}>
      <h1>Sign in</h1>
      <form onSubmit={handleSignIn}>
        <label>
          Email
          <input value={email} onChange={e => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Password
          <input value={password} onChange={e => setPassword(e.target.value)} type="password" required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
