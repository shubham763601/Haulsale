// pages/products/[id].js
import { useState } from "react";
import Head from "next/head";
import { supabase } from "../../lib/supabaseClient";
import NavBar from "../../components/NavBar";
import ProductCard from "../../components/ProductCard";
import { useCart } from "../../context/CartContext"; // 🔥 FIXED

function makePublicUrl(path) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !baseUrl) return null;
  if (path.startsWith("http")) return path;
  return `${baseUrl}/storage/v1/object/public/public-assets/${path}`;
}

export default function ProductPage({ product, similarProducts, reviews }) {
  const [qty, setQty] = useState(1);
  const { addItem } = useCart(); // 🔥 Valid now

  const imageUrl = product.imageUrl || makePublicUrl(product.imagePath);

  function handleAddToCart() {
    addItem({
      product_id: product.id,
      variant_id: null,
      title: product.title,
      price: product.price,
      mrp: product.mrp,
      imageUrl,
      qty,
      seller_id: product.seller_id || null,
      stock: product.stock ?? null,
    });
    alert("Added to cart!");
  }

  return (
    <>
      <Head>
        <title>{product.title} – Haullcell</title>
      </Head>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        <NavBar />

        <main className="flex-1 mx-auto max-w-6xl px-4 py-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* IMAGE */}
            <div className="rounded-2xl bg-white border shadow-sm p-4 flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.title}
                  className="max-w-full max-h-[420px] object-contain"
                />
              ) : (
                <div className="text-slate-400 text-sm">No image</div>
              )}
            </div>

            {/* PRODUCT INFO */}
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                {product.title}
              </h1>

              {/* Rating */}
              {product.rating_count > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-emerald-600 text-white text-xs font-medium">
                    {product.rating.toFixed(1)} ★
                  </span>
                  <span className="text-xs text-slate-600">
                    ({product.rating_count} reviews)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className="mt-4">
                <div className="text-2xl font-semibold text-emerald-600">
                  ₹{product.price.toFixed(2)}
                </div>

                {product.mrp > product.price && (
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <span className="text-slate-400 line-through">
                      ₹{product.mrp.toFixed(2)}
                    </span>
                    <span className="text-emerald-600 font-medium">
                      {Math.round(
                        ((product.mrp - product.price) / product.mrp) * 100
                      )}
                      % off
                    </span>
                  </div>
                )}
              </div>

              {/* Stock */}
              <p className="text-sm text-slate-600 mt-1">
                Stock: {product.stock ?? "N/A"}
              </p>

              {/* Quantity Selector */}
              <div className="mt-4 flex items-center gap-3">
                <button
                  className="px-3 py-1 border rounded-md"
                  onClick={() => qty > 1 && setQty(qty - 1)}
                >
                  –
                </button>
                <div className="px-4 py-1 bg-white border rounded-md">
                  {qty}
                </div>
                <button
                  className="px-3 py-1 border rounded-md"
                  onClick={() => setQty(qty + 1)}
                >
                  +
                </button>
              </div>

              {/* Add to Cart */}
              <button
                className="mt-5 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-semibold shadow"
                onClick={handleAddToCart}
              >
                Add to Cart
              </button>

              {/* Description */}
              <div className="mt-8">
                <h3 className="font-medium text-slate-900">Product Details</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {product.description || "No description available."}
                </p>
              </div>
            </div>
          </div>

          {/* Similar Products */}
          {similarProducts.length > 0 && (
            <section className="mt-12">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                Similar Products
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {similarProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}

          {/* Reviews */}
          <section className="mt-12 pb-12">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">
              Customer Reviews
            </h2>

            {!reviews.length && (
              <p className="text-sm text-slate-500">No reviews yet.</p>
            )}

            {reviews.map((r) => (
              <div key={r.id} className="border-b py-3">
                <div className="text-sm font-semibold text-yellow-500">
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

  const query = `
    id,title,price,mrp,rating,rating_count,description,
    category_id,
    product_variants(price,stock),
    product_images(storage_path)
  `;

  const { data: product } = await supabase
    .from("products")
    .select(query)
    .eq("id", id)
    .single();

  if (!product) {
    return { notFound: true };
  }

  const firstImage = product.product_images?.[0] ?? null;
  const firstVariant = product.product_variants?.[0] ?? null;

  const normalizedProduct = {
    ...product,
    price: firstVariant?.price ?? product.price,
    stock: firstVariant?.stock ?? null,
    imagePath: firstImage?.storage_path ?? null,
  };

  const { data: similar } = await supabase
    .from("products")
    .select(query)
    .eq("category_id", product.category_id)
    .neq("id", id)
    .limit(10);

  const similarProducts = (similar ?? []).map((p) => ({
    ...p,
    price: p.product_variants?.[0]?.price ?? p.price,
    imagePath: p.product_images?.[0]?.storage_path ?? null,
  }));

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id,rating,comment")
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
