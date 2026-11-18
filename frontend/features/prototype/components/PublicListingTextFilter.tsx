"use client";

type PublicListingTextFilterProps = {
  title?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

export default function PublicListingTextFilter({
  title = "Recherche",
  value,
  onChange,
  placeholder = "Rechercher",
}: PublicListingTextFilterProps) {
  return (
    <div className="tanyora-search-filter relative w-full px-2 pb-[8px] pt-[8px]">
      <div className="content-stretch flex w-full items-center min-h-px min-w-px relative">
        <div className="flex flex-col font-['Roboto_Flex:Bold',sans-serif] font-bold justify-center leading-[1.2] not-italic relative shrink-0 text-[#191919] dark:text-white text-[12px] whitespace-nowrap">
          <p className="leading-[1.2]">{title}</p>
        </div>
      </div>

      <div className="mt-2 w-full">
        <div className="public-listing-text-filter ui-border-strong ui-surface ui-text-main flex h-[34px] items-center gap-2 rounded-[10px] border px-2.5">
          <svg className="size-4 shrink-0 text-[#707070] dark:text-gray-400" fill="none" viewBox="0 0 18 18">
            <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12 12L16.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            aria-label={title}
            className="public-listing-text-filter-input h-full min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-[#8c8c93] dark:placeholder:text-[#8a8a94]"
          />
        </div>
      </div>
    </div>
  );
}
