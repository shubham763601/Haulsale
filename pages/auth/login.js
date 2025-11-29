// pages/auth/login.js
import React, { useState, useContext, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
import UserContext from '../../lib/userContext'
import NavBar from '../../components/NavBar'

export default function LoginPage() {
  const router = useRouter()
  const { user, setUser } = useContext(UserContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  // If logged in — redirect away
  useEffect(() => {
    if (user) router.push('/')
  }, [user])

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      setError(error.message)
    } else if (data?.user) {
      setUser(data.user)
      router.push('/')
    }

    setLoading(false)
  }

  return (
    <>
      <Head><title>Sign in — Haulcell</title></Head>
      <NavBar />

      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mb-6 text-sm text-slate-600">
            Enter your details to access your account.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600">Password</label>
              <input
                type="password"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-sm text-rose-600">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 flex justify-between text-xs text-slate-600">
            <Link href="/auth/forgot-password">
              <a className="hover:text-indigo-600">Forgot Password?</a>
            </Link>
            <Link href="/auth/signup">
              <a className="hover:text-indigo-600">Create Account</a>
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}