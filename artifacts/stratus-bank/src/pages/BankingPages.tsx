import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { useSubmitTransfer, type TransferAttempt } from '@workspace/api-client-react';
import { ArrowDownLeft, ArrowRight, BadgeCheck, CircleHelp, Clock3, Eye, EyeOff, Search, Send, ShieldCheck, Wallet } from 'lucide-react';
import { Link } from 'wouter';
import { account, credits, formatMoney, formatRecordDate, openingBalance, type CreditRecord } from '../lib/banking-data';

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <header className="bank-page-head">
      <div>
        <p className="bank-kicker">{eyebrow}</p>
        <h1>{title}</h1>
        {subtitle && <p className="bank-subtitle">{subtitle}</p>}
      </div>
    </header>
  );
}

function PrototypeNotice() {
  return (
    <div className="bank-prototype" role="note" data-testid="notice-prototype-data">
      <ShieldCheck size={15} />Illustrative prototype data only — values and activity are not verified records and are shown for demonstration purposes.
    </div>
  );
}

function StatusPill() {
  return (
    <span className="bank-status">
      <BadgeCheck size={11} style={{ verticalAlign: '-2px', marginRight: 3 }} />Completed
    </span>
  );
}

function RecordRow({ record, onView }: { record: CreditRecord; onView: (item: CreditRecord) => void }) {
  return (
    <article className="bank-activity-row" data-testid={`row-credit-${record.id}`}>
      <div className="bank-party">
        <span className="bank-party-mark"><ArrowDownLeft size={17} /></span>
        <span className="bank-party-copy">
          <strong>{record.counterparty}</strong>
          <span className="bank-activity-desc">{record.description}</span>
        </span>
      </div>
      <div className="bank-record-meta">Ref. {record.reference}</div>
      <div className="bank-record-meta">+{formatMoney(record.amount)} ({formatRecordDate(record.date)})</div>
      <span className="bank-credit">CREDIT</span>
      <StatusPill />
      <button className="bank-view" type="button" onClick={() => onView(record)} data-testid={`button-view-details-${record.id}`}>
        View Details
      </button>
    </article>
  );
}

function RecordDetails({ record, close }: { record: CreditRecord; close: () => void }) {
  return (
    <div className="bank-record-modal" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <section className="bank-record-dialog" role="dialog" aria-modal="true" aria-labelledby="credit-details-title" data-testid="dialog-credit-details">
        <div className="bank-record-dialog-head">
          <div>
            <p className="bank-kicker">Credit record</p>
            <h2 id="credit-details-title">{record.counterparty}</h2>
          </div>
          <button type="button" className="bank-dialog-close" onClick={close} aria-label="Close">×</button>
        </div>
        <div className="bank-dialog-amount">+{formatMoney(record.amount)}</div>
        <div className="bank-detail-row"><span>Description</span><strong>{record.description}</strong></div>
        <div className="bank-detail-row"><span>Reference</span><strong>{record.reference}</strong></div>
        <div className="bank-detail-row"><span>Date</span><strong>{formatRecordDate(record.date)}</strong></div>
        <div className="bank-detail-row"><span>Type</span><strong className="bank-credit">Credit</strong></div>
        <div className="bank-detail-row"><span>Status</span><strong>Completed</strong></div>
        <p className="bank-form-hint">Illustrative prototype record; not a verified bank transaction.</p>
      </section>
    </div>
  );
}

function CreditsList({ records }: { records: CreditRecord[] }) {
  const [selected, setSelected] = useState<CreditRecord | null>(null);
  return (
    <>
      {records.length > 0 ? (
        <div className="bank-panel bank-activity">
          {records.map((record) => <RecordRow key={record.id} record={record} onView={setSelected} />)}
        </div>
      ) : (
        <div className="bank-empty" data-testid="empty-credit-history"><Clock3 size={21} /><strong>No credits match this view</strong><p>Try another status or search term. This prototype contains credit-only demonstration records.</p></div>
      )}
      {selected && <RecordDetails record={selected} close={() => setSelected(null)} />}
    </>
  );
}

