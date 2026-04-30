import { clsx } from "clsx";

export default function Card({ children, className }) {
  return (
    <div
      className={clsx("rounded-2xl", className)}
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
    >
      {children}
    </div>
  );
}

const iconColors = {
  blue:   { backgroundColor: "var(--blue-bg)",    color: "var(--blue-light)" },
  purple: { backgroundColor: "var(--purple-bg)",  color: "var(--purple)" },
  amber:  { backgroundColor: "var(--yellow-bg)",  color: "var(--yellow)" },
  teal:   { backgroundColor: "var(--teal-bg)",    color: "var(--teal)" },
  green:  { backgroundColor: "var(--green-bg)",   color: "var(--green)" },
  red:    { backgroundColor: "var(--red-bg)",     color: "var(--red)" },
};

export function StatCard({ label, value, icon: Icon, color = "blue" }) {
  const ic = iconColors[color] ?? iconColors.blue;
  return (
    <div
      className="rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-[color:var(--hover)]"
      style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="rounded-xl p-3 flex-shrink-0" style={ic}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold" style={{ color: "var(--text)" }}>{value}</p>
        <p className="text-sm truncate mt-0.5" style={{ color: "var(--text-3)" }}>{label}</p>
      </div>
    </div>
  );
}
