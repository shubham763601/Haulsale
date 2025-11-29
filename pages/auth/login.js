// pages/auth/login.js
import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import AuthLayout from '../../components/AuthLayout'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError('Please enter your email.')
      return
    }

    setLoading(true)
    try {
      // If password provided: email + password login
      // If not: magic link / OTP login (Supabase will email link / OTP)
      let result
      if (password) {
        result = await supabase.auth.signInWithPassword({ email, password })
      } else {
        result = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/account` },
        })
      }

      if (result.error) {
        throw result.error
      }

      if (password) {
        // Session will be picked by UserContext in _app
        router.push('/account')
      } else {
        // Magic link / OTP case
        setError(
          'Check your email for a sign-in link. You can close this page after logging in.'
        )
      }
    } catch (err) {
      console.error('login error', err)
      setError(err.message || 'Failed to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Sign in to Haullcell"
      subtitle="Access your marketplace dashboard, orders and payouts."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            className="mt-1 input"
            placeholder="you@shopname.in"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-medium text-slate-700">
              Password <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <span className="text-[11px] text-slate-500">
              Leave empty to get a magic link
            </span>
          </div>
          <input
            type="password"
            className="mt-1 input"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-4 text-xs text-slate-500 text-center">
        New to Haullcell?{' '}
        <Link href="/auth/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Create an account
        </Link>
      </div>
    </AuthLayout>
  )
}