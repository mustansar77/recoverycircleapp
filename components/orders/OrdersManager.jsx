"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, ClipboardList, Coins, ImageOff } from "lucide-react";
import Tabs from "@/components/ui/Tabs";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import { PageSpinner } from "@/components/ui/Spinner";

const STATUS_TABS = [
  { value: "all",       label: "All" },
  { value: "pending",   label: "Pending" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLOR = { pending: "yellow", completed: "green", cancelled: "red" };

function groupByUser(orders) {
  return orders.reduce((acc, o) => {
    const key = o.profiles?.email ?? o.user_id;
    if (!acc[key]) acc[key] = { profile: o.profiles, orders: [] };
    acc[key].orders.push(o);
    return acc;
  }, {});
}

function OrderRow({ order, onStatusChange }) {
  const [updating, setUpdating] = useState(false);

  async function changeStatus(status) {
    setUpdating(true);
    await fetch(`/api/orders/${order.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdating(false);
    onStatusChange();
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: "var(--raised)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-mono text-xs" style={{ color: "var(--text-3)" }}>#{order.id.slice(0, 8)}</span>
          <span style={{ color: "var(--text-2)" }}>{new Date(order.created_at).toLocaleDateString()}</span>
          <div className="flex items-center gap-1 font-semibold" style={{ color: "var(--yellow)" }}>
            <Coins size={13} />{order.total_coins} KC
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge color={STATUS_COLOR[order.status]}>{order.status}</Badge>
          {order.status === "pending" && (
            <div className="flex gap-1.5">
              <button
                onClick={() => changeStatus("completed")}
                disabled={updating}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold transition-all disabled:opacity-50 hover:brightness-110"
                style={{ backgroundColor: "var(--green-bg)", color: "var(--green)", border: "1px solid var(--green-border)" }}
              >
                Complete
              </button>
              <button
                onClick={() => changeStatus("cancelled")}
                disabled={updating}
                className="rounded-lg px-2.5 py-1 text-xs font-semibold transition-all disabled:opacity-50 hover:brightness-110"
                style={{ backgroundColor: "var(--red-bg)", color: "var(--red)", border: "1px solid var(--red-border)" }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {order.order_items?.length > 0 && (
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-sub)" }}>
          {order.order_items.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3"
              style={{ borderBottom: "1px solid var(--border-sub)" }}
            >
              <div
                className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center"
                style={{ backgroundColor: "var(--bg)" }}
              >
                {item.products?.image_url
                  ? <img src={item.products.image_url} alt="" className="h-full w-full object-cover" />
                  : <ImageOff size={13} style={{ color: "var(--border)" }} />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>
                  {item.products?.title ?? "Unknown"}
                </p>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>× {item.quantity}</p>
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold flex-shrink-0" style={{ color: "var(--yellow)" }}>
                <Coins size={12} />{item.price_coins * item.quantity}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserAccordion({ email, profile, orders, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const total = orders.reduce((s, o) => s + o.total_coins, 0);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-[color:var(--raised)]"
        style={{ borderBottom: open ? "1px solid var(--border)" : "none" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #3b82f6, #2563eb)" }}
          >
            {(profile?.full_name ?? email)?.[0]?.toUpperCase()}
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              {profile?.full_name ?? email}
            </p>
            <p className="text-xs" style={{ color: "var(--text-3)" }}>{email}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: "var(--raised)", color: "var(--text-3)", border: "1px solid var(--border)" }}
          >
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--yellow)" }}>
            <Coins size={13} />{total}
          </div>
          {open
            ? <ChevronDown size={15} style={{ color: "var(--text-3)" }} />
            : <ChevronRight size={15} style={{ color: "var(--text-3)" }} />
          }
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {orders.map(o => (
                <OrderRow key={o.id} order={o} onStatusChange={onStatusChange} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function OrdersManager() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus]   = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/orders");
    setOrders(await res.json());
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = status === "all" ? orders : orders.filter(o => o.status === status);
  const grouped  = groupByUser(filtered);
  const keys     = Object.keys(grouped);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Orders</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Manage and fulfil store orders</p>
      </div>
      <Tabs tabs={STATUS_TABS} active={status} onChange={setStatus} />
      {loading ? <PageSpinner /> : keys.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No orders found"
          description="Orders will appear here once users make purchases."
        />
      ) : (
        <div className="space-y-3">
          {keys.map(email => (
            <UserAccordion
              key={email}
              email={email}
              profile={grouped[email].profile}
              orders={grouped[email].orders}
              onStatusChange={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}
