import { Cloud } from 'lucide-react';

export default function Brand({ light = false }: { light?: boolean }) {
  return (
    <span className={`brand${light ? ' brand-light' : ''}`} data-testid="brand-stratus">
      <span className="brand-mark"><Cloud size={19} strokeWidth={2.15} /></span>
      <span>stratus</span>
    </span>
  );
}
