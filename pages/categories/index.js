// pages/categories/index.js
import React from 'react'
import Head from 'next/head'
import NavBar from '../../components/NavBar'
import { supabase } from '../../lib/supabaseClient'

function makePublicUrl(storagePath) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
  if (!storagePath || !baseUrl) return null

  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath
  }

  if (storagePath.startsWith('public-assets/')) {
    return `${baseUrl}/storage/v1/object/public/${storagePath}`
  }

  return `${baseUrl}/storage/v1/object/public/public-assets/${storagePath}`
}

export default function CategoriesPage({ categories }) {
  return (
    <>
      <Head>
        <title>Browse categories – Haullcell</title>
      </Head>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <NavBar />
        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-1">
              All categories
            </h1>
            <p className="text-sm text-slate-500 mb-4">
              Explore wholesale items across all departments.
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 sm:gap-4">
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`/products?category=${cat.id}`}
                  className="group rounded-2xl bg-white border border-slate-200 shadow-sm px-2 py-3 flex flex-col items-center hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden mb-2">
                    {cat.iconUrl ? (
                      <img
                        src={cat.iconUrl}
                        alt={cat.name}
                        className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-sm sm:text-base font-semibold text-indigo-600">
                        {cat.name?.[0]?.toUpperCase() || '?'}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] sm:text-xs text-slate-800 text-center leading-tight line-clamp-2">
                    {cat.name}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

export async function getServerSideProps() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, icon_path')
    .order('id', { ascending: true })

  if (error) {
    console.error('categories page error', error)
  }

  const categories =
    (data || []).map((c) => ({
      id: c.id,
      name: c.name,
      iconPath: c.icon_path || null,
      iconUrl: c.icon_path ? makePublicUrl(c.icon_path) : null,
    }))

  return {
    props: { categories },
  }
}
