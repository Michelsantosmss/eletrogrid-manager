type EletroGridMarkProps = { className?: string };

export function EletroGridMark({ className = 'brand-mark' }: EletroGridMarkProps) {
  return (
    <span className={className} role="img" aria-label="EletroGrid">
      <img src="/pwa-512x512.png" alt="" />
    </span>
  );
}
