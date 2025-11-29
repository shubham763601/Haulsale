// pages/auth/signup.js
import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
import AuthLayout from '../../components/AuthLayout'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: password || undefined, // optional password
        options: {
          data: { full_name: fullName || null },
          emailRedirectTo: `${window.location.origin}/account`,
        },
      })

      if (error) throw error

      // If email confirmation is on, user must confirm email
      if (data?.user && !data.session) {
        setInfo('Check your email to confirm your account, then sign in.')
      } else {
        // Session created immediately
        router.push('/account')
      }
    } catch (err) {
      console.error('signup error', err)
      setError(err.message || 'Failed to create account.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      title="Create your Haullcell account"
      subtitle="Sign up as a retailer or wholesaler. You can request seller access later."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700">
            Full name
          </label>
          <input
            className="mt-1 input"
            placeholder="Shop owner name"
            value={fullName}
            onChange={e => setFullName(e.target.value)}
          />
        </div>

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
              Password
            </label>
            <span className="text-[11px] text-slate-500">
              Optional if you use magic links only
            </span>
          </div>
          <input
            type="password"
            className="mt-1 input"
            placeholder="Create a password (optional)"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}
        {info && (
          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2 text-xs text-emerald-700">
            {info}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full justify-center"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <div className="mt-4 text-xs text-slate-500 text-center">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Sign in
        </Link>
      </div>
    </AuthLayout>
  )
}