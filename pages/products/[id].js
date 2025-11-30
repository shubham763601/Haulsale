// pages/products/[id].js
import React, { useContext, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { supabase } from '../../lib/supabaseClient'
import NavBar from '../../components/NavBar'
import UserContext from '../../lib/userContext'

function StarIcon(props) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" {...props}>
      <path
        d="M10 1.5 12.6 7l5.1.4-3.9 3.3 1.2 5-4.9-2.8-4.9 2.8 1.2-5L2.3 7.4 7.4 7z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function ProductDetailPage({ product, reviews: initialReviews }) {
  const router = useRouter()
  const { user } = useContext(UserContext)

  const [reviews, setReviews] = useState(initialReviews || [])
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const imageUrl =
    baseUrl && product.imagePath
      ? `${baseUrl}/storage/v1/object/public/public-assets/${product.imagePath}`
      : null

  async function handleReviewSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!user) {
      setError('Please sign in to leave a review')
      return
    }

    try {
      setSaving(true)
      const { error: insertErr, data } = await supabase
        .from('reviews')
        .insert({
          product_id: product.id,
          buyer_id: user.id,
          rating,
          comment: comment || null,
        })
        .select()
        .single()

      if (insertErr) {
        console.error(insertErr)
        setError(insertErr.message || 'Failed to save review')
      } else {
        // optimistic: just push to local list
        setReviews((prev) => [
          {
            ...data,
            buyer_email: user.email,
          },
          ...prev,
        ])
        setComment('')
        setRating(5)
      }
    } catch (err) {
      console.error(err)
      setError('Unexpected error saving review')
    } finally {
      setSaving(false)
    }
  }

  const price = Number(product.price || 0)
  const mrp = Number(product.mrp || 0)
  const hasDiscount = mrp && mrp > price
  const offPct = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : null

  return (
    <>
      <Head>
        <title>{product.title} — Haullcell</title>
      </Head>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <NavBar />
        <main className="flex-1 mx-auto max-w-5xl px-3 sm:px-4 lg:px-6 py-4">
          {/* Top section */}
          <div className="grid gap-6 md:grid-cols-[1.2fr,2fr]">
            {/* Image */}
            <div className="rounded-xl bg-white border border-slate-200 p-4 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.title}
                  className="max-h-[360px] object-contain"
                />
              ) : (
                <div className="w-full h-64 flex flex-col items-center justify-center text-slate-300 text-sm">
                  <div className="w-20 h-20 rounded-full bg-slate-200 mb-3" />
                  No image
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-3">
              <h1 className="text-xl font-semibold text-slate-900">
                {product.title}
              </h1>

              {/* Rating */}
              {product.rating_count > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-emerald-600 text-white text-xs font-medium">
                    <StarIcon className="w-3 h-3" />
                    {product.rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-600">
                    {product.rating_count} ratings
                  </span>
                </div>
              )}

              {/* Price block */}
              <div className="space-y-1">
                <div className="text-2xl font-semibold text-slate-900">
                  ₹{price.toFixed(2)}
                </div>
                {hasDiscount && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-400 line-through">
                      ₹{mrp.toFixed(2)}
                    </span>
                    <span className="text-emerald-600 font-semibold">
                      {offPct}% off
                    </span>
                  </div>
                )}
                {typeof product.stock === 'number' && (
                  <div className="text-xs text-slate-500">
                    Stock: {product.stock}
                  </div>
                )}
              </div>

              {product.description && (
                <p className="text-sm text-slate-700 whitespace-pre-line">
                  {product.description}
                </p>
              )}

              <button
                className="mt-3 inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                onClick={() => router.push(`/checkout?product=${product.id}`)}
              >
                Add to cart
              </button>
            </div>
          </div>

          {/* Reviews section */}
          <section className="mt-8 grid gap-6 md:grid-cols-[1.3fr,1.7fr]">
            {/* Review form */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-2">
                Rate this product
              </h2>
              {!user && (
                <p className="text-xs text-slate-500 mb-2">
                  Please sign in to submit a review.
                </p>
              )}

              {error && (
                <div className="mb-2 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-3">
                {/* Star selector */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-0.5"
                    >
                      <StarIcon
                        className={`w-6 h-6 ${
                          star <= rating
                            ? 'text-amber-400'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs text-slate-600">
                    {rating} / 5
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600">
                    Comment (optional)
                  </label>
                  <textarea
                    className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm min-h-[80px]"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    disabled={!user}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!user || saving}
                  className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {saving ? 'Submitting…' : 'Submit review'}
                </button>
              </form>
            </div>

            {/* Reviews list */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-slate-900 mb-3">
                Customer reviews
              </h2>
              {reviews.length === 0 && (
                <p className="text-xs text-slate-500">
                  No reviews yet. Be the first to review this product.
                </p>
              )}
              <ul className="space-y-3">
                {reviews.map((r) => (
                  <li
                    key={r.id}
                    className="border-b last:border-0 border-slate-100 pb-3 last:pb-0"
                  >
                    <div className="flex items-center gap-2 text-xs mb-1">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-emerald-600 text-white text-[11px] font-medium">
                        <StarIcon className="w-3 h-3" />
                        {r.rating}
                      </span>
                      <span className="text-slate-500">
                        {r.buyer_email || 'Buyer'}
                      </span>
                    </div>
                    {r.comment && (
                      <p className="text-xs text-slate-700 whitespace-pre-line">
                        {r.comment}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>
      </div>
    </>
  )
}

export async function getServerSideProps(ctx) {
  const id = Number(ctx.params.id)

  const { data: p, error } = await supabase
    .from('products')
    .select(
      `
      id,
      title,
      description,
      price,
      mrp,
      rating,
      rating_count,
      created_at,
      product_variants ( price, stock ),
      product_images ( storage_path )
    `
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !p) {
    console.error('product detail error', error)
    return { notFound: true }
  }

  const product = {
    id: p.id,
    title: p.title,
    description: p.description,
    price:
      p.product_variants?.[0]?.price ??
      p.price ??
      null,
    mrp: p.mrp ?? null,
    rating: p.rating ?? 0,
    rating_count: p.rating_count ?? 0,
    stock: p.product_variants?.[0]?.stock ?? null,
    imagePath: p.product_images?.[0]?.storage_path ?? null,
  }

  const { data: reviews, error: revErr } = await supabase
    .from('reviews')
    .select('id, product_id, buyer_id, rating, comment, created_at')
    .eq('product_id', id)
    .order('created_at', { ascending: false })

  if (revErr) {
    console.error('reviews load error', revErr)
  }

  return {
    props: {
      product,
      reviews: reviews || [],
    },
  }
}
