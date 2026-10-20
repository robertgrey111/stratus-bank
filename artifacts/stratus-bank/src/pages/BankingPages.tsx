import { useEffect, useMemo, useState } from 'react';
import { useSubmitTransfer, type TransferAttempt } from '@workspace/api-client-react';
import { ArrowDownLeft, ArrowRight, BadgeCheck, Check, ChevronRight, CircleHelp, Clock3, Eye, EyeOff, Search, Send, ShieldCheck, Wallet } from 'lucide-react';
import { Link } from 'wouter';
import { account, credits, formatMoney, formatRecordDate, openingBalance, type CreditRecord } from '../lib/banking-data';

function PageHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return <header className="bank-page-head"><div><p className="bank-kicker">{eyebrow}</p><h1>{title}</h1>{subtitle && <p className="bank-subtitle">{subtitle}</p>}</div></header>;
}

function StatusPill() {
  return <span className="bank-status"><BadgeCheck size={11} style={{ verticalAlign: '-2px', marginRight: 3 }} />Completed</span>;
}

function RecordRow({ record, onView }: { record: CreditRecord; onView: (item: CreditRecord) => void }) {
  return <article className="bank-activity-row" data-testid={`row-credit-${record.id}`}>
    <div className="bank-party"><span className="bank-party-mark"><ArrowDownLeft size={17} /></span><span className="bank-party-copy"><strong>{record.counterparty}</strong><span>{record.description}</span></span></div>
    <div className="bank-record-meta">Ref. {record.reference}</div>
    <div className="bank-record-meta">{formatRecordDate(record.date)}</div>
    <span className="bank-credit">CREDIT</span><span className="bank-record-amount">+{formatMoney(record.amount)}</span><StatusPill />
    <button className="bank-view" type="button" onClick={() => onView(record)} data-testid={`button-view-details-${record.id}`}>View Details</button>
  </article>;
}

function RecordDetails({ record, close }: { record: CreditRecord; close: () => void }) {
  return <div className="bank-record-modal" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) close(); }}>
    <section className="bank-record-dialog" role="dialog" aria-modal="true" aria-labelledby="credit-details-title" data-testid="dialog-credit-details">
      <div className="bank-record-dialog-head"><div><p className="bank-kicker">Credit record</p><h2 id="credit-details-title">{record.counterparty}</h2></div><button type="button" className="bank-close" onClick={close} aria-label="Close details" data-testid="button-close-details">×</button></div>
      <div className="bank-dialog-amount">+{formatMoney(record.amount)}</div>
      <div className="bank-detail-row"><span>Description</span><strong>{record.description}</strong></div>
      <div className="bank-detail-row"><span>Reference</span><strong>{record.reference}</strong></div>
      <div className="bank-detail-row"><span>Date and time</span><strong>{formatRecordDate(record.date)}</strong></div>
      <div className="bank-detail-row"><span>Type</span><strong className="bank-credit">Credit</strong></div>
      <div className="bank-detail-row"><span>Status</span><strong>Completed</strong></div>
    </section>
  </div>;
}

function CreditsList({ records }: { records: CreditRecord[] }) {
  const [selected, setSelected] = useState<CreditRecord | null>(null);
  return <>
    {records.length > 0 ? <div className="bank-panel bank-activity">{records.map(record => <RecordRow key={record.id} record={record} onView={setSelected} />)}</div> :
      <div className="bank-empty" data-testid="empty-credit-history"><Clock3 size={21} /><strong>No credits match this view</strong><p>Try another status or search term.</p></div>}
    {selected && <RecordDetails record={selected} close={() => setSelected(null)} />}
  </>;
}

