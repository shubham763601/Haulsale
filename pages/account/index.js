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
      try {
        setLoading(true)
        setError('')
        const { data, error } = await supabase.auth.getUser()
        if (error) throw error
        if (!data.user) {
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
    await supabase.auth.signOut()
    router.push('/')
  }

  
// call when user clicks button
// inside your account page (client-side)
const becomeSeller = async () => {
  try {
    // get session (contains access token)
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      alert('Not authenticated');
      return;
    }

    const res = await fetch('/api/create-seller', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ shop_name: 'My Shop' }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('create-seller failed', json);
      alert(json.error || 'Failed to create seller');
      return;
    }

    alert('Seller created');
    // Optionally refresh UI, fetch seller info, or router.reload()
  } catch (err) {
    console.error(err);
    alert('Unexpected error');
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
              <h1>Hi, {user.email}</h1>
              <div>
                <div>User ID</div>
                <div><code>{user.id}</code></div>
                <div>Email</div>
                <div>{user.email}</div>
              </div>
              <div style={{ marginTop: 16 }}>
                <button onClick={() => router.push('/')}>Back to marketplace</button>
                <button onClick={handleLogout}>Logout</button>
                <button onClick={becomeSeller}>Become a Seller</button>
              </div>
            </>
          )}
          {error && <div style={{ color: 'red' }}>{error}</div>}
        </div>
      </main>
    </div>
  )
}
