export function BowIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 12c-1.5-2-4-3-7-3s-4 2-3 4 3 3 6 1l4-2Z" />
      <path d="M12 12c1.5-2 4-3 7-3s4 2 3 4-3 3-6 1l-4-2Z" />
      <circle cx="12" cy="12" r="2" />
      <path d="M8 17c-1 2-2 4-2 4s2-1 4-2l2-2" />
      <path d="M16 17c1 2 2 4 2 4s-2-1-4-2l-2-2" />
    </svg>
  );
}
