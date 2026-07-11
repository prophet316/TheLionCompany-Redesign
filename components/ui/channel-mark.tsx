export function ChannelMark({ label }: { readonly label: string }) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  const mark = (
    parts.length > 1
      ? parts.map((part) => part[0] ?? "").join("")
      : (parts[0] ?? "").slice(0, 2)
  )
    .slice(0, 2)
    .toUpperCase();

  return (
    <span>
      <span aria-hidden="true">{mark}</span>
      <span className="sr-only">{label}</span>
    </span>
  );
}
