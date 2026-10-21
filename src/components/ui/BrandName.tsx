export function BrandName({ nombre, className = '' }: { nombre: string; className?: string }) {
  const [first, ...rest] = nombre.trim().split(/\s+/);
  return (
    <span className={className}>
      <span className="font-bold">{first}</span>
      {rest.length > 0 && <span className="font-normal text-ink-300"> {rest.join(' ')}</span>}
    </span>
  );
}
