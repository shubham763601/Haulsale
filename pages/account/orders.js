// pages/account/orders.js
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useRouter } from "next/router";
import NavBar from "../../components/NavBar";

export default function OrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load current user
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user;
      setUser(u);
      if (!u) router.push("/auth/login");
      else loadOrders(u.id);
    });
  }, []);

  async function loadOrders(uid) {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          status,
          total,
          created_at,
          order_items (
            id,
            quantity,
            price,
            product_id,
            variant_id,
            product_variants (
              id,
              sku
            ),
            products:product_id (
              title
            )
          )
        `)
        .eq("buyer_id", uid)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (e) {
      console.error("load orders error", e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <>
      <NavBar />
      <main className="p-8 text-white">Loading orders...</main>
    </>
  );

  return (
    <>
      <NavBar />
      <main className="min-h-screen p-8 bg-gray-900 text-white">
        <section className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">My Orders</h1>

          {orders.length === 0 ? (
            <p>You haven't placed any orders yet.</p>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div key={order.id} className="bg-white/5 p-6 rounded-lg border border-white/10">
                  <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-semibold">Order #{order.id.slice(0, 8)}</h2>
                    <span className="px-3 py-1 rounded bg-indigo-600 text-sm">{order.status}</span>
                  </div>

                  <p className="text-gray-300 mb-2">
                    Placed on: {new Date(order.created_at).toLocaleString()}
                  </p>

                  <div className="mt-4 space-y-4">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="bg-white/10 p-3 rounded">
                        <p className="font-medium">{item.products?.title ?? "Product"}</p>
                        <p className="text-sm text-gray-300">
                          Qty: {item.quantity} × ₹{item.price}
                        </p>
                        <p className="text-sm text-gray-400">
                          Variant: {item.product_variants?.sku ?? item.variant_id}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 text-lg font-bold">
                    Total: ₹{Number(order.total).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
