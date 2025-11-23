
import Head from 'next/head'
import Link from 'next/link'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <>
      <Head>
        <title>Haullcell — Wholesale marketplace</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen p-8">
        <header className="max-w-5xl mx-auto flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-teal-600" />
            <h1 className="text-2xl font-bold text-gray-900">Haullcell</h1>
          </div>
          <nav>
            <Link href="/auth/login"><a className="text-sm underline">Login / Sign up</a></Link>
          </nav>
        </header>

        <section className="max-w-5xl mx-auto">
          <div className="bg-white/80 rounded-2xl p-8 drop-shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-4xl font-extrabold text-gray-900">Browse wholesale products</h2>
                <p className="mt-2 text-gray-600">Demo view — showing products directly from your Supabase database.</p>
              </div>
              <motion.img src="/placeholder.jpg" alt="hero sample" initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.6 }} className="w-48 h-48 object-cover rounded-lg shadow"/>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({length:3}).map((_,i)=>(
                <motion.div key={i} whileHover={{ y:-6 }} className="bg-white p-4 rounded-xl shadow">
                  <div className="flex gap-4">
                    <img src="/placeholder.jpg" alt="sample" className="w-24 h-24 rounded-md object-cover"/>
                    <div>
                      <h3 className="font-bold">Sample Phone</h3>
                      <p className="text-sm text-gray-500">SKU: SPHONE001</p>
                      <p className="mt-2 text-green-600 font-semibold">₹7000</p>
                      <Link href="/"><a className="text-indigo-600 underline">View</a></Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
