import { clsx } from "clsx";

export default function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={clsx("flex flex-col items-center justify-center py-16 text-center px-6", className)}>
      {Icon && (
        <div
          className="mb-5 rounded-2xl p-5"
          style={{ backgroundColor: "var(--raised)", border: "1px solid var(--border)" }}
        >
          <Icon size={26} style={{ color: "var(--text-3)" }} />
        </div>
      )}
      <p className="text-base font-semibold" style={{ color: "var(--text)" }}>
        {title}
      </p>
      {description && (
        <p className="mt-2 text-sm max-w-xs leading-relaxed" style={{ color: "var(--text-3)" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
