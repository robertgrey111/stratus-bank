import { type ReactNode, useEffect, useState } from 'react';
import { ArrowRight, CreditCard, FileText, Gauge, Landmark, LockKeyhole, LogOut, Menu, Send, ShieldCheck, UserRound, Users, Wallet, X } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import Brand from './Brand';
import { getMfaAccessState, signOut } from '../lib/auth';
import '../styles/banking.css';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Gauge },
  { href: '/accounts', label: 'Accounts', icon: Landmark },
  { href: '/deposit', label: 'Deposit', icon: Wallet },
  { href: '/transfer', label: 'Transfer Funds', icon: Send },
  { href: '/transactions', label: 'Transactions', icon: ArrowRight },
  { href: '/statements', label: 'Statements', icon: FileText },
  { href: '/profile', label: 'Profile and Settings', icon: UserRound },
];

export default function BankingShell({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [ready, setReady] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [failed, setFailed] = useState(false);
  const [signOutError, setSignOutError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [path] = useLocation();

  useEffect(() => {
    let live = true;
    getMfaAccessState().then(access => {
      if (!live) return;
      if (access.status === 'authenticated') setAllowed(true);
      else if (access.status === 'challenge') setLocation('/mfa-challenge');
      else if (access.status === 'setup') setLocation('/mfa-setup');
      else setLocation('/login');
    }).catch(() => {
      if (live) {
        setFailed(true);
        setLocation('/login');
      }
    }).finally(() => { if (live) setReady(true); });
    return () => { live = false; };
  }, [setLocation]);

  async function leave() {
    setSignOutError('');
    try {
      await signOut();
      setLocation('/login');
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'We could not sign you out. Please try again.');
    }
  }

  if (!ready || (!allowed && !failed)) {
    return <div className="bank-app"><header className="bank-header"><div className="bank-header-inner"><Brand /><span className="tile-label">Preparing your account</span></div></header><main className="bank-main"><div className="bank-panel bank-loading" aria-live="polite"><span className="bank-loading-spinner" aria-hidden="true" /><p>Checking your secure sign-in status…</p></div></main></div>;
  }
  if (!allowed) return <div className="bank-app" aria-label="Redirecting to secure sign in" />;

  return <div className="bank-app">
    <header className="bank-header">
      <div className="bank-header-inner">
        <Link href="/dashboard" className="bank-brand-link" aria-label="Stratus Bank overview" data-testid="link-brand-dashboard"><Brand /></Link>
        <button className="bank-mobile-menu" type="button" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} data-testid="button-mobile-navigation" onClick={() => setMenuOpen(value => !value)}>{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        <nav className={`bank-nav${menuOpen ? ' is-open' : ''}`} aria-label="Banking navigation">
          {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined} data-testid={`link-nav-${label.toLowerCase()}`} onClick={() => setMenuOpen(false)}><Icon size={15} />{label}</Link>)}
        </nav>
        <Link href="/profile" className="bank-profile" aria-label="Robert Grey profile" data-testid="link-profile">
          <span className="bank-avatar" data-testid="text-owner-initials">RG</span><span className="bank-profile-name">Robert Grey</span>
        </Link>
        <button className="bank-header-signout" type="button" onClick={leave} aria-label="Sign out" data-testid="button-sign-out-header"><LogOut size={15} /></button>
      </div>
    </header>
    <div className="bank-layout">
      <aside className="bank-rail">
        <div className="bank-rail-label">YOUR BANKING</div>
        {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined} data-testid={`link-rail-${label.toLowerCase()}`}><Icon size={16} />{label}</Link>)}
        <div className="bank-rail-separator" />
        {navItems.slice(5).map(({ href, label, icon: Icon }) => <Link key={href} href={href} aria-current={path === href ? 'page' : undefined} data-testid={`link-rail-${label.toLowerCase()}`}><Icon size={16} />{label}</Link>)}
        <div className="bank-rail-separator" />
        <button type="button" onClick={leave} data-testid="button-sign-out"><LogOut size={16} />Sign out</button>
      </aside>
      <main className="bank-main">
        {signOutError && <p className="form-alert" role="alert" data-testid="status-sign-out-error">{signOutError}</p>}
        {children}
        <p className="bank-footer-note"><LockKeyhole size={13} />Protected with secure sign-in.</p>
      </main>
    </div>
  </div>;
}
