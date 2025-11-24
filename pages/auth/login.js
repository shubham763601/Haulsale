// pages/auth/login.js
import Head from 'next/head'
import React, { useState, useContext } from 'react'
import { useRouter } from 'next/router'
import NavBar from '../../components/NavBar'
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
    setError(null)
    setLoading(true)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message || 'Sign in failed')
        setLoading(false)
        return
      }

      const user = data?.user ?? data?.session?.user ?? null
      setUser(user)
      router.push('/')
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>Sign in | Haullcell</title></Head>
      <NavBar />
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/5 backdrop-blur rounded-lg p-8 shadow-md">
          <h1 className="text-2xl font-bold mb-4 text-white">Sign in</h1>
          <form onSubmit={handleSignIn} className="space-y-4">
            <label className="block"><span className="text-sm text-gray-300">Email</span>
              <input className="mt-1 block w-full rounded border px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} type="email" required />
            </label>
            <label className="block"><span className="text-sm text-gray-300">Password</span>
              <input className="mt-1 block w-full rounded border px-3 py-2" value={password} onChange={e => setPassword(e.target.value)} type="password" required />
            </label>
            <div className="flex items-center justify-between">
              <button type="submit" disabled={loading} className="px-4 py-2 rounded bg-indigo-600">
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
              <a href="/auth/signup" className="text-sm">Create account</a>
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </form>
        </div>
      </main>
    </>
  )
}
