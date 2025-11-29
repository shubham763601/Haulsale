// pages/auth/forgot-password.js
import React, { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import NavBar from '../../components/NavBar'
import { supabase } from '../../lib/supabaseClient'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [msg, setMsg] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleReset(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMsg(null)

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`
    })

    if (error) setError(error.message)
    else setMsg('Check your email for a reset link.')

    setLoading(false)
  }

  return (
    <>
      <Head><title>Reset password — Haulcell</title></Head>
      <NavBar />

      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-4 text-xl font-semibold text-slate-900">Reset password</h1>

          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600">Email</label>
              <input
                type="email"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            {msg && <p className="text-sm text-emerald-600">{msg}</p>}
            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-600">
            Remember your password?{' '}
            <Link href="/auth/login">
              <a className="font-medium text-indigo-600 hover:text-indigo-500">Sign in</a>
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}