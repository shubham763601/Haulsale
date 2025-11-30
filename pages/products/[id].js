// pages/products/[id].js
import { useState } from "react";
import Head from "next/head";
import { supabase } from "../../lib/supabaseClient";
import NavBar from "../../components/NavBar";
import ProductCard from "../../components/ProductCard";

function makePublicUrl(path) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !baseUrl) return null;
  if (path.startsWith("http")) return path;
  return `${baseUrl}/storage/v1/object/public/public-assets/${path}`;
}

export default function ProductPage({ product, similarProducts, reviews }) {
  const [qty, setQty] = useState(1);

  const imageUrl = product.imageUrl || makePublicUrl(product.imagePath);

  return (
    <>
      <Head>
        <title>{product.title} – Haullcell</title>
      </Head>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        <NavBar />

        <main className="flex-1 mx-auto max-w-6xl px-4 py-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* BIG IMAGE */}
            <div className="rounded-2xl bg-white border shadow-sm p-4 flex items-center justify-center">
              <img
                src={imageUrl}
                alt={product.title}
                className="max-w-full max-h-[420px] object-contain"
              />
            </div>

            {/* PRODUCT INFO */}
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {product.title}
              </h1>

              {/* Rating */}
              {product.rating_count > 0 && (
                <div className="mt-1 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-xs font-medium">
                    {product.rating.toFixed(1)} ★
                  </span>
                  <span className="text-xs text-slate-500">
                    ({product.rating_count} reviews)
                  </span>
                </div>
              )}

              {/* Pricing */}
              <div className="mt-3">
                <div className="text-2xl font-semibold text-emerald-600">
                  ₹{product.price.toFixed(2)}
                </div>

                {product.mrp > product.price && (
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span className="text-slate-400 line-through">
                      ₹{product.mrp.toFixed(2)}
                    </span>
                    <span className="text-emerald-600 font-medium">
                      {Math.round(((product.mrp - product.price) / product.mrp) * 100)}% off
                    </span>
                  </div>
                )}
              </div>

              {/* Stock */}
              <div className="mt-1 text-sm text-slate-600">
                Stock: {product.stock ?? "N/A"}
              </div>

              {/* Qty selector */}
              <div className="mt-4 flex items-center gap-2">
                <button
                  className="px-3 py-1 border rounded-md bg-white"
                  onClick={() => qty > 1 && setQty(qty - 1)}
                >
                  –
                </button>
                <div className="px-4 py-1 bg-white border rounded-md">
                  {qty}
                </div>
                <button
                  className="px-3 py-1 border rounded-md bg-white"
                  onClick={() => setQty(qty + 1)}
                >
                  +
                </button>
              </div>

              {/* Add to cart */}
              <button
                className="mt-4 w-full rounded-lg bg-indigo-600 text-white py-3 font-semibold shadow hover:bg-indigo-500"
              >
                Add to Cart
              </button>

              {/* Description */}
              <div className="mt-6">
                <h3 className="font-medium text-slate-900">Description</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {product.description || "No description available."}
                </p>
              </div>
            </div>
          </div>

          {/* Similar products */}
          {similarProducts.length > 0 && (
            <section className="mt-10">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                Similar items in this category
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {similarProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="mt-10 pb-10">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Reviews
            </h2>

            {reviews.length === 0 && (
              <p className="text-sm text-slate-500">No reviews yet.</p>
            )}

            {reviews.map((r) => (
              <div key={r.id} className="border-b py-3">
                <div className="text-sm font-semibold text-slate-800">
                  ★ {r.rating}
                </div>
                <p className="text-sm text-slate-600">{r.comment}</p>
              </div>
            ))}
          </section>
        </main>
      </div>
    </>
  );
}

export async function getServerSideProps(ctx) {
  const id = ctx.params.id;

  const productQuery = `
    id, title, price, mrp, rating, rating_count, description,
    category_id,
    product_variants(price, stock),
    product_images(storage_path)
  `;

  const { data: product } = await supabase
    .from("products")
    .select(productQuery)
    .eq("id", id)
    .single();

  const image = Array.isArray(product.product_images)
    ? product.product_images[0]
    : null;
  const variant = Array.isArray(product.product_variants)
    ? product.product_variants[0]
    : null;

  const normalizedProduct = {
    ...product,
    price: variant?.price ?? product.price ?? 0,
    stock: variant?.stock ?? null,
    imagePath: image?.storage_path || null,
    imageUrl: makePublicUrl(image?.storage_path),
  };

  // Similar products
  const { data: sim } = await supabase
    .from("products")
    .select(productQuery)
    .eq("category_id", product.category_id)
    .neq("id", id)
    .limit(10);

  const similarProducts = sim.map((p) => ({
    ...p,
    price: p.product_variants?.[0]?.price ?? p.price,
    imagePath: p.product_images?.[0]?.storage_path,
  }));

  // Reviews
  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, rating, comment")
    .eq("product_id", id)
    .order("id", { ascending: false });

  return {
    props: {
      product: normalizedProduct,
      similarProducts,
      reviews: reviews ?? [],
    },
  };
}
