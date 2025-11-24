// pages/auth/signup.js
import React, { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [phase, setPhase] = useState('enter') // enter -> otp-sent -> verified -> done
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  // Step 1: request an OTP (server creates OTP & sends email)
  async function handleRequestOtp(e) {
    e?.preventDefault()
    setError(null)
    setInfo(null)
    if (!email) return setError('Enter an email')

    setLoading(true)
    try {
      const res = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to request OTP')
      setPhase('otp-sent')
      setInfo('OTP sent to your email. Enter it below.')
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  // Step 2: verify OTP with server; on success call supabase signUp
  async function handleVerifyAndSignup(e) {
    e?.preventDefault()
    setError(null)
    setInfo(null)
    if (!email || !password || !otp) return setError('Provide email, password and OTP')

    setLoading(true)
    try {
      // verify OTP
      const verify = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const vdata = await verify.json()
      if (!verify.ok) throw new Error(vdata?.error || 'OTP verification failed')

      // OTP ok -> create the user with email + password (client-side)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email,
        password: password,
      })

      if (signUpError) throw new Error(signUpError.message || 'Signup failed')

      // At this point the user is created (and may be signed in or require email confirmation depending on your Supabase settings)
      setPhase('verified')
      setInfo('Signup successful. Redirecting...')

      // Optionally create a profile row etc. If you require creating profile after signup, do it here (once user session exists)
      setTimeout(() => router.push('/'), 1200)
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: '20px auto', padding: 20 }}>
      <h1>Create account</h1>

      {phase === 'enter' && (
        <form onSubmit={handleRequestOtp}>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Email
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </label>
          <label style={{ display: 'block', marginBottom: 8 }}>
            Create password
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </label>

          <button type="submit" disabled={loading}>{loading ? 'Sending OTP...' : 'Request OTP'}</button>
        </form>
      )}

      {phase === 'otp-sent' && (
        <form onSubmit={handleVerifyAndSignup}>
          <p>Enter the OTP sent to <strong>{email}</strong></p>
          <label style={{ display: 'block', marginBottom: 8 }}>
            OTP
            <input value={otp} onChange={e => setOtp(e.target.value)} required />
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify & Create account'}</button>
            <button type="button" onClick={() => setPhase('enter')}>Change email/password</button>
          </div>
        </form>
      )}

      {info && <p style={{ color: 'green' }}>{info}</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}