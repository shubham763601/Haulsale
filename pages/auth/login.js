import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useRouter } from 'next/router'

export default function LoginPage(){
  const router = useRouter()
  const [mode,setMode] = useState('email')
  const [email,setEmail] = useState('')
  const [otp,setOtp] = useState('')
  const [loading,setLoading] = useState(false)
  const [message,setMessage] = useState('')
  const [error,setError] = useState('')

  const sendOtp = async (e) => {
    e?.preventDefault()
    setLoading(true); setError(''); setMessage('')
    try {
      if(!email) throw new Error('Enter email')
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) throw error
      setMessage('OTP sent to email (check your inbox).')
    } catch (err) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (e) => {
    e?.preventDefault()
    setLoading(true); setError(''); setMessage('')
    try {
      if(!otp) throw new Error('Enter OTP')
      const { data, error } = await supabase.auth.verifyOtp({ token: otp, type: 'email' })
      if (error) throw error
      setMessage('Logged in — redirecting…')
      setTimeout(()=>router.push('/account'),700)
    } catch (err) {
      setError(err.message || 'OTP verify failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-3xl mx-auto bg-[#071029] text-[#e6eef6] p-8 rounded-xl">
        <h1 className="text-4xl font-bold mb-6">Log in / Sign up</h1>
        <form onSubmit={sendOtp}>
          <label className="block mb-2">Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} className="w-full p-3 rounded" placeholder="you@example.com"/>
          <div className="mt-4">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 rounded">Send OTP</button>
          </div>
        </form>

        <hr className="my-6" />

        <form onSubmit={verifyOtp}>
          <label className="block mb-2">Enter OTP</label>
          <input value={otp} onChange={e=>setOtp(e.target.value)} className="w-full p-3 rounded" placeholder="Enter code"/>
          <div className="mt-4">
            <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 rounded">Verify OTP</button>
          </div>
        </form>

        {message && <div className="mt-4 text-green-300">{message}</div>}
        {error && <div className="mt-4 text-red-300">{error}</div>}
      </main>
    </div>
  )
}
