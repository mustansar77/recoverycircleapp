import { clsx } from "clsx";

export default function Spinner({ size = "md", className }) {
  const sizes = { sm: "h-4 w-4 border-2", md: "h-6 w-6 border-2", lg: "h-8 w-8 border-[3px]" };
  return (
    <div
      className={clsx("animate-spin rounded-full", sizes[size], className)}
      style={{ borderColor: "var(--border)", borderTopColor: "var(--blue)" }}
    />
  );
}

export function PageSpinner() {
  return (
    <div className="flex flex-1 items-center justify-center p-20">
      <Spinner size="lg" />
    </div>
  );
}
