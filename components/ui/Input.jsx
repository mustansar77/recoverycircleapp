import { clsx } from "clsx";

const fieldBase =
  "w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none";
const fieldStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  color: "var(--text)",
};
const errorStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--red-border)",
  color: "var(--text)",
};

function onFocus(e) {
  e.target.style.borderColor = "var(--blue)";
  e.target.style.boxShadow = "0 0 0 3px rgba(59,130,246,0.12)";
}
function onBlur(e) {
  const hasError = e.target.dataset.error === "true";
  e.target.style.borderColor = hasError ? "var(--red-border)" : "var(--border)";
  e.target.style.boxShadow = "none";
}

function Label({ text, required }) {
  return (
    <label className="text-sm font-medium" style={{ color: "var(--text-2)" }}>
      {text}
      {required && <span className="ml-0.5" style={{ color: "var(--red)" }}>*</span>}
    </label>
  );
}

export default function Input({ label, error, className, required, ...props }) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label && <Label text={label} required={required} />}
      <input
        className={fieldBase}
        style={error ? errorStyle : fieldStyle}
        data-error={error ? "true" : "false"}
        onFocus={onFocus}
        onBlur={onBlur}
        {...props}
      />
      {error && (
        <p className="text-xs" style={{ color: "var(--red)" }}>{error}</p>
      )}
    </div>
  );
}

export function Textarea({ label, error, className, required, ...props }) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label && <Label text={label} required={required} />}
      <textarea
        rows={3}
        className={clsx(fieldBase, "resize-none")}
        style={error ? errorStyle : fieldStyle}
        onFocus={onFocus}
        onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
        {...props}
      />
      {error && <p className="text-xs" style={{ color: "var(--red)" }}>{error}</p>}
    </div>
  );
}

export function Select({ label, error, className, required, children, ...props }) {
  return (
    <div className={clsx("flex flex-col gap-1.5", className)}>
      {label && <Label text={label} required={required} />}
      <select
        className={clsx(fieldBase, "cursor-pointer")}
        style={error ? errorStyle : fieldStyle}
        onFocus={onFocus}
        onBlur={e => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs" style={{ color: "var(--red)" }}>{error}</p>}
    </div>
  );
}
