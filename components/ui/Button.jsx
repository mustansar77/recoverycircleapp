import { clsx } from "clsx";

const base =
  "inline-flex items-center justify-center font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:opacity-40 disabled:pointer-events-none select-none active:scale-[0.97]";

const sizes = {
  xs: "h-6 px-2 text-xs gap-1 rounded-md",
  sm: "h-8 px-3 text-xs gap-1.5 rounded-lg",
  md: "h-9 px-4 text-sm gap-2 rounded-xl",
  lg: "h-10 px-5 text-sm gap-2 rounded-xl",
};

const variants = {
  primary:
    "text-white shadow-md shadow-blue-900/30 hover:brightness-[1.08]",
  secondary:
    "text-[color:var(--text-2)] hover:text-[color:var(--text)] hover:bg-[color:var(--hover)]",
  danger:
    "hover:brightness-110",
  ghost:
    "text-[color:var(--text-3)] hover:text-[color:var(--text-2)] hover:bg-[color:var(--hover)]",
  success:
    "hover:brightness-110",
};

const variantStyle = {
  primary:   { background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
  secondary: { backgroundColor: "var(--raised)", border: "1px solid var(--border)" },
  danger:    { backgroundColor: "var(--red-bg)", border: "1px solid var(--red-border)", color: "var(--red)" },
  ghost:     {},
  success:   { backgroundColor: "var(--green-bg)", border: "1px solid var(--green-border)", color: "var(--green)" },
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  style,
  ...props
}) {
  return (
    <button
      className={clsx(base, sizes[size], variants[variant], className)}
      style={{ ...variantStyle[variant], ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
