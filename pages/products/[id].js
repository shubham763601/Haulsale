// pages/products/[id].js
import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { supabase } from "../../lib/supabaseClient";
import NavBar from "../../components/NavBar";
import ProductCard from "../../components/ProductCard";
import { useCart } from "../../context/CartContext";

// ---------- helpers ----------
function makePublicUrl(path) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!path || !baseUrl) return null;
  if (path.startsWith("http")) return path;
  return `${baseUrl}/storage/v1/object/public/public-assets/${path}`;
}

// ---------- page component ----------
export default function ProductPage({ product, similarProducts, reviews }) {
  const router = useRouter();
  const { addItem } = useCart();

  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  const imageUrl = product.imageUrl || makePublicUrl(product.imagePath);

  function buildCartItem(quantity) {
    return {
      product_id: product.id,
      variant_id: null,
      title: product.title,
      price: product.price,
      mrp: product.mrp,
      imageUrl,
      qty: quantity,
      seller_id: product.seller_id || null,
      stock: product.stock ?? null,
    };
  }

  function handleAddToCart() {
    if (adding) return;
    addItem(buildCartItem(qty));
    setAdding(true);
    setTimeout(() => setAdding(false), 500); // small animation window
  }

  async function handleBuyNow() {
    if (buying) return;
    setBuying(true);
    addItem(buildCartItem(qty));
    // short delay so user sees the state change, then go to cart
    setTimeout(() => {
      router.push("/cart");
    }, 200);
  }

  const hasDiscount =
    typeof product.mrp === "number" &&
    product.mrp > 0 &&
    product.mrp > product.price;

  const offPct = hasDiscount
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : null;

  return (
    <>
      <Head>
        <title>{product.title} – Haullcell</title>
      </Head>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        <NavBar />

        <main className="flex-1 mx-auto max-w-6xl px-4 py-6">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* IMAGE PANEL */}
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

            {/* INFO PANEL */}
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

                {hasDiscount && (
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <span className="text-slate-400 line-through">
                      ₹{product.mrp.toFixed(2)}
                    </span>
                    <span className="text-emerald-600 font-medium">
                      {offPct}% off
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
                  className="px-3 py-1 border rounded-md bg-white hover:bg-slate-50"
                  onClick={() => qty > 1 && setQty(qty - 1)}
                >
                  –
                </button>
                <div className="px-4 py-1 bg-white border rounded-md text-sm">
                  {qty}
                </div>
                <button
                  className="px-3 py-1 border rounded-md bg-white hover:bg-slate-50"
                  onClick={() => setQty(qty + 1)}
                >
                  +
                </button>
              </div>

              {/* CTA buttons */}
              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <button
                  className={`flex-1 rounded-lg py-3 font-semibold text-white shadow transition-all ${
                    adding
                      ? "bg-emerald-600 scale-[0.98]"
                      : "bg-indigo-600 hover:bg-indigo-500"
                  }`}
                  onClick={handleAddToCart}
                >
                  {adding ? "Added ✓" : "Add to Cart"}
                </button>

                <button
                  className={`flex-1 rounded-lg py-3 font-semibold border shadow-sm transition-all ${
                    buying
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-900 hover:bg-slate-900 hover:text-white"
                  }`}
                  onClick={handleBuyNow}
                >
                  {buying ? "Going to cart…" : "Buy Now"}
                </button>
              </div>

              {/* Description */}
              <div className="mt-8">
                <h3 className="font-medium text-slate-900">Product Details</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {product.description || "No description available."}
                </p>
              </div>
            </div>
          </div>

          {/* Similar Products (same category) */}
          {similarProducts.length > 0 && (
            <section className="mt-12">
              <h2 className="text-lg font-semibold text-slate-900 mb-3">
                Similar products in this category
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

            {(!reviews || reviews.length === 0) && (
              <p className="text-sm text-slate-500">No reviews yet.</p>
            )}

            {reviews &&
              reviews.map((r) => (
                <div key={r.id} className="border-b py-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-yellow-500 font-semibold">
                      ★ {r.rating?.toFixed ? r.rating.toFixed(1) : r.rating}
                    </span>
                    {r.created_at && (
                      <span className="text-[11px] text-slate-400">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {r.comment || ""}
                  </p>
                </div>
              ))}
          </section>
        </main>
      </div>
    </>
  );
}

// ---------- server side ----------
export async function getServerSideProps(ctx) {
  const id = ctx.params.id;
  const productId = Number(id); // ensure numeric for eq on int column

  const query = `
    id, title, price, mrp, rating, rating_count, description,
    category_id,
    product_variants ( price, stock ),
    product_images ( storage_path ),
    seller_id,
    is_active,
    approved
  `;

  // Main product: only show to public if approved & active
  const { data: product, error: prodErr } = await supabase
    .from("products")
    .select(query)
    .eq("id", productId)
    .eq("approved", true)
    .eq("is_active", true)
    .maybeSingle();

  if (prodErr || !product) {
    console.error("product detail error", prodErr);
    return { notFound: true };
  }

  const firstImage = product.product_images?.[0] ?? null;
  const firstVariant = product.product_variants?.[0] ?? null;

  const normalizedProduct = {
    id: product.id,
    title: product.title,
    description: product.description,
    category_id: product.category_id,
    price: firstVariant?.price ?? product.price ?? 0,
    stock: firstVariant?.stock ?? null,
    mrp: product.mrp ?? null,
    rating: product.rating ?? null,
    rating_count: product.rating_count ?? 0,
    imagePath: firstImage?.storage_path ?? null,
    imageUrl: makePublicUrl(firstImage?.storage_path ?? null),
    seller_id: product.seller_id ?? null,
  };

  // Similar products in same category (public only)
  const { data: similar, error: simErr } = await supabase
    .from('products')
    .select(query)
    .eq('category_id', product.category_id)
    .neq('id', productId)
    .eq('approved', true)
    .eq('is_active', true)
    .limit(10);

  if (simErr) {
    console.error('similar products error', simErr);
  }

  const similarProducts =
    similar?.map((p) => {
      const v = p.product_variants?.[0] ?? null;
      const img = p.product_images?.[0] ?? null;
      return {
        id: p.id,
        title: p.title,
        description: p.description,
        category_id: p.category_id,
        price: v?.price ?? p.price ?? 0,
        stock: v?.stock ?? null,
        mrp: p.mrp ?? null,
        rating: p.rating ?? null,
        rating_count: p.rating_count ?? 0,
        imagePath: img?.storage_path ?? null,
      };
    }) ?? [];

  // Reviews (public)
  const { data: reviews, error: reviewsErr } = await supabase
    .from("reviews")
    .select("id, rating, comment, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (reviewsErr) {
    console.error("reviews query error", reviewsErr);
  }

  return {
    props: {
      product: normalizedProduct,
      similarProducts,
      reviews: reviews ?? [],
    },
  };
}
