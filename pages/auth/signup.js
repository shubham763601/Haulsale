// pages/auth/signup.js
import Head from 'next/head'
import React, { useState } from 'react'
import { useRouter } from 'next/router'
import NavBar from '../../components/NavBar'
import { supabase } from '../../lib/supabaseClient'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  const [phase, setPhase] = useState('enter') // enter -> otp-sent -> verified
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)



  
    // call supabase directly to send OTP (this will use your Supabase email template)
  async function handleRequestOtp(e) {
    e?.preventDefault()
    setError(null)
    setInfo(null)
    if (!email) return setError('Enter an email')

    setLoading(true)
    try {
    // shouldCreateUser: true means Supabase will create the auth user automatically if not present.
    // set to false if you don't want automatic creation.
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
        // set to false if you don't want new users auto-created here:
          shouldCreateUser: true,
        // optional: set a redirect if you're using magic links
        // emailRedirectTo: `${window.location.origin}/auth/verify`
        }
      })

      if (error) throw error

    // Successful: Supabase has queued an email containing the Token (OTP) or magic link.
    // We proceed to OTP entry UI on client side.
      setPhase('otp-sent')
      setInfo('OTP sent to your email. Use the code in the email to verify.')
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyAndSignup(e) {
  e?.preventDefault()
  setError(null)
  setInfo(null)
  if (!email || !password || !otp) return setError('Provide email, password and OTP')

  setLoading(true)
  try {
    // verifyOtp will validate the token and return a session if successful
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    })

    if (verifyError) throw verifyError

    // On success user is signed in and session present in verifyData
    const sessionUser = verifyData?.user ?? verifyData?.session?.user

    // Now set user's password so they have a permanent password for future login
    // updateUser requires an active session (the user should be signed in after verifyOtp)
    const { data: updData, error: updErr } = await supabase.auth.updateUser({
      password: password
    })

    if (updErr) {
      // updateUser may fail if session isn't active; handle gracefully:
      console.warn('Password update error (non-fatal):', updErr)
      // Optionally, you can call resetPasswordForEmail flow or prompt user to use reset link.
    }

    // Optionally create or upsert profile row now
    try {
      await supabase.from('profiles').upsert({
        id: sessionUser.id,
        email: sessionUser.email,
        created_at: new Date().toISOString()
      }, { returning: 'minimal' })
    } catch (e) {
      console.warn('profile upsert warning', e)
    }

    setPhase('verified')
    setInfo('Verification successful — account created. Redirecting...')
    setTimeout(() => router.push('/'), 1000)
  } catch (err) {
    setError(err.message || String(err))
  } finally {
    setLoading(false)
  }
}


  return (
    <>
      <Head>
        <title>Create account | Haullcell</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <NavBar />

      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/5 backdrop-blur rounded-lg p-8 shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-white">Create account</h1>

          {phase === 'enter' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <label className="block">
                <span className="text-sm text-gray-300">Email</span>
                <input
                  className="mt-1 block w-full rounded border border-gray-700 bg-transparent px-3 py-2 text-white placeholder-gray-400"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm text-gray-300">Create password</span>
                <input
                  className="mt-1 block w-full rounded border border-gray-700 bg-transparent px-3 py-2 text-white placeholder-gray-400"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </label>

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
                >
                  {loading ? 'Sending OTP...' : 'Request OTP'}
                </button>
                <a className="text-sm text-gray-300 underline hover:text-white" href="/auth/login">
                  Already have an account?
                </a>
              </div>
            </form>
          )}

          {phase === 'otp-sent' && (
            <form onSubmit={handleVerifyAndSignup} className="space-y-4">
              <p className="text-sm text-gray-300">Enter the OTP sent to <strong className="text-white">{email}</strong></p>

              <label className="block">
                <span className="text-sm text-gray-300">OTP</span>
                <input
                  className="mt-1 block w-full rounded border border-gray-700 bg-transparent px-3 py-2 text-white placeholder-gray-400"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  required
                />
              </label>

              <div className="flex items-center gap-3">
                <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 disabled:opacity-60">
                  {loading ? 'Verifying...' : 'Verify & Create account'}
                </button>
                <button type="button" onClick={() => setPhase('enter')} className="px-3 py-2 rounded bg-gray-700">
                  Change email / password
                </button>
              </div>
            </form>
          )}

          {info && <p className="text-green-400 text-sm mt-2">{info}</p>}
          {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        </div>
      </main>
    </>
  )
}