function BalanceFlow() {
  const [range, setRange] = useState(90);
  const filtered = credits.filter(record => range === 0 || (Date.now() - record.date.getTime()) / 86400000 <= range);
  const plot = useMemo(() => {
    const points = filtered.slice().sort((a, b) => a.date.getTime() - b.date.getTime());
    const width = 620;
    const baseline = 146;
    const max = Math.max(...points.map(item => item.amount), 1);
    return points.map((item, index) => ({
      x: 36 + (points.length <= 1 ? 0 : index * (width - 70) / (points.length - 1)),
      y: baseline - (item.amount / max) * 92,
      height: (item.amount / max) * 92,
      date: item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount: item.amount,
    }));
  }, [filtered]);
  const total = filtered.reduce((sum, record) => sum + record.amount, 0);
  const rangeOptions = [{ label: '7 days', days: 7 }, { label: '30 days', days: 30 }, { label: '90 days', days: 90 }, { label: 'All Time', days: 0 }];
  return <section className="bank-panel bank-section" aria-labelledby="balance-flow-heading">
    <div className="bank-chart-head"><div><h2 id="balance-flow-heading">Balance Flow</h2><p>Credits received · {formatMoney(total)} across {filtered.length} records</p></div>
      <div className="bank-range" aria-label="Balance flow date range">{rangeOptions.map(option => <button key={option.label} type="button" aria-pressed={range === option.days} data-testid={`button-range-${option.label}`} onClick={() => setRange(option.days)}>{option.label}</button>)}</div>
    </div>
    <div className="bank-chart" data-testid="chart-balance-flow">
      <div className="bank-chart-legend"><span className="bank-legend-dot" /> Credits only</div>
      {plot.length ? <svg viewBox="0 0 680 170" role="img" aria-label={`Credit amounts over the selected ${range ? `${range} day` : 'all time'} range`}>
        {[30, 68, 106, 146].map(y => <line key={y} x1="25" y1={y} x2="660" y2={y} stroke="#edf1f5" strokeWidth="1" />)}
        {plot.map((point, index) => <g key={`${point.date}-${index}`} data-testid={`chart-credit-${index}`}><rect x={point.x - 12} y={point.y} width="24" height={point.height} rx="5" fill="#6f9fc8" /></g>)}
      </svg> : <div className="bank-empty">No credit records in this period.</div>}
      <div className="bank-chart-labels"><span>{plot[0]?.date || ''}</span><span>Credits only · no outgoing funds shown</span><span>{plot[plot.length - 1]?.date || ''}</span></div>
    </div>
  </section>;
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
  return <>
    <PageHeading eyebrow="Account overview" title={`${greeting}, Robert Grey.`} subtitle="Here’s your account at a glance." />
    <div className="bank-balance-layout">
      <section className="bank-panel bank-balance" aria-label="Checking account balance">
        <div className="bank-balance-top"><span>{account.accountType}</span><button className="bank-inline-button" type="button" onClick={() => setVisible(value => !value)} aria-label={visible ? 'Hide balance' : 'Show balance'}>{visible ? <EyeOff size={14} /> : <Eye size={14} />}</button></div>
        <div className="bank-balance-content"><div className="bank-balance-note">Available balance</div><div className="bank-amount" data-testid="text-available-balance">{visible ? formatMoney(account.availableBalance) : '••••'}</div></div>
        <div className="bank-balance-bottom"><span>•••• {account.accountNumberEnding}</span><span className="bank-status-secure"><ShieldCheck size={14} />Secure account</span></div>
      </section>
      <section className="bank-panel bank-action-panel"><div><h2>Move with confidence</h2><p>Review your account or start a deposit or transfer request.</p></div>
        <div className="bank-action-grid"><Link href="/deposit" className="bank-action" data-testid="link-action-deposit"><Wallet size={17} />Deposit</Link><Link href="/transfer" className="bank-action" data-testid="link-action-transfer"><Send size={17} />Transfer</Link></div>
      </section>
    </div>
    <section className="bank-section">
      <div className="bank-section-head"><h2>Recent Transaction Activities</h2><Link href="/transactions" className="bank-text-link" data-testid="link-view-all-transactions">View All Transactions <ArrowRight size={14} /></Link></div>
      <div className="bank-panel bank-activity">{credits.map(record => <RecordRow key={record.id} record={record} onView={setSelected} />)}</div>
    </section>
    <BalanceFlow />
    <section className="bank-section bank-panel bank-account-detail" aria-label="Account details">
      <div className="bank-detail-row"><span>Account owner</span><strong>{account.ownerName}</strong></div><div className="bank-detail-row"><span>Account type</span><strong>{account.accountType} · •••• {account.accountNumberEnding}</strong></div><div className="bank-detail-row"><span>Opening balance</span><strong>{formatMoney(openingBalance)}</strong></div>
    </section>
    {selected && <RecordDetails record={selected} close={() => setSelected(null)} />}
  </>;
}

