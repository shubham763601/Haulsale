import { useRouter } from 'next/router'
import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

export default function VerifyOtp() {
  const router = useRouter()
  const { email, password } = router.query

  const [otp, setOtp] = useState('')
  const [error, setError] = useState(null)

  async function handleVerify() {
    setError(null)

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'otp'
    })

    if (error) {
      setError(error.message)
      return
    }

    // now set password
    await supabase.auth.updateUser({ password })

    router.push('/account')
  }

  return (
    <main className="min-h-screen p-8 bg-gray-900 text-white flex items-center justify-center">
      <div className="bg-white/5 p-8 rounded-lg max-w-md w-full">
        <h1 className="text-xl font-bold mb-4">Verify OTP</h1>
        <p className="mb-4 text-sm text-gray-300">{email}</p>

        <input 
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full p-3 rounded mb-3 text-black"
          placeholder="Enter OTP"
        />

        {error && <p className="text-red-400 mb-2">{error}</p>}

        <button 
          onClick={handleVerify}
          className="w-full bg-indigo-600 p-3 rounded"
        >
          Verify OTP
        </button>
      </div>
    </main>
  )
}
