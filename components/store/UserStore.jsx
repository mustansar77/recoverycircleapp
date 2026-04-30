"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Coins, ImageOff, ShoppingCart, Check, MapPin, User } from "lucide-react";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";

export default function UserStore({ initialBalance }) {
  const [products, setProducts]     = useState([]);
  const [cats, setCats]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [catFilter, setCatFilter]   = useState("all");
  const [balance, setBalance]       = useState(initialBalance ?? 0);
  const [cart, setCart]             = useState({});
  const [checkoutModal, setCheckout] = useState(false);
  const [purchasing, setPurchasing]  = useState(false);
  const [success, setSuccess]        = useState(false);
  const [error, setError]            = useState("");
  const [delivery, setDelivery]      = useState({ full_name: "", address: "", postal_code: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const [pR, cR] = await Promise.all([fetch("/api/store/products"), fetch("/api/store/categories")]);
    setProducts(await pR.json());
    setCats(await cR.json());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered  = products.filter(p => p.is_active && (catFilter === "all" || p.categories?.id === catFilter));
  const cartItems = Object.entries(cart).filter(([, q]) => q > 0);
  const cartTotal = cartItems.reduce((s, [pid, q]) => s + (products.find(x => x.id === pid)?.price_coins ?? 0) * q, 0);
  const cartCount = cartItems.reduce((s, [, q]) => s + q, 0);

  function addToCart(pid)    { setCart(c => ({ ...c, [pid]: (c[pid] ?? 0) + 1 })); }
  function removeFromCart(pid) {
    setCart(c => {
      const n = { ...c };
      n[pid] > 1 ? n[pid]-- : delete n[pid];
      return n;
    });
  }

  async function handlePurchase() {
    if (!delivery.full_name || !delivery.address || !delivery.postal_code) {
      setError("Please fill in your full name, delivery address and postal code."); return;
    }
    setPurchasing(true); setError("");
    const items = cartItems.map(([product_id, quantity]) => ({ product_id, quantity }));
    const res   = await fetch("/api/store/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, delivery }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setPurchasing(false); return; }
    setBalance(b => b - cartTotal);
    setCart({});
    setDelivery({ full_name: "", address: "", postal_code: "" });
    setSuccess(true);
    setTimeout(() => { setSuccess(false); setCheckout(false); }, 2500);
    setPurchasing(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Store</h1>
          <div className="flex items-center gap-1.5 mt-1 text-sm font-semibold" style={{ color: "var(--yellow)" }}>
            <Coins size={14} /> {balance} KarmaCoins available
          </div>
        </div>
        {cartCount > 0 && (
          <Button onClick={() => setCheckout(true)}>
            <ShoppingCart size={14} />
            Checkout ({cartCount}) · {cartTotal} KC
          </Button>
        )}
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {[{ id: "all", name: "All" }, ...cats.map(c => ({ id: c.id, name: c.name }))].map(({ id, name }) => {
          const active = catFilter === id;
          return (
            <button
              key={id}
              onClick={() => setCatFilter(id)}
              className="rounded-full px-4 py-1.5 text-xs font-medium transition-all"
              style={
                active
                  ? { background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff" }
                  : {
                      backgroundColor: "var(--card)",
                      color: "var(--text-2)",
                      border: "1px solid var(--border)",
                    }
              }
              onMouseEnter={e => { if (!active) { e.currentTarget.style.backgroundColor = "var(--raised)"; e.currentTarget.style.color = "var(--text)"; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.backgroundColor = "var(--card)"; e.currentTarget.style.color = "var(--text-2)"; } }}
            >
              {name}
            </button>
          );
        })}
      </div>

      {/* Products grid */}
      {loading ? <PageSpinner /> : filtered.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No products available"
          description="Check back soon for new items."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {filtered.map(p => {
              const qty = cart[p.id] ?? 0;
              const oos = p.stock === 0;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl overflow-hidden flex flex-col transition-all hover:-translate-y-0.5"
                  style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = "var(--blue-border)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
                >
                  {/* Image */}
                  <div className="h-44 flex items-center justify-center overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
                    {p.image_url
                      ? <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
                      : <ImageOff size={28} style={{ color: "var(--border)" }} />
                    }
                  </div>

                  {/* Details */}
                  <div className="p-4 flex flex-col flex-1 gap-2">
                    {p.categories && (
                      <Badge color="blue" className="self-start">{p.categories.name}</Badge>
                    )}
                    <h3 className="font-semibold" style={{ color: "var(--text)" }}>{p.title}</h3>
                    <p className="text-xs flex-1 line-clamp-2 leading-relaxed" style={{ color: "var(--text-3)" }}>
                      {p.description}
                    </p>

                    <div
                      className="flex items-center justify-between mt-auto pt-3"
                      style={{ borderTop: "1px solid var(--border-sub)" }}
                    >
                      <div className="flex items-center gap-1 font-bold text-lg" style={{ color: "var(--yellow)" }}>
                        <Coins size={15} />{p.price_coins}
                      </div>

                      {oos ? (
                        <Badge color="gray">Out of stock</Badge>
                      ) : qty === 0 ? (
                        <Button size="sm" onClick={() => addToCart(p.id)}>Add to cart</Button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => removeFromCart(p.id)}
                            className="h-7 w-7 rounded-full text-sm font-bold transition-all flex items-center justify-center hover:brightness-110"
                            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
                          >
                            −
                          </button>
                          <span className="w-5 text-center text-sm font-semibold" style={{ color: "var(--text)" }}>
                            {qty}
                          </span>
                          <button
                            onClick={() => addToCart(p.id)}
                            className="h-7 w-7 rounded-full text-sm font-bold transition-all flex items-center justify-center hover:brightness-110"
                            style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff" }}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Checkout Modal */}
      <Modal
        open={checkoutModal}
        onClose={() => { if (!purchasing) setCheckout(false); }}
        title="Checkout"
        maxWidth="max-w-md"
      >
        {success ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "var(--green-bg)", border: "1px solid var(--green-border)" }}
            >
              <Check size={28} style={{ color: "var(--green)" }} />
            </div>
            <div>
              <p className="font-semibold" style={{ color: "var(--text)" }}>Purchase successful!</p>
              <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Your order has been placed.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart items */}
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {cartItems.map(([pid, qty]) => {
                const p = products.find(x => x.id === pid);
                if (!p) return null;
                return (
                  <div
                    key={pid}
                    className="flex items-center justify-between p-3"
                    style={{ borderBottom: "1px solid var(--border-sub)" }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{p.title}</p>
                      <p className="text-xs" style={{ color: "var(--text-3)" }}>× {qty}</p>
                    </div>
                    <div className="flex items-center gap-1 font-semibold" style={{ color: "var(--yellow)" }}>
                      <Coins size={13} />{p.price_coins * qty}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ backgroundColor: "var(--yellow-bg)", border: "1px solid var(--yellow-border)" }}
            >
              <span className="font-semibold" style={{ color: "var(--text)" }}>Total</span>
              <div className="flex items-center gap-1 font-bold text-lg" style={{ color: "var(--yellow)" }}>
                <Coins size={16} />{cartTotal} KC
              </div>
            </div>

            {/* Delivery details */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2">
                <MapPin size={14} style={{ color: "var(--text-3)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>Delivery Details</p>
              </div>
              {[
                { key: "full_name",   label: "Full Name",       placeholder: "John Doe",          icon: User },
                { key: "address",     label: "Delivery Address",placeholder: "123 Main St, City", icon: MapPin },
                { key: "postal_code", label: "Postal Code",     placeholder: "12345",             icon: MapPin },
              ].map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-2)" }}>{label} <span style={{ color: "var(--red)" }}>*</span></label>
                  <input
                    type="text"
                    value={delivery[key]}
                    onChange={e => setDelivery(d => ({ ...d, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                    onFocus={e  => { e.currentTarget.style.borderColor = "var(--blue)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)"; }}
                    onBlur={e   => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>
              ))}
            </div>

            {/* Insufficient funds warning */}
            {balance < cartTotal && (
              <p
                className="text-sm rounded-xl px-4 py-3"
                style={{ backgroundColor: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" }}
              >
                Insufficient KarmaCoins. You have {balance}, need {cartTotal}.
              </p>
            )}

            {error && (
              <p
                className="text-sm rounded-xl px-4 py-3"
                style={{ backgroundColor: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" }}
              >
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => setCheckout(false)} disabled={purchasing}>
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handlePurchase}
                disabled={purchasing || balance < cartTotal}
              >
                {purchasing ? "Processing…" : "Confirm Purchase"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
