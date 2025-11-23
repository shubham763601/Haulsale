// frontend/pages/account/index.js
import NavBar from '../../components/NavBar'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export default function AccountPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true)
      setError('')
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        if (!data?.user) {
          router.replace('/auth/login')
          return
        }
        setUser(data.user)
      } catch (err) {
        console.error(err)
        setError('Could not load account. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [router])

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.error(err)
    } finally {
      router.push('/')
    }
  }

  // Become seller: call server API
  const becomeSeller = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      if (!userId) {
        alert('Not logged in')
        return
      }
      const r = await fetch('/api/create-seller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, shop_name: 'Demo Wholesale' })
      })
      const json = await r.json()
      if (!r.ok) {
        console.error(json)
        alert(json.error || 'Create seller failed')
        return
      }
      alert(json.message || 'Seller created')
      // Optionally reload or redirect
      router.reload()
    } catch (err) {
      console.error(err)
      alert('Unexpected error creating seller')
    }
  }

  return (
    <div className="account-page">
      <NavBar />
      <main className="account-main">
        <div className="account-card">
          {loading && <div>Loading account…</div>}
          {!loading && user && (
            <>
              <h1 className="account-title">Hi, {user.email || 'wholesale user'}</h1>
              <div>
                <div>User ID</div>
                <div><code>{user.id}</code></div>
                <div>Email</div>
                <div>{user.email}</div>
              </div>

              <div style={{ marginTop: 12 }}>
                <button onClick={() => router.push('/')}>Back to marketplace</button>
                <button onClick={handleLogout}>Logout</button>
                <button onClick={becomeSeller}>Become a Seller</button>
              </div>
            </>
          )}
          {!loading && !user && !error && <div>You are not logged in. Redirecting…</div>}
          {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
      </main>
    </div>
  )
}
