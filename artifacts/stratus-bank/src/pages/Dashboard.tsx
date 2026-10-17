import { useEffect, useState } from 'react';
import { ArrowDownLeft, LockKeyhole, LogOut, ShieldCheck, ShoppingBag, Utensils } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import Brand from '../components/Brand';
import { getCurrentUser, signOut, type StratusSession } from '../lib/auth';

const activity = [
  { name: 'Northstar Market', date: 'Today · 10:42 AM', amount: '-$48.26', kind: 'spend', icon: ShoppingBag },
  { name: 'Harbor Coffee', date: 'Yesterday · 8:16 AM', amount: '-$6.80', kind: 'spend', icon: Utensils },
  { name: 'Payroll deposit', date: 'Jun 14 · 9:03 AM', amount: '+$2,840.00', kind: 'income', icon: ArrowDownLeft },
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [session, setSession] = useState<StratusSession | null>(null);
  const [checking, setChecking] = useState(true);
  const [signOutError, setSignOutError] = useState('');
  useEffect(() => {
    let live = true;
    getCurrentUser().then(value => { if (!live) return; if (!value) setLocation('/login'); else setSession(value); })
      .catch(() => { if (live) setLocation('/login'); })
      .finally(() => { if (live) setChecking(false); });
    return () => { live = false; };
  }, [setLocation]);
  async function leave() {
    setSignOutError('');
    try {
      await signOut();
      setLocation('/');
    } catch (error) {
      setSignOutError(error instanceof Error ? error.message : 'We could not sign you out. Please try again.');
    }
  }

  if (checking || !session) return <div className="dashboard" aria-label="Loading account"><header className="dash-top"><div className="dash-nav"><Brand/><span className="tile-label">Preparing your account</span></div></header><main className="dash-content"><div className="quick-card" style={{height:190,background:'linear-gradient(90deg,#edf2f7,#f7f9fc,#edf2f7)',border:0}} /></main></div>;
  const fullName = typeof session.user.user_metadata?.full_name === 'string'
    ? session.user.user_metadata.full_name
    : '';
  const firstName = fullName.split(' ')[0] || 'there';
  const initials = fullName.split(' ').map((part: string) => part[0]).slice(0,2).join('').toUpperCase() || session.user.email?.slice(0,1).toUpperCase() || 'S';
  return <main className="dashboard">
    <header className="dash-top"><div className="dash-nav"><Link href="/dashboard" aria-label="Stratus dashboard"><Brand/></Link><div className="dash-user"><span>{session.user.email}</span><span className="user-badge" data-testid="text-user-initials">{initials}</span><button className="button button-outline" type="button" onClick={leave} data-testid="button-sign-out"><LogOut size={14}/> Sign out</button></div></div></header>
    <div className="dash-content">
      <div className="dash-heading"><div><h1>Good morning, {firstName}.</h1><p>Here’s your money, right where you need it.</p></div></div>
      <div className="dash-grid">
        <section className="balance-card" aria-label="Account balance">
          <div className="balance-label">Account balance</div><div className="balance-amount">$8,610.58</div><div className="balance-meta">Your everyday account</div>
          <div className="balance-foot"><span className="account-tag">•••• 4826</span><span className="secure-chip"><ShieldCheck size={13}/> Secure account</span></div>
        </section>
        <section className="quick-card"><h2 className="quick-title">Everything in its place.</h2><p style={{fontSize:13,lineHeight:1.7,color:'#78889a',margin:'0 0 22px'}}>Your Stratus account is ready. We’ll keep your everyday balance and recent activity easy to find, right here.</p><div className="secure-chip" style={{color:'#4b7b61'}}><ShieldCheck size={14}/> Email verified and account secure</div></section>
      </div>
      <section className="activity-card"><div className="activity-head"><h2 className="activity-title">Recent activity</h2><span className="activity-period">Most recent</span></div>
        {activity.map((item,index)=>{const Icon=item.icon;return <div className="activity-row" key={item.name} data-testid={`row-activity-${index}`}><div className="activity-left"><span className={`merchant-icon${item.kind==='income'?' income':''}`}><Icon size={17}/></span><span><span className="merchant-name">{item.name}</span><span className="merchant-date" style={{display:'block'}}>{item.date}</span></span></div><span className={`activity-amount${item.kind==='income'?' income':''}`}>{item.amount}</span></div>;})}
      </section>
      <p className="available-balance" data-testid="text-available-balance">Available balance <strong>$8,426.58</strong> <span>· $184.00 pending</span></p>
      {signOutError && <p className="form-alert" role="alert" data-testid="status-sign-out-error">{signOutError}</p>}
      <p className="dash-notice"><LockKeyhole size={13}/> Your account is protected with secure sign-in.</p>
    </div>
  </main>;
}
