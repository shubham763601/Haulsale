// pages/auth/signup.js
import React, { useState, useContext, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
import UserContext from '../../lib/userContext'
import NavBar from '../../components/NavBar'

export default function SignupPage() {
  const router = useRouter()
  const { user, setUser } = useContext(UserContext)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user) router.push('/')
  }, [user])

  async function handleSignup(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // 1️⃣ Create user with supabase auth
    const { data, error: signupErr } = await supabase.auth.signUp({
      email,
      password
    })

    if (signupErr) {
      setError(signupErr.message)
      setLoading(false)
      return
    }

    const newUser = data?.user

    if (newUser) {
      // 2️⃣ Insert profile row
      const { error: profileErr } = await supabase
        .from('profiles')
        .insert({
          id: newUser.id,
          full_name: fullName,
          email,
          role: 'buyer'
        })

      if (profileErr) {
        console.error('profile insert error', profileErr)
      }

      setUser(newUser)
      router.push('/')
    }

    setLoading(false)
  }

  return (
    <>
      <Head><title>Create account — Haulcell</title></Head>
      <NavBar />

      <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-xl font-semibold text-slate-900">Create account</h1>
          <p className="mb-6 text-sm text-slate-600">
            Sign up to start ordering from wholesalers.
          </p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600">Full name</label>
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                required
              />
            </div>

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

            {error && <p className="text-sm text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              {loading ? 'Signing up...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-600">
            Already have an account?{' '}
            <Link href="/auth/login">
              <a className="font-medium text-indigo-600 hover:text-indigo-500">Sign in</a>
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}