function BalanceFlow() {
  const [range, setRange] = useState(90);
  const filtered = credits.filter(record => range === 0 || (Date.now() - record.date.getTime()) / 86400000 <= range);

  const { points, balances, labels } = useMemo(() => {
    const points = filtered.slice().sort((a, b) => a.date.getTime() - b.date.getTime());
    const balances: number[] = [];
    let running = openingBalance;
    for (const p of points) {
      running += p.amount;
      balances.push(running);
    }
    const labels = points.map(p => formatRecordDate(p.date));
    return { points, balances, labels };
  }, [filtered]);

  const total = filtered.reduce((sum, record) => sum + record.amount, 0);
  const rangeOptions = [{ label: '7 days', days: 7 }, { label: '30 days', days: 30 }, { label: '90 days', days: 90 }, { label: 'All Time', days: 0 }];

  const closing = balances.length ? balances[balances.length - 1] : openingBalance + total;

  const chart = useMemo(() => {
    if (!balances.length) return null;
    const width = 620;
    const height = 92;
    const baseline = 146;
    const minBalance = openingBalance;
    const maxBalance = Math.max(...balances, minBalance);
    const points = balances.map((balance, index) => {
      const x = 36 + (balances.length <= 1 ? 0 : index * (width - 70) / (balances.length - 1));
      const ratio = (balance - minBalance) / (maxBalance - minBalance || 1);
      const y = baseline - ratio * height;
      return { x, y, balance, label: labels[index] };
    });
    const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
    return { points, polyline, minBalance, maxBalance };
  }, [balances, labels]);

  return (
    <section className="bank-panel bank-section" aria-labelledby="balance-flow-heading">
      <div className="bank-chart-head">
        <div>
          <h2 id="balance-flow-heading">Balance Flow</h2>
          <p>Illustrative balance history — opening {formatMoney(openingBalance)} · credits {formatMoney(total)} · closing {formatMoney(closing)}</p>
        </div>
        <div className="bank-range" aria-label="Balance flow date range">
          {rangeOptions.map(option => (
            <button key={option.label} type="button" aria-pressed={range === option.days} data-testid={`button-range-${option.days}`} onClick={() => setRange(option.days)}>
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <div className="bank-chart" data-testid="chart-balance-flow">
        <div className="bank-chart-legend"><span className="bank-legend-dot" /> Credits only — illustrative</div>
        {chart ? (
          <svg viewBox="0 0 680 170" role="img" aria-label={`Illustrative running balance over the selected ${range ? `${range} day` : 'all time'} range`}>
            {[30, 68, 106, 146].map(y => <line key={y} x1="25" y1={y} x2="660" y2={y} stroke="#edf1f5" strokeWidth="1" />)}
            <polyline fill="rgba(111,159,200,0.15)" stroke="#6f9fc8" strokeWidth={2} points={chart.polyline} />
            {chart.points.map((p, i) => (
              <g key={`pt-${i}`} data-testid={`chart-balance-${i}`}>
                <circle cx={p.x} cy={p.y} r={4} fill="#6f9fc8" />
                <text x={p.x} y={p.y - 8} fontSize={10} textAnchor="middle" fill="#20343b">{formatMoney(p.balance)}</text>
              </g>
            ))}
          </svg>
        ) : (
          <div className="bank-empty">No credit records in this period.</div>
        )}
        <div className="bank-chart-labels"><span>{labels[0] || ''}</span><span>Credits only · no outgoing funds shown</span><span>{labels[labels.length - 1] || ''}</span></div>
      </div>
    </section>
  );
}

export function DashboardPage() {
  const [visible, setVisible] = useState(true);
  const [selected, setSelected] = useState<CreditRecord | null>(null);
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(interval);
  }, []);
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <PageHeading eyebrow="Account overview" title={`${greeting}, Robert Grey`} subtitle="Here’s your account at a glance." />
      <PrototypeNotice />
      <div className="bank-balance-layout">
        <section className="bank-panel bank-balance" aria-label="Checking account balance">
          <div className="bank-balance-top">
            <span>{account.accountType}</span>
            <button className="bank-inline-button" type="button" onClick={() => setVisible(v => !v)} aria-label={visible ? 'Hide balances' : 'Show balances'}>
              {visible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
          <div className="bank-balance-content">
            <div className="bank-balance-note">Available balance</div>
            <div className="bank-amount" data-testid="text-available-balance">{visible ? formatMoney(account.availableBalance) : '•••••••'}</div>
            <div className="bank-balance-legend"><div>Ledger balance</div><div>{visible ? formatMoney(account.ledgerBalance) : '•••••••'}</div></div>
          </div>
          <div className="bank-balance-bottom"><span>•••• {account.accountNumberEnding}</span><span className="bank-status-secure"><ShieldCheck size={14} />Secure account</span></div>
        </section>
        <section className="bank-panel bank-action-panel">
          <div><h2>Move with confidence</h2><p>Review your account or start a prototype deposit or transfer request.</p></div>
          <div className="bank-action-grid">
            <Link href="/deposit" className="bank-action" data-testid="link-action-deposit"><Wallet size={17} />Deposit</Link>
            <Link href="/transfer" className="bank-action" data-testid="link-action-transfer"><Send size={17} />Transfer Funds</Link>
          </div>
        </section>
      </div>

      <section className="bank-section">
        <div className="bank-section-head">
          <h2>Recent Transaction Activities</h2>
          <Link href="/transactions" className="bank-text-link" data-testid="link-view-all-transactions">View All Transactions <ArrowRight size={14} /></Link>
        </div>
        <CreditsList records={credits} />
      </section>

      <BalanceFlow />

      <section className="bank-section bank-panel bank-account-detail" aria-label="Account details">
        <div className="bank-detail-row"><span>Account owner</span><strong>{account.ownerName}</strong></div>
        <div className="bank-detail-row"><span>Account type</span><strong>{account.accountType}</strong></div>
        <div className="bank-detail-row"><span>Account number</span><strong>•••• {account.accountNumberEnding}</strong></div>
      </section>

      {selected && <RecordDetails record={selected} close={() => setSelected(null)} />}
    </>
  );
}

export function AccountsPage() {
  const [visible, setVisible] = useState(true);
  return (
    <>
      <PageHeading eyebrow="Your accounts" title="Checking account" subtitle="Account details and current balances." />
      <PrototypeNotice />
      <section className="bank-panel bank-balance" aria-label="Checking account balance">
        <div className="bank-balance-top"><span>{account.accountType}</span><button className="bank-inline-button" type="button" onClick={() => setVisible(v => !v)} data-testid="button-toggle-balances">Toggle</button></div>
        <div className="bank-balance-content"><div className="bank-balance-note">Available balance</div><div className="bank-amount">{visible ? formatMoney(account.availableBalance) : '•••••••'}</div></div>
        <div className="bank-balance-bottom"><span>•••• {account.accountNumberEnding}</span><span className="bank-status-secure"><ShieldCheck size={14} />Secure account</span></div>
      </section>
      <section className="bank-section bank-panel bank-account-detail" aria-label="Checking account details">
        <div className="bank-detail-row"><span>Account owner</span><strong>{account.ownerName}</strong></div>
        <div className="bank-detail-row"><span>Account type</span><strong>{account.accountType}</strong></div>
      </section>
      <div className="bank-coming-links"><Link href="/deposit" className="bank-btn bank-btn-primary" data-testid="link-account-deposit">Deposit <ArrowRight size={14} /></Link><Link href="/transfer" className="bank-btn" data-testid="link-account-transfer">Transfer</Link></div>
    </>
  );
}

export function TransactionsPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All Credits' | 'Completed' | 'Pending'>('All Credits');
  const records = useMemo(() => credits.filter(record => {
    const q = query.trim().toLowerCase();
    const matches = !q || [record.counterparty, record.description, record.reference, formatRecordDate(record.date)].some(value => value.toLowerCase().includes(q));
    return matches && (filter !== 'Pending');
  }), [query, filter]);

  return (
    <>
      <PageHeading eyebrow="Activity" title="Transactions" subtitle="A clear view of illustrative credits to your account." />
      <PrototypeNotice />
      <section className="bank-panel bank-toolbar" aria-label="Transaction filters">
        <label className="bank-search-wrap"><Search size={15} /><input className="bank-input" type="search" placeholder="Search credits" value={query} onChange={e => setQuery(e.target.value)} /></label>
        <div className="bank-filter-tabs" role="group" aria-label="Credit status filter">
          {(['All Credits', 'Completed', 'Pending'] as const).map(option => <button key={option} type="button" aria-pressed={filter === option} onClick={() => setFilter(option)}>{option}</button>)}
        </div>
      </section>
      <section className="bank-section">
        <div className="bank-section-head"><h2>{filter} <span className="bank-form-hint" style={{ display: 'inline', marginLeft: 5 }}>({records.length})</span></h2></div>
        <CreditsList records={records} />
      </section>
    </>
  );
}

