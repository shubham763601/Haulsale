// frontend/pages/auth/login.js
import { useState } from 'react'
// import the shared client instead
import { supabase } from '../../lib/supabaseClient' // adjust path if needed
import { useRouter } from 'next/router'

export default function LoginPage(){
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const sendOtp = async (e) => {
    e?.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      setMessage('OTP sent to your email')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to send OTP')
    } finally { setLoading(false) }
  }

  const verifyOtp = async (e) => {
    e?.preventDefault()
    setLoading(true); setError('')
    try {
      // verifyAuth will set a session cookie via redirect-less flow
      const { data, error } = await supabase.auth.verifyOtp({ email, token: otp, type: 'email' })
      if (error) throw error
      setMessage('Logged in — redirecting')
      router.push('/account')
    } catch (err) {
      console.error(err)
      setError(err.message || 'Failed to verify OTP')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <h1>Log in / Sign up</h1>
      <form onSubmit={sendOtp}>
        <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
        <button type="submit">{loading ? 'Sending…' : 'Send OTP'}</button>
      </form>

      <form onSubmit={verifyOtp}>
        <input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="OTP" />
        <button type="submit">Verify OTP</button>
      </form>

      {message && <div style={{ color: 'green' }}>{message}</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  )
}