export function AccountsPage() {
  const [visible, setVisible] = useState(true);
  return <>
    <PageHeading eyebrow="Your accounts" title="Checking account" subtitle="Account details and current balances." />
    <section className="bank-panel bank-balance" aria-label="Checking account balance">
      <div className="bank-balance-top"><span>{account.accountType}</span><button className="bank-inline-button" type="button" onClick={() => setVisible(value => !value)} data-testid="button-toggle-balance" aria-label={visible ? 'Hide balance' : 'Show balance'}>{visible ? <EyeOff size={14} /> : <Eye size={14} />}</button></div>
      <div className="bank-balance-content"><div className="bank-balance-note">Available balance</div><div className="bank-amount">{visible ? formatMoney(account.availableBalance) : '••••'}</div></div>
      <div className="bank-balance-bottom"><span>•••• {account.accountNumberEnding}</span><span className="bank-status-secure"><ShieldCheck size={14} />Secure account</span></div>
    </section>
    <section className="bank-section bank-panel bank-account-detail" aria-label="Checking account details">
      <div className="bank-detail-row"><span>Account owner</span><strong>{account.ownerName}</strong></div><div className="bank-detail-row"><span>Account type</span><strong>{account.accountType}</strong></div>
    </section>
    <div className="bank-coming-links"><Link href="/deposit" className="bank-btn bank-btn-primary" data-testid="link-account-deposit">Deposit <ArrowRight size={14} /></Link><Link href="/transfer" className="bank-btn" data-testid="link-account-transfer">Transfer</Link></div>
  </>;
}

export function TransactionsPage() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'All Credits' | 'Completed' | 'Pending'>('All Credits');
  const records = useMemo(() => credits.filter(record => {
    const q = query.trim().toLowerCase();
    const matches = !q || [record.counterparty, record.description, record.reference, formatRecordDate(record.date)].some(value => value.toLowerCase().includes(q));
    return matches && (filter !== 'Pending');
  }), [query, filter]);
  return <>
    <PageHeading eyebrow="Activity" title="Transactions" subtitle="A clear view of credits to your account." />
    <section className="bank-panel bank-toolbar" aria-label="Transaction filters">
      <label className="bank-search-wrap"><Search size={15} /><input className="bank-input" type="search" placeholder="Search credits" value={query} onChange={event => setQuery(event.target.value)} /></label>
      <div className="bank-filter-tabs" role="group" aria-label="Credit status filter">{(['All Credits', 'Completed', 'Pending'] as const).map(option => <button type="button" key={option} aria-pressed={filter === option} data-testid={`button-filter-${option.toLowerCase().replace(/\s+/g, '-')}`} onClick={() => setFilter(option)}>{option}</button>)}</div>
    </section>
    <section className="bank-section"><div className="bank-section-head"><h2>{filter} <span className="bank-form-hint" style={{ display: 'inline', marginLeft: 5 }}>({records.length})</span></h2></div><CreditsList records={records} /></section>
  </>;
}

