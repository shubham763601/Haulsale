// frontend/components/NavBar.js
import Link from 'next/link'

export default function NavBar() {
  return (
    <nav style={{ padding: 12, borderBottom: '1px solid #eee', marginBottom: 18 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', justifyContent: 'space-between' }}>
        <Link href="/"><a style={{ fontWeight: '700', fontSize: 18 }}>Haullcell</a></Link>
        <div>
          <Link href="/"><a style={{ marginRight: 12 }}>Marketplace</a></Link>
          <Link href="/account"><a>My Account</a></Link>
        </div>
      </div>
    </nav>
  )
}