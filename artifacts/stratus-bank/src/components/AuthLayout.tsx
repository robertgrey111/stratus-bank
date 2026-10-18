import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { Link } from 'wouter';
import Brand from './Brand';

export default function AuthLayout({ children, eyebrow, title, copy }: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  copy: string;
}) {
  return (
    <main className="auth-shell">
      <aside className="auth-side">
        <Link href="/welcome" aria-label="Stratus home"><Brand light /></Link>
        <div className="side-copy">
          <span className="eyebrow"><span className="eyebrow-dot" />{eyebrow}</span>
          <h2>{title}</h2>
          <p>{copy}</p>
        </div>
        <div className="side-quote"><ShieldCheck size={15} style={{ verticalAlign: 'middle', marginRight: 7 }} />Your money, protected at every step.</div>
      </aside>
      <section className="auth-main">
        <div className="auth-main-inner">
          <Link href="/welcome" className="mobile-brand" aria-label="Stratus home"><Brand /></Link>
          <Link href="/welcome" className="auth-back"><ArrowLeft size={14} /> Back to home</Link>
          {children}
        </div>
      </section>
    </main>
  );
}