type DepositFields = { amount: string; method: string; reference: string };
const emptyDeposit: DepositFields = { amount: '', method: 'Bank transfer', reference: '' };
export function DepositPage() {
  const [fields, setFields] = useState(emptyDeposit);
  const [stage, setStage] = useState<'form' | 'review' | 'complete'>('form');
  function update(key: keyof DepositFields, value: string) { setFields(current => ({ ...current, [key]: value })); }
  if (stage === 'complete') return <>
    <PageHeading eyebrow="Deposit" title="Deposit request" subtitle="Request complete." /><section className="bank-panel bank-complete" data-testid="status-deposit-prototype"><span className="bank-party-mark"><Check size={18} /></span><h2>Deposit complete</h2><p>Your deposit request has been added to the review queue.</p></section>
  </>;
  return <>
    <PageHeading eyebrow="Deposit" title={stage === 'review' ? 'Review deposit details' : 'Deposit'} subtitle={stage === 'review' ? 'Check the entered information before continuing.' : 'Review details before continuing.'} />
    <section className="bank-panel bank-form-card">
      {stage === 'form' ? <form onSubmit={event => { event.preventDefault(); setStage('review'); }} data-testid="form-deposit"><div className="bank-form-grid"><div className="bank-form-field"><label htmlFor="deposit-amount">Amount</label><input id="deposit-amount" className="bank-input" type="number" min="0.01" step="0.01" required value={fields.amount} onChange={event => update('amount', event.target.value)} /></div><div className="bank-form-field"><label htmlFor="deposit-method">Method</label><select id="deposit-method" className="bank-select" value={fields.method} onChange={event => update('method', event.target.value)}><option>Bank transfer</option><option>Debit card</option><option>Wire</option></select></div><div className="bank-form-field wide"><label htmlFor="deposit-reference">Reference</label><input id="deposit-reference" className="bank-input" maxLength={140} value={fields.reference} onChange={event => update('reference', event.target.value)} /></div></div><div className="bank-form-actions"><button className="bank-btn bank-btn-primary" type="submit" data-testid="button-review-deposit">Review details <ArrowRight size={14} /></button></div></form> : <>
        <p className="bank-kicker">Review before continuing</p><div className="bank-review"><div className="bank-detail-row"><span>Amount</span><strong>{formatMoney(Number(fields.amount) || 0)}</strong></div><div className="bank-detail-row"><span>Method</span><strong>{fields.method}</strong></div><div className="bank-detail-row"><span>Reference</span><strong>{fields.reference}</strong></div></div>
        <div className="bank-inline-alert" role="status"><strong>Review only.</strong> This step does not submit a deposit or change any balance.</div>
        <div className="bank-form-actions"><button className="bank-btn bank-btn-secondary" type="button" onClick={() => setStage('form')} data-testid="button-edit-deposit">Edit details</button><button className="bank-btn bank-btn-primary" type="button" onClick={() => setStage('complete')} data-testid="button-submit-deposit">Submit deposit request</button></div>
      </>}
    </section>
  </>;
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
    const transferAttempt: TransferAttempt = { ...fields, amount: Number(fields.amount) } as TransferAttempt;
    try { await submitTransfer.mutateAsync({ data: transferAttempt }); }
    catch { /* The API is expected to reject this attempt with HTTP 403. */ }
    setStage('rejected');
  }
  return <>
    <PageHeading eyebrow="Transfer" title={stage === 'review' ? 'Review transfer' : 'Transfer funds'} subtitle={stage === 'review' ? 'Review the recipient and amount before the final check.' : 'Send a transfer request for review.'} />
    <section className="bank-panel bank-form-card">
      {stage === 'form' ? <form onSubmit={event => { event.preventDefault(); setStage('review'); }} data-testid="form-transfer"><div className="bank-form-grid"><div className="bank-form-field"><label htmlFor="transfer-recipient">Recipient name</label><input id="transfer-recipient" className="bank-input" required maxLength={120} value={fields.recipientName} onChange={event => update('recipientName', event.target.value)} /></div><div className="bank-form-field"><label htmlFor="transfer-account">Account identifier</label><input id="transfer-account" className="bank-input" required maxLength={80} value={fields.accountIdentifier} onChange={event => update('accountIdentifier', event.target.value)} /></div><div className="bank-form-field"><label htmlFor="transfer-institution">Institution</label><input id="transfer-institution" className="bank-input" required maxLength={120} value={fields.institution} onChange={event => update('institution', event.target.value)} /></div><div className="bank-form-field"><label htmlFor="transfer-amount">Amount</label><input id="transfer-amount" className="bank-input" type="number" min="0.01" step="0.01" required value={fields.amount} onChange={event => update('amount', event.target.value)} /></div><div className="bank-form-field"><label htmlFor="transfer-type">Transfer type</label><select id="transfer-type" className="bank-select" value={fields.transferType} onChange={event => update('transferType', event.target.value)}><option value="domestic">Domestic</option><option value="international">International</option></select></div><div className="bank-form-field"><label htmlFor="transfer-reference">Reference</label><input id="transfer-reference" className="bank-input" maxLength={140} value={fields.reference} onChange={event => update('reference', event.target.value)} /></div></div><div className="bank-form-actions"><button className="bank-btn bank-btn-primary" type="submit" data-testid="button-review-transfer">Review transfer <ArrowRight size={14} /></button></div></form> : <>
        <p className="bank-kicker">Transfer review</p><div className="bank-review"><div className="bank-detail-row"><span>Recipient</span><strong>{fields.recipientName}</strong></div><div className="bank-detail-row"><span>Account identifier</span><strong>{fields.accountIdentifier}</strong></div><div className="bank-detail-row"><span>Amount</span><strong>{formatMoney(Number(fields.amount) || 0)}</strong></div></div>
        {stage === 'rejected' && <div className="bank-inline-alert" role="alert" data-testid="status-transfer-restriction">{exactRestriction}</div>}
        <div className="bank-inline-alert" role="note"><strong>Review only.</strong> No transfer is performed by this prototype.</div>
        <div className="bank-form-actions"><button className="bank-btn bank-btn-secondary" type="button" onClick={() => setStage('form')} data-testid="button-edit-transfer">Edit details</button><button className="bank-btn bank-btn-primary" type="button" onClick={attemptTransfer} data-testid="button-submit-transfer">Submit transfer</button></div>
      </>}
    </section>
  </>;
}

