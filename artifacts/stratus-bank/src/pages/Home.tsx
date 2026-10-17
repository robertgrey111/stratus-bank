import { ArrowRight, ArrowUpRight, BadgeCheck, Fingerprint, LockKeyhole, ShieldCheck, Sparkles, WalletCards } from 'lucide-react';
import { Link } from 'wouter';
import Brand from '../components/Brand';

export default function Home() {
  return (
    <div className="site-shell">
      <header className="topbar">
        <Link href="/" aria-label="Stratus home"><Brand /></Link>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#how-it-feels">A better way</a><a href="#built-around-you">Your money, simply</a><a href="#security">Security</a>
        </nav>
        <div className="nav-actions"><Link href="/login" className="nav-login">Log in</Link><Link href="/signup" className="button">Open an account <ArrowRight size={15} /></Link></div>
      </header>
      <main>
        <section className="hero">
          <div className="hero-copy-block">
            <div className="eyebrow"><span className="eyebrow-dot" />A little more room to breathe</div>
            <h1>Money, with a <span>clearer</span> sky.</h1>
            <p className="hero-copy">A more thoughtful kind of banking. See what you have, know where it goes, and feel good about what comes next.</p>
            <div className="hero-actions"><Link href="/signup" className="button">Get started <ArrowRight size={15} /></Link><a className="button button-light" href="#how-it-feels">See how it feels <ArrowUpRight size={15} /></a></div>
            <div className="hero-proof"><span className="proof-item"><ShieldCheck size={15} /> Protected by encryption</span><span className="proof-item"><BadgeCheck size={15} /> No monthly account fee</span></div>
          </div>
          <div className="hero-art" aria-label="Illustration of a Stratus debit card and savings overview">
            <div className="art-cloud" /><div className="art-orbit" /><div className="art-orbit two" />
            <div className="bank-card">
              <div className="card-top"><span className="card-brand">stratus</span><span className="card-chip" /></div>
              <div className="card-number">•••• &nbsp; •••• &nbsp; •••• &nbsp; 4826</div>
              <div className="card-bottom"><span>Cardholder<strong>JAMIE MORGAN</strong></span><span>Debit<strong>VISA</strong></span></div>
            </div>
            <div className="float-tile tile-savings"><div className="tile-label">Set aside</div><div className="tile-value">$1,248 <ArrowUpRight size={15} /></div></div>
            <div className="float-tile tile-chart"><div className="chart-label">Your month, at a glance</div><div className="chart-bars"><i/><i/><i/><i/><i/><i/><i/></div></div>
          </div>
        </section>
        <section className="feature-band" id="how-it-feels">
          <div className="feature-inner">
            <div className="feature-item"><span className="feature-icon"><WalletCards size={19}/></span><div><strong>One clear view</strong><span>Know where you stand, instantly.</span></div></div>
            <div className="feature-item"><span className="feature-icon"><Fingerprint size={19}/></span><div><strong>Yours alone</strong><span>Private by design, always.</span></div></div>
            <div className="feature-item"><span className="feature-icon"><Sparkles size={19}/></span><div><strong>Fewer surprises</strong><span>Small details, thoughtfully handled.</span></div></div>
            <div className="feature-item"><span className="feature-icon"><LockKeyhole size={19}/></span><div><strong>Here when you need us</strong><span>Support from real people.</span></div></div>
          </div>
        </section>
        <section className="section" id="built-around-you">
          <div className="section-heading">
            <span className="eyebrow"><span className="eyebrow-dot" />Made for everyday life</span>
            <h2>Less sorting through. More seeing clearly.</h2>
            <p>Your banking should feel like a helpful part of your day—not another thing to manage. Stratus keeps the essentials close and the noise out.</p>
          </div>
          <div className="benefit-grid">
            <article className="benefit-card"><WalletCards size={21}/><h3>A balance that makes sense</h3><p>See your available balance right away, with recent activity that’s easy to understand.</p></article>
            <article className="benefit-card"><Sparkles size={21}/><h3>Everyday, made lighter</h3><p>Move through the little money moments with a simpler, more considered experience.</p></article>
            <article className="benefit-card" id="security"><ShieldCheck size={21}/><h3>Security you can feel</h3><p>Your account is protected with secure sign-in and careful handling of your information.</p></article>
          </div>
        </section>
        <section className="calm-banner">
          <div><h2>Start with a clearer view.</h2><p>Make space for the things your money is here to do.</p></div>
          <Link href="/signup" className="button">Open your account <ArrowRight size={15}/></Link>
        </section>
      </main>
      <footer className="footer"><span>© 2025 Stratus Bank. A calmer way to bank.</span><div className="footer-links"><Link href="/login">Log in</Link><Link href="/signup">Open an account</Link><a href="#security">Security</a></div></footer>
    </div>
  );
}
