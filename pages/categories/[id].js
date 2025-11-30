// pages/categories/[id].js
import React from 'react'
import Head from 'next/head'
import NavBar from '../../components/NavBar'
import { supabase } from '../../lib/supabaseClient'
import ProductCard from '../../components/ProductCard'

function makePublicUrl(storagePath) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    ''
  if (!storagePath || !baseUrl) return null

  if (storagePath.startsWith('http://') || storagePath.startsWith('https://')) {
    return storagePath
  }

  if (storagePath.startsWith('public-assets/')) {
    return `${baseUrl}/storage/v1/object/public/${storagePath}`
  }

  return `${baseUrl}/storage/v1/object/public/public-assets/${storagePath}`
}

export default function CategoryPage({ category, products }) {
  return (
    <>
      <Head>
        <title>
          {category ? `${category.name} – Haullcell` : 'Category – Haullcell'}
        </title>
      </Head>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        <NavBar />

        <main className="flex-1">
          <div className="mx-auto max-w-6xl px-3 sm:px-4 lg:px-6 py-4 lg:py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg sm:text-xl font-semibold text-slate-900">
                  {category ? category.name : 'Category'}
                </h1>
                <p className="text-xs text-slate-500">
                  Browse wholesale products in this category.
                </p>
              </div>
            </div>

            {/* Products grid */}
            {(!products || products.length === 0) && (
              <div className="mt-8 text-sm text-slate-500">
                No products found in this category yet.
              </div>
            )}

            {products && products.length > 0 && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  )
}

export async function getServerSideProps({ params }) {
  const categoryId = Number(params.id)

  if (Number.isNaN(categoryId)) {
    return { notFound: true }
  }

  // load the category
  const { data: categoryData } = await supabase
    .from('categories')
    .select('id, name, icon_path')
    .eq('id', categoryId)
    .maybeSingle()

  if (!categoryData) {
    return { notFound: true }
  }

  // load products for this category
  const productSelect = `
    id,
    title,
    price,
    mrp,
    rating,
    rating_count,
    description,
    category_id,
    product_variants ( price, stock ),
    product_images ( storage_path )
  `

  const { data: productData } = await supabase
    .from('products')
    .select(productSelect)
    .eq('category_id', categoryId)
    .order('created_at', { ascending: false })

  function normalizeProducts(list) {
    if (!list) return []
    return list.map((p) => {
      const firstVariant = Array.isArray(p.product_variants)
        ? p.product_variants[0]
        : null
      const firstImage = Array.isArray(p.product_images)
        ? p.product_images[0]
        : null

      return {
        id: p.id,
        title: p.title,
        description: p.description,
        category_id: p.category_id ?? null,
        price: firstVariant?.price ?? p.price ?? null,
        stock: firstVariant?.stock ?? null,
        imagePath: firstImage?.storage_path ?? null,
        // ProductCard also uses these:
        mrp: p.mrp ?? null,
        rating: p.rating ?? null,
        rating_count: p.rating_count ?? null,
      }
    })
  }

  const category = {
    id: categoryData.id,
    name: categoryData.name,
    iconPath: categoryData.icon_path || null,
    iconUrl: categoryData.icon_path ? makePublicUrl(categoryData.icon_path) : null,
  }

  return {
    props: {
      category,
      products: normalizeProducts(productData),
    },
  }
}
