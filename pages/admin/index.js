// pages/admin/index.js
import React, { useEffect } from 'react'
import { useRouter } from 'next/router'
import NavBar from '../../components/NavBar'
import useAdmin from '../../lib/useAdmin'

export default function AdminIndex() {
  const { loading, isAdmin } = useAdmin()
  const router = useRouter()

  useEffect(() => {
    if (!loading && isAdmin) {
      // Redirect admin to main users dashboard
      router.replace('/admin/users')
    }
  }, [loading, isAdmin, router])

  if (loading) {
    return (
      <>
        <NavBar />
        <main className="p-8 text-white">Checking admin access…</main>
      </>
    )
  }

  if (!isAdmin) {
    return (
      <>
        <NavBar />
        <main className="p-8">
          <div className="max-w-2xl mx-auto bg-red-900/40 border border-red-500/60 p-6 rounded-xl text-white">
            <h2 className="text-lg font-semibold">Admin only</h2>
            <p className="mt-2 text-sm text-red-100">
              You don&apos;t have permission to view this page.
            </p>
          </div>
        </main>
      </>
    )
  }

  // While redirecting
  return (
    <>
      <NavBar />
      <main className="p-8 text-white">Redirecting to admin users…</main>
    </>
  )
}