type DepositFields = { amount: string; method: string; reference: string };
const emptyDeposit: DepositFields = { amount: '', method: 'Bank transfer', reference: '' };
export function DepositPage() {
  const [fields, setFields] = useState(emptyDeposit);
  const [stage, setStage] = useState<'form' | 'review' | 'complete'>('form');
  function update(key: keyof DepositFields, value: string) { setFields(current => ({ ...current, [key]: value })); }
  if (stage === 'complete') return (
    <>
      <PageHeading eyebrow="Deposit" title="Deposit request" subtitle="Prototype walkthrough complete." />
      <section className="bank-panel bank-complete" data-testid="status-deposit-prototype"><span className="bank-complete-mark">✓</span><h2>Deposit submitted</h2><p>This is a prototype confirmation only. No real deposit was processed or applied to the illustrative balance.</p></section>
    </>
  );
  return (
    <>
      <PageHeading eyebrow="Prototype workflow" title={stage === 'review' ? 'Review deposit details' : 'Deposit'} subtitle={stage === 'review' ? 'Check the entered information before completing this prototype request.' : 'Enter deposit details to continue.'} />
      <PrototypeNotice />
      <section className="bank-panel bank-form-card">
        {stage === 'form' ? (
          <form onSubmit={e => { e.preventDefault(); setStage('review'); }} data-testid="form-deposit">
            <div className="bank-form-grid">
              <div className="bank-form-field"><label htmlFor="deposit-amount">Amount</label><input id="deposit-amount" className="bank-input" type="number" min="0.01" step="0.01" required value={fields.amount} onChange={e => update('amount', e.target.value)} /></div>
              <div className="bank-form-field"><label htmlFor="deposit-method">Method</label><select id="deposit-method" className="bank-select" value={fields.method} onChange={e => update('method', e.target.value)}><option>Bank transfer</option><option>Wire</option></select></div>
              <div className="bank-form-field wide"><label htmlFor="deposit-reference">Reference</label><input id="deposit-reference" className="bank-input" maxLength={140} value={fields.reference} onChange={e => update('reference', e.target.value)} /></div>
            </div>
            <div className="bank-form-actions"><button className="bank-btn bank-btn-primary" type="submit" data-testid="button-review-deposit">Review details <ArrowRight size={14} /></button></div>
          </form>
        ) : (
          <>
            <p className="bank-kicker">Review before continuing</p>
            <div className="bank-review">
              <div className="bank-detail-row"><span>Amount</span><strong>{formatMoney(Number(fields.amount))}</strong></div>
              <div className="bank-detail-row"><span>Method</span><strong>{fields.method}</strong></div>
              <div className="bank-detail-row"><span>Reference</span><strong>{fields.reference}</strong></div>
            </div>
            <div className="bank-inline-alert" role="status"><strong>Prototype only</strong> Completing this step will not submit a deposit or change any balance.</div>
            <div className="bank-form-actions"><button className="bank-btn bank-btn-secondary" type="button" onClick={() => setStage('form')} data-testid="button-edit-deposit">Edit details</button><button className="bank-btn bank-btn-primary" type="button" onClick={() => setStage('complete')}>Confirm deposit <ArrowRight size={14} /></button></div>
          </>
        )}
      </section>
    </>
  );
}

