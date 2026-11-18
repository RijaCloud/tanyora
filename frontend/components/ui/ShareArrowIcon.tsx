type ShareArrowIconProps = {
  className?: string;
};

export function ShareArrowIcon({ className }: ShareArrowIconProps) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3 22 11l-9 8v-5c-5 0-8.5 1.5-11 6C2 12 6 7 13 7V3Z" />
    </svg>
  );
}
