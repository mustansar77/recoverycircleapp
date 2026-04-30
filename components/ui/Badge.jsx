import { clsx } from "clsx";

const styles = {
  green:  { backgroundColor: "var(--green-bg)",  color: "var(--green)",  border: "1px solid var(--green-border)" },
  red:    { backgroundColor: "var(--red-bg)",    color: "var(--red)",    border: "1px solid var(--red-border)" },
  yellow: { backgroundColor: "var(--yellow-bg)", color: "var(--yellow)", border: "1px solid var(--yellow-border)" },
  blue:   { backgroundColor: "var(--blue-bg)",   color: "var(--blue-light)", border: "1px solid var(--blue-border)" },
  gray:   { backgroundColor: "var(--raised)",    color: "var(--text-3)", border: "1px solid var(--border)" },
  purple: { backgroundColor: "var(--purple-bg)", color: "var(--purple)", border: "1px solid var(--purple-border)" },
  teal:   { backgroundColor: "var(--teal-bg)",   color: "var(--teal)",   border: "1px solid var(--teal-border)" },
};

export default function Badge({ children, color = "gray", className }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        className
      )}
      style={styles[color] ?? styles.gray}
    >
      {children}
    </span>
  );
}