type TransferFields = { recipientName: string; accountIdentifier: string; institution: string; amount: string; transferType: TransferAttempt['transferType']; reference: string };
const emptyTransfer: TransferFields = { recipientName: '', accountIdentifier: '', institution: '', amount: '', transferType: 'domestic', reference: '' };
export function TransferPage() {
  const [fields, setFields] = useState<TransferFields>(emptyTransfer);
  const [stage, setStage] = useState<'form' | 'review' | 'rejected'>('form');
  const submitTransfer = useSubmitTransfer();
  const exactRestriction = 'Withdrawals and transfers are suspended pending probate authorization';
  function update(key: keyof TransferFields, value: string) { setFields(current => ({ ...current, [key]: value })); }
  async function attemptTransfer() {
    const transferAttempt: TransferAttempt = { ...fields, amount: Number(fields.amount) };
    try { await submitTransfer.mutateAsync({ data: transferAttempt }); }
    catch { /* The API is expected to reject this attempt with HTTP 403. */ }
    setStage('rejected');
  }
  return (
    <>
      <PageHeading eyebrow="Prototype workflow" title={stage === 'review' ? 'Review transfer' : 'Transfer Funds'} subtitle={stage === 'review' ? 'Review the recipient and amount before the final submission.' : 'Send a prototype transfer request.'} />
      <PrototypeNotice />
      <section className="bank-panel bank-form-card">
        {stage === 'form' ? (
          <form onSubmit={e => { e.preventDefault(); setStage('review'); }} data-testid="form-transfer">
            <div className="bank-form-grid">
              <div className="bank-form-field"><label htmlFor="transfer-recipient">Recipient name</label><input id="transfer-recipient" className="bank-input" required maxLength={120} value={fields.recipientName} onChange={e => update('recipientName', e.target.value)} /></div>
              <div className="bank-form-field"><label htmlFor="transfer-account">Account identifier</label><input id="transfer-account" className="bank-input" required maxLength={80} value={fields.accountIdentifier} onChange={e => update('accountIdentifier', e.target.value)} /></div>
              <div className="bank-form-field"><label htmlFor="transfer-institution">Institution</label><input id="transfer-institution" className="bank-input" required maxLength={120} value={fields.institution} onChange={e => update('institution', e.target.value)} /></div>
              <div className="bank-form-field"><label htmlFor="transfer-amount">Amount</label><input id="transfer-amount" className="bank-input" type="number" min="0.01" step="0.01" required value={fields.amount} onChange={e => update('amount', e.target.value)} /></div>
              <div className="bank-form-field"><label htmlFor="transfer-type">Transfer type</label><select id="transfer-type" className="bank-select" value={fields.transferType} onChange={e => update('transferType', e.target.value as TransferAttempt['transferType'])}><option value="domestic">Domestic</option><option value="international">International</option></select></div>
              <div className="bank-form-field"><label htmlFor="transfer-reference">Reference</label><input id="transfer-reference" className="bank-input" maxLength={140} value={fields.reference} onChange={e => update('reference', e.target.value)} /></div>
            </div>
            <div className="bank-form-actions"><button className="bank-btn bank-btn-primary" type="submit" data-testid="button-review-transfer">Review transfer <ArrowRight size={14} /></button></div>
          </form>
        ) : (
          <>
            <p className="bank-kicker">Transfer review</p>
            <div className="bank-review">
              <div className="bank-detail-row"><span>Recipient</span><strong>{fields.recipientName}</strong></div>
              <div className="bank-detail-row"><span>Account identifier</span><strong>{fields.accountIdentifier}</strong></div>
              <div className="bank-detail-row"><span>Institution</span><strong>{fields.institution}</strong></div>
              <div className="bank-detail-row"><span>Amount</span><strong>{formatMoney(Number(fields.amount))}</strong></div>
              <div className="bank-detail-row"><span>Reference</span><strong>{fields.reference}</strong></div>
            </div>
            {stage === 'rejected' && <div className="bank-inline-alert" role="alert" data-testid="status-transfer-restriction">{exactRestriction}</div>}
            <div className="bank-inline-alert" role="note"><strong>Final attempt sends these details for a server-side check.</strong> No transfer is performed by this prototype.</div>
            <div className="bank-form-actions"><button className="bank-btn bank-btn-secondary" type="button" onClick={() => setStage('form')} data-testid="button-edit-transfer">Edit details</button><button className="bank-btn bank-btn-primary" type="button" onClick={attemptTransfer}>Submit final attempt <ArrowRight size={14} /></button></div>
          </>
        )}
      </section>
    </>
  );
}

