function decodeSkillLabel(value: string) {
  return value
    .replace(/\\u([0-9a-fA-F]{4})/g, (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
    .replace(/([A-Za-z])u([0-9a-fA-F]{4})/g, (_match, prefix: string, hex: string) => `${prefix}${String.fromCharCode(Number.parseInt(hex, 16))}`);
}

export default function ListingSkillRow({
  skills,
  maxVisible = 2,
  className = "",
}: {
  skills?: string[];
  maxVisible?: number;
  className?: string;
}) {
  const normalizedSkills = (skills || [])
    .map((skill) => decodeSkillLabel(String(skill || "").trim()))
    .filter(Boolean);
  const visibleSkills = normalizedSkills.slice(0, maxVisible);
  const remainingCount = Math.max(0, normalizedSkills.length - visibleSkills.length);

  if (visibleSkills.length === 0) {
    return null;
  }

  return (
    <div className={`flex min-w-0 flex-nowrap items-center gap-1.5 overflow-hidden ${className}`.trim()}>
      {visibleSkills.map((skill) => (
        <span
          key={skill}
          className="inline-flex min-w-0 max-w-full shrink truncate rounded-full bg-[#f4f4f5] px-2.5 py-1 text-[10px] font-semibold leading-none text-[#27272a] dark:bg-[#27272a] dark:text-[#fafafa]"
          title={skill}
        >
          {skill}
        </span>
      ))}
      {remainingCount > 0 ? (
        <span className="inline-flex shrink-0 rounded-full bg-[#111111] px-2.5 py-1 text-[10px] font-bold leading-none text-white dark:bg-white dark:text-[#111111]">
          + {remainingCount}
        </span>
      ) : null}
    </div>
  );
}
