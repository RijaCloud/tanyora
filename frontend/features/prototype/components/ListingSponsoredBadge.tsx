export default function ListingSponsoredBadge({
  className = "",
  label = "SPONSORISÉ",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-[#27624f] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white shadow-[0_10px_24px_rgba(204,32,42,0.18)] ${className}`.trim()}
    >
      {label}
    </span>
  );
}