export function BeneficiariesPage() {
  return (
    <>
      <PageHeading eyebrow="Beneficiaries" title="Beneficiaries" subtitle="Saved beneficiaries for this illustrative account." />
      <section className="bank-panel bank-account-detail">
        <div className="bank-detail-row"><span>Primary beneficiary</span><strong data-testid="text-beneficiary-name">Rachel Rebecca Grey</strong></div>
        <p className="bank-form-hint">This beneficiary is included for demonstration purposes only.</p>
      </section>
      <div className="bank-coming-links"><Link href="/dashboard" className="bank-btn bank-btn-secondary">Back to overview</Link></div>
    </>
  );
}

const unavailableCopy: Record<string, { title: string; description: string; eyebrow: string }> = {
  Statements: { title: 'Statements', description: 'Statement access is not available in this prototype. No statement files are connected.', eyebrow: 'Coming soon' },
  Cards: { title: 'Cards', description: 'Card controls are not connected in this prototype. No active or virtual cards are represented here.', eyebrow: 'Coming soon' },
  Beneficiaries: { title: 'Beneficiaries', description: 'Beneficiary management is not available in this prototype. No recipients have been saved.', eyebrow: 'Coming soon' },
  Security: { title: 'Security', description: 'Your sign-in remains protected by the existing authenticator verification. Additional account security controls are unavailable here.', eyebrow: 'Account protection' },
  Support: { title: 'Support', description: 'Support messaging is not connected in this prototype. You can still return to your account overview or review activity.', eyebrow: 'Help center' },
};
export function UnavailablePage({ section }: { section: keyof typeof unavailableCopy }) {
  const content = unavailableCopy[section];
  const unavailableHeading = section === 'Security' ? 'Additional security controls are not available yet' : `${section} are not available yet`;
  return (
    <>
      <PageHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.description} />
      <section className="bank-panel bank-coming"><span className="bank-party-mark"><CircleHelp size={20} /></span><h2>{unavailableHeading}</h2><p>This is an honest prototype state. No records, controls, or account actions are being simulated on this page.</p>
        <div className="bank-coming-links"><Link href="/dashboard" className="bank-text-link" data-testid="link-unavailable-dashboard">Back to overview <ArrowRight size={14} /></Link><Link href="/transactions" className="bank-text-link" data-testid="link-unavailable-transactions">Review credits <ArrowRight size={14} /></Link><Link href="/accounts" className="bank-text-link" data-testid="link-unavailable-accounts">Account details <ArrowRight size={14} /></Link></div>
      </section>
    </>
  );
}

export function ProfilePage() {
  return (
    <>
      <PageHeading eyebrow="Personal details" title="Profile" subtitle="The account owner shown throughout this prototype." />
      <PrototypeNotice />
      <section className="bank-panel bank-account-detail">
        <div className="bank-detail-row"><span>Account owner</span><strong data-testid="text-profile-name">{account.ownerName}</strong></div>
        <div className="bank-detail-row"><span>Account</span><strong>{account.accountType} · •••• {account.accountNumberEnding}</strong></div>
        <div className="bank-detail-row"><span>Sign-in protection</span><strong><ShieldCheck size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} />Authenticator verification</strong></div>
      </section>
      <div className="bank-coming-links"><Link href="/dashboard" className="bank-btn bank-btn-secondary" data-testid="link-profile-overview">Back to overview</Link></div>
    </>
  );
}