const unavailableCopy: Record<string, { title: string; description: string; eyebrow: string }> = {
  Statements: { title: 'Statements', description: 'Statement access is not available in this build.', eyebrow: 'Coming soon' },
  Cards: { title: 'Cards', description: 'Card controls are not available in this build.', eyebrow: 'Coming soon' },
  Beneficiaries: { title: 'Beneficiaries', description: 'Beneficiary management is not available in this build.', eyebrow: 'Coming soon' },
  Security: { title: 'Security', description: 'Additional security controls are not yet available.', eyebrow: 'Coming soon' },
  Support: { title: 'Support', description: 'Support messaging is not connected yet.', eyebrow: 'Help center' },
};
export function UnavailablePage({ section }: { section: keyof typeof unavailableCopy }) {
  const content = unavailableCopy[section];
  const unavailableHeading = section === 'Security' ? 'Additional security controls are not available yet' : `${section} are not available yet`;
  return <>
    <PageHeading eyebrow={content.eyebrow} title={content.title} subtitle={content.description} />
    <section className="bank-panel bank-coming"><span className="bank-party-mark"><CircleHelp size={20} /></span><h2>{unavailableHeading}</h2><p>This section is not available in the current build. Please return to the overview or transactions page.</p>
      <div className="bank-coming-links"><Link href="/dashboard" className="bank-text-link" data-testid="link-unavailable-dashboard">Back to overview <ArrowRight size={14} /></Link><Link href="/transactions" className="bank-text-link" data-testid="link-unavailable-transactions">View transactions <ChevronRight size={14} /></Link></div>
    </section>
  </>;
}

export function ProfilePage() {
  return <>
    <PageHeading eyebrow="Personal details" title="Profile" subtitle="The account owner shown throughout this build." />
    <section className="bank-panel bank-account-detail">
      <div className="bank-detail-row"><span>Account owner</span><strong data-testid="text-profile-name">{account.ownerName}</strong></div>
      <div className="bank-detail-row"><span>Account</span><strong>{account.accountType} · •••• {account.accountNumberEnding}</strong></div>
      <div className="bank-detail-row"><span>Sign-in protection</span><strong><ShieldCheck size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} />Authenticator verification</strong></div>
    </section>
    <div className="bank-coming-links"><Link href="/dashboard" className="bank-btn bank-btn-secondary" data-testid="link-profile-overview">Back to overview</Link></div>
  </>;
}
