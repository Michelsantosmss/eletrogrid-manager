type EletroGridMarkProps = { className?: string };

export function EletroGridMark({ className = 'brand-mark' }: EletroGridMarkProps) {
  return (
    <svg className={className} viewBox="0 0 160 100" role="img" aria-label="EletroGrid">
      <path fill="#ffffff" d="M13 18h69L69 36H38l-5 10h29L50 64H21l-9 18h55l13-18H52l5-10h28l13-18H65l5-10h30L113 8H30z" />
      <path fill="#bfc3c9" d="M105 22h37c12 0 17 10 13 21l-6 16h-29l5-12h17l2-6c1-3-1-5-5-5h-26c-8 0-14 4-17 12l-7 19c-3 8 2 15 11 15h18l3-8h-18l5-13h35l-14 36H87c-15 0-23-12-18-26l11-31c5-12 16-18 29-18z" />
      <path fill="#f7941d" d="M90 0 48 54h26L57 100l55-61H85z" />
    </svg>
  );
}
