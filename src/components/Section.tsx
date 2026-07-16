type SectionProps = {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function Section({ eyebrow, title, children, actions }: SectionProps) {
  return (
    <section className="panel module-panel">
      <div className="panel-heading compact">
        <div>
          <span className="eyebrow">{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
