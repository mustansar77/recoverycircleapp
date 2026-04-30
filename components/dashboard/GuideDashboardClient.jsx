"use client";

import { useState } from "react";
import { Video, Coins, CalendarCheck, Plus } from "lucide-react";
import { StatCard } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import BuyKarmaModal from "@/components/karma/BuyKarmaModal";

export default function GuideDashboardClient({ balance, totalHosted, upcomingCount }) {
  const [buyModal, setBuyModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Guide Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Your sessions and earnings</p>
        </div>
        <Button size="sm" onClick={() => setBuyModal(true)}>
          <Coins size={13} /> Buy KarmaCoins
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="KarmaCoins Balance" value={balance}       icon={Coins}         color="amber" />
        <StatCard label="Sessions Hosted"    value={totalHosted}   icon={CalendarCheck} color="teal"  />
        <StatCard label="Upcoming Sessions"  value={upcomingCount} icon={Video}         color="blue"  />
      </div>

      <BuyKarmaModal open={buyModal} onClose={() => setBuyModal(false)} />
    </div>
  );
}
