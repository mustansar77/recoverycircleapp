"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, Tag, ShoppingBag, Coins, ImageOff } from "lucide-react";
import Tabs from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Input, { Textarea, Select } from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { useToast, ToastContainer } from "@/components/ui/Toast";

const TABS = [
  { value: "categories", label: "Categories", icon: Tag },
  { value: "products",   label: "Products",   icon: ShoppingBag },
];

const TH = ({ children }) => (
  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
    {children}
  </th>
);

// ---------- CATEGORIES ----------
function CategoriesPanel({ toast }) {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [modal, setModal]     = useState(false);
  const [target, setTarget]   = useState(null);
  const [del, setDel]         = useState(null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm]       = useState({ name: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/store/categories");
    setRows(await r.json());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm({ name: "", description: "" }); setError(""); setTarget(null); setModal(true); }
  function openEdit(r)   { setForm({ name: r.name, description: r.description ?? "" }); setError(""); setTarget(r); setModal(true); }

  async function handleSave() {
    setSaving(true); setError("");
    const url = target ? `/api/store/categories/${target.id}` : "/api/store/categories";
    const res = await fetch(url, { method: target ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const d = await res.json();
    if (!res.ok) { setError(d.error); setSaving(false); return; }
    setSaving(false); setModal(false); load();
    toast(target ? `Category "${form.name}" updated` : `Category "${form.name}" created`);
  }

  async function handleDelete() {
    const name = del.name;
    setSaving(true);
    await fetch(`/api/store/categories/${del.id}`, { method: "DELETE" });
    setSaving(false); setDel(null); load();
    toast(`Category "${name}" deleted`, "info");
  }

  const filtered = rows.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-3)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search categories…"
            className="w-full rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none transition-all"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
            onFocus={e => { e.target.style.borderColor = "var(--blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)"; }}
            onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
          />
        </div>
        <Button size="sm" onClick={openCreate}><Plus size={13} /> Add Category</Button>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        {loading ? <PageSpinner /> : filtered.length === 0 ? (
          <EmptyState icon={Tag} title="No categories yet" action={<Button size="sm" onClick={openCreate}><Plus size={13} />Add Category</Button>} />
        ) : (
          <table className="w-full text-sm">
            <thead style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg)" }}>
              <tr><TH>ID</TH><TH>Name</TH><TH>Description</TH><TH>Actions</TH></tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.map(r => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group transition-colors hover:bg-[color:var(--raised)]"
                    style={{ borderBottom: "1px solid var(--border-sub)" }}
                  >
                    <td className="px-5 py-3.5 text-xs font-mono" style={{ color: "var(--text-3)" }}>{r.id.slice(0, 8)}…</td>
                    <td className="px-5 py-3.5 font-medium" style={{ color: "var(--text)" }}>{r.name}</td>
                    <td className="px-5 py-3.5 max-w-xs truncate text-sm" style={{ color: "var(--text-2)" }}>{r.description ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(r)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[color:var(--blue-bg)]"
                          style={{ color: "var(--text-3)" }}
                          onMouseEnter={e => e.currentTarget.style.color = "var(--blue-light)"}
                          onMouseLeave={e => e.currentTarget.style.color = "var(--text-3)"}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDel(r)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[color:var(--red-bg)]"
                          style={{ color: "var(--text-3)" }}
                          onMouseEnter={e => e.currentTarget.style.color = "var(--red)"}
                          onMouseLeave={e => e.currentTarget.style.color = "var(--text-3)"}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={target ? "Edit Category" : "New Category"} maxWidth="max-w-md">
        <div className="space-y-4">
          <Input label="Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Wellness" />
          <Textarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Short description…" />
          {error && <p className="text-sm rounded-xl px-4 py-3" style={{ backgroundColor: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" }}>{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)} disabled={saving}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </Modal>
      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={handleDelete} loading={saving}
        title="Delete Category" message={`Delete category "${del?.name}"? This cannot be undone.`} />
    </div>
  );
}

// ---------- PRODUCTS ----------
function ProductsPanel({ toast }) {
  const [rows, setRows]       = useState([]);
  const [cats, setCats]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [modal, setModal]     = useState(false);
  const [target, setTarget]   = useState(null);
  const [del, setDel]         = useState(null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");
  const empty = { title: "", description: "", price_coins: "", category_id: "", image_url: "", stock: "0" };
  const [form, setForm]       = useState(empty);

  const load = useCallback(async () => {
    setLoading(true);
    const [pR, cR] = await Promise.all([fetch("/api/store/products"), fetch("/api/store/categories")]);
    setRows(await pR.json()); setCats(await cR.json()); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openCreate() { setForm(empty); setError(""); setTarget(null); setModal(true); }
  function openEdit(p) {
    setForm({
      title: p.title,
      description: p.description ?? "",
      price_coins: String(p.price_coins),
      category_id: p.categories?.id ?? "",
      image_url: p.image_url ?? "",
      stock: String(p.stock),
    });
    setError(""); setTarget(p); setModal(true);
  }

  async function handleSave() {
    setSaving(true); setError("");
    const url = target ? `/api/store/products/${target.id}` : "/api/store/products";
    const res = await fetch(url, {
      method: target ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price_coins: Number(form.price_coins), stock: Number(form.stock) }),
    });
    const d = await res.json();
    if (!res.ok) { setError(d.error); setSaving(false); return; }
    setSaving(false); setModal(false); load();
    toast(target ? `"${form.title}" updated` : `"${form.title}" added to store`);
  }

  async function handleDelete() {
    const title = del.title;
    setSaving(true);
    await fetch(`/api/store/products/${del.id}`, { method: "DELETE" });
    setSaving(false); setDel(null); load();
    toast(`"${title}" removed from store`, "info");
  }

  const filtered = rows.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    (r.categories?.name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-3)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products…"
            className="w-full rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none transition-all"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }}
            onFocus={e => { e.target.style.borderColor = "var(--blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)"; }}
            onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
          />
        </div>
        <Button size="sm" onClick={openCreate}><Plus size={13} /> Add Product</Button>
      </div>

      {loading ? <PageSpinner /> : filtered.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="No products yet" action={<Button size="sm" onClick={openCreate}><Plus size={13} />Add Product</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <AnimatePresence>
            {filtered.map(p => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl overflow-hidden flex flex-col group transition-all hover:-translate-y-0.5"
                style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = "var(--blue-border)"}
                onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
              >
                <div className="h-40 flex items-center justify-center overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
                  {p.image_url
                    ? <img src={p.image_url} alt={p.title} className="h-full w-full object-cover" />
                    : <ImageOff size={24} style={{ color: "var(--border)" }} />
                  }
                </div>
                <div className="p-4 flex flex-col flex-1 gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-snug" style={{ color: "var(--text)" }}>{p.title}</h3>
                    <Badge color={p.is_active ? "green" : "gray"}>{p.is_active ? "Live" : "Off"}</Badge>
                  </div>
                  {p.categories && <Badge color="blue" className="self-start">{p.categories.name}</Badge>}
                  <p className="text-xs flex-1 line-clamp-2" style={{ color: "var(--text-3)" }}>{p.description ?? "No description"}</p>
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid var(--border-sub)" }}>
                    <div className="flex items-center gap-1 font-bold text-sm" style={{ color: "var(--yellow)" }}>
                      <Coins size={13} />{p.price_coins} KC
                    </div>
                    <span className="text-xs" style={{ color: "var(--text-3)" }}>Stock: {p.stock}</span>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(p)}>
                      <Pencil size={12} /> Edit
                    </Button>
                    <button
                      onClick={() => setDel(p)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", color: "var(--text-3)" }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = "var(--red-bg)"; e.currentTarget.style.color = "var(--red)"; e.currentTarget.style.borderColor = "var(--red-border)"; }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = "var(--card)"; e.currentTarget.style.color = "var(--text-3)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={target ? "Edit Product" : "New Product"}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <Input label="Title" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Product title" />
          <Textarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description…" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Price (KarmaCoins)" required type="number" min="1" value={form.price_coins} onChange={e => setForm({ ...form, price_coins: e.target.value })} placeholder="20" />
            <Input label="Stock" type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" />
          </div>
          <Select label="Category" value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
            <option value="">— No category —</option>
            {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Input label="Image URL" type="url" value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" />
          {form.image_url && (
            <div className="rounded-xl overflow-hidden h-32" style={{ backgroundColor: "var(--bg)" }}>
              <img src={form.image_url} alt="Preview" className="h-full w-full object-cover" onError={e => e.target.style.display = "none"} />
            </div>
          )}
          {error && <p className="text-sm rounded-xl px-4 py-3" style={{ backgroundColor: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" }}>{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(false)} disabled={saving}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </Modal>
      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={handleDelete} loading={saving}
        title="Delete Product" message={`Delete "${del?.title}"? This action cannot be undone.`} />
    </div>
  );
}

export default function StoreManager() {
  const [tab, setTab] = useState("categories");
  const { toasts, toast, dismiss } = useToast();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Store Management</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Manage categories and products</p>
        </div>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>
      {tab === "categories" ? <CategoriesPanel toast={toast} /> : <ProductsPanel toast={toast} />}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
