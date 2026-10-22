export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="tyn-g" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#DF773A" />
          <stop offset="1" stopColor="#8E3A12" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="10" fill="url(#tyn-g)" />
      <path d="M9.5 11.5h17" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 11.5v16" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
      <path d="M18 22c0-4.6 3.4-7 8-6.6-.3 4.6-3.6 7.2-8 6.6z" fill="#FDE6D2" />
    </svg>
  );
}

export function Logo({ sub, size = 32 }: { sub?: string; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[19px] font-bold tracking-[-0.03em] text-ink">Tyndall</span>
        {sub ? (
          <span className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand-text">{sub}</span>
        ) : null}
      </span>
    </span>
  );
}
