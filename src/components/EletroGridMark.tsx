import markReference from '../assets/eletrogrid-reference.jpg';

type EletroGridMarkProps = { className?: string };

export function EletroGridMark({ className = 'brand-mark' }: EletroGridMarkProps) {
  return (
    <span className={className} role="img" aria-label="EletroGrid">
      <img src={markReference} alt="" />
    </span>
  );
}
