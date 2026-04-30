"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, Pencil, Trash2, ShieldCheck, Users, BookOpen, CreditCard } from "lucide-react";
import Tabs from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import Input, { Select } from "@/components/ui/Input";
import Badge from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";
import { useToast, ToastContainer } from "@/components/ui/Toast";

const TABS = [
  { value: "admin", label: "Admins",  icon: ShieldCheck },
  { value: "guide", label: "Guides",  icon: BookOpen },
  { value: "user",  label: "Members", icon: Users },
];

function subBadge(subs) {
  const active = subs?.find(s => s.status === "active");
  if (!active) return <Badge color="gray">No Plan</Badge>;
  return <Badge color="green">${active.tier}/mo</Badge>;
}

const TH = ({ children }) => (
  <th
    className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider"
    style={{ color: "var(--text-3)" }}
  >
    {children}
  </th>
);

export default function UsersManager({ stats }) {
  const [tab, setTab]           = useState("admin");
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState(null);
  const [editTarget, setEdit]   = useState(null);
  const [deleteTarget, setDel]  = useState(null);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [form, setForm]         = useState({ full_name: "", email: "", password: "", role: "user" });
  const { toasts, toast, dismiss } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/users?role=${tab}`);
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setForm({ full_name: "", email: "", password: "", role: tab });
    setError(""); setModal("create");
  }
  function openEdit(u) {
    setEdit(u);
    setForm({ full_name: u.full_name ?? "", email: u.email, password: "", role: u.role });
    setError(""); setModal("edit");
  }

  async function handleSave() {
    setSaving(true); setError("");
    const url    = modal === "create" ? "/api/admin/users" : `/api/admin/users/${editTarget.id}`;
    const method = modal === "create" ? "POST" : "PUT";
    const body   = modal === "create" ? form : { full_name: form.full_name, email: form.email, role: form.role };
    const res    = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data   = await res.json();
    if (!res.ok) { setError(data.error); setSaving(false); return; }
    const name = form.full_name || form.email;
    const roleLabel = { admin: "Admin", guide: "Guide", user: "Member" }[form.role] ?? form.role;
    setSaving(false); setModal(null); load();
    toast(modal === "create" ? `${roleLabel} "${name}" created` : `"${name}" updated`);
  }

  async function handleDelete() {
    const name = deleteTarget.full_name ?? deleteTarget.email;
    setSaving(true);
    await fetch(`/api/admin/users/${deleteTarget.id}`, { method: "DELETE" });
    setSaving(false); setDel(null); load();
    toast(`"${name}" removed`, "info");
  }

  const filtered = users.filter(u =>
    (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Admins"               value={stats.admins} icon={ShieldCheck} color="blue"   />
        <StatCard label="Guides"               value={stats.guides} icon={BookOpen}    color="purple" />
        <StatCard label="Members"              value={stats.users}  icon={Users}       color="teal"   />
        <StatCard label="Active Subscriptions" value={stats.subs}   icon={CreditCard}  color="amber"  />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between flex-wrap">
        <Tabs tabs={TABS} active={tab} onChange={v => { setTab(v); setSearch(""); }} />
        <Button onClick={openCreate} size="sm">
          <Plus size={13} />
          {tab === "admin" ? "New Admin" : tab === "guide" ? "New Guide" : "New Member"}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-3)" }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="w-full rounded-xl py-2.5 pl-9 pr-4 text-sm focus:outline-none transition-all"
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          onFocus={e => { e.target.style.borderColor = "var(--blue)"; e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)"; }}
          onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
        />
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
        {loading ? <PageSpinner /> : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description="Try a different search or create a new user."
            action={<Button size="sm" onClick={openCreate}><Plus size={13} /> Add User</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg)" }}>
                <tr>
                  <TH>Name</TH>
                  <TH>Email</TH>
                  <TH>Role</TH>
                  {tab === "user"  && <TH>Subscription</TH>}
                  {tab !== "admin" && <TH>KarmaCoins</TH>}
                  <TH>Joined</TH>
                  <TH>Actions</TH>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.map(u => (
                    <motion.tr
                      key={u.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="group transition-colors hover:bg-[color:var(--raised)]"
                      style={{ borderBottom: "1px solid var(--border-sub)" }}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                            style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
                          >
                            {(u.full_name ?? u.email)?.[0]?.toUpperCase()}
                          </div>
                          <span className="font-medium" style={{ color: "var(--text)" }}>{u.full_name ?? "—"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm" style={{ color: "var(--text-2)" }}>{u.email}</td>
                      <td className="px-5 py-3.5">
                        <Badge color={u.role === "admin" ? "blue" : u.role === "guide" ? "purple" : "gray"}>
                          {u.role}
                        </Badge>
                      </td>
                      {tab === "user"  && <td className="px-5 py-3.5">{subBadge(u.subscriptions)}</td>}
                      {tab !== "admin" && (
                        <td className="px-5 py-3.5 font-semibold text-sm" style={{ color: "var(--yellow)" }}>
                          {u.karma_coins ?? 0}
                        </td>
                      )}
                      <td className="px-5 py-3.5 text-xs" style={{ color: "var(--text-3)" }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEdit(u)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-[color:var(--blue-bg)]"
                            style={{ color: "var(--text-3)" }}
                            onMouseEnter={e => e.currentTarget.style.color = "var(--blue-light)"}
                            onMouseLeave={e => e.currentTarget.style.color = "var(--text-3)"}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => setDel(u)}
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
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={!!modal} onClose={() => setModal(null)} title={modal === "create" ? `Create ${form.role}` : "Edit User"}>
        <div className="space-y-4">
          <Input label="Full Name" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Jane Doe" />
          <Input label="Email" required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="jane@example.com" />
          {modal === "create" && (
            <Input label="Password" required type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 8 characters" />
          )}
          <Select label="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="admin">Admin</option>
            <option value="guide">Guide</option>
            <option value="user">Member</option>
          </Select>
          {error && (
            <p className="text-sm rounded-xl px-4 py-3" style={{ backgroundColor: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" }}>
              {error}
            </p>
          )}
          <div className="flex gap-3 pt-1">
            <Button variant="secondary" className="flex-1" onClick={() => setModal(null)} disabled={saving}>Cancel</Button>
            <Button className="flex-1" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDel(null)}
        onConfirm={handleDelete}
        loading={saving}
        title="Delete User"
        message={`Permanently delete ${deleteTarget?.full_name ?? deleteTarget?.email}? This cannot be undone.`}
      />
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
