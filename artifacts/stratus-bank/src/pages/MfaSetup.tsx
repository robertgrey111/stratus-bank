import { useEffect, useState, type FormEvent } from 'react';
import { KeyRound, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useLocation } from 'wouter';
import AuthLayout from '../components/AuthLayout';
import {
  beginTotpEnrollment,
  getMfaAccessState,
  getPendingTotpFactorId,
  removePendingTotpFactor,
  signOut,
  verifyTotpEnrollment,
  type TotpEnrollment,
} from '../lib/auth';

export default function MfaSetup() {
  const [, setLocation] = useLocation();
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null);
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        const access = await getMfaAccessState();
        if (!active) return;
        if (access.status === 'signed-out') {
          setLocation('/login');
          return;
        }
        if (access.status === 'authenticated') {
          setLocation('/dashboard');
          return;
        }
        if (access.status === 'challenge') {
          setLocation('/mfa-challenge');
          return;
        }
        const pendingId = await getPendingTotpFactorId();
        if (active) setPendingFactorId(pendingId);
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : 'We could not start authenticator setup. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void initialize();
    return () => { active = false; };
  }, [setLocation]);

  async function startSetup() {
    setError('');
    setNotice('');
    setStarting(true);
    try {
      const setup = await beginTotpEnrollment();
      setEnrollment(setup);
    } catch (cause) {
      try {
        const pendingId = await getPendingTotpFactorId();
        if (pendingId) {
          setPendingFactorId(pendingId);
          return;
        }
      } catch {
        // Preserve the original enrollment error if the follow-up factor check also fails.
      }
      setError(cause instanceof Error ? cause.message : 'We could not start authenticator setup. Please try again.');
    } finally {
      setStarting(false);
    }
  }

  async function removePendingSetup() {
    if (!pendingFactorId) return;
    setError('');
    setNotice('');
    setRemoving(true);
    try {
      await removePendingTotpFactor(pendingFactorId);
      setPendingFactorId(null);
      setNotice('Pending authenticator setup removed. You can now start a fresh setup.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not remove the pending setup. Please try again.');
    } finally {
      setRemoving(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!enrollment) return;
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the six-digit code shown in your authenticator app.');
      return;
    }
    setSubmitting(true);
    try {
      await verifyTotpEnrollment(enrollment.factorId, code);
      setLocation('/dashboard');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'That code could not be verified. Check the code and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function leave() {
    setError('');
    try {
      await signOut();
      setLocation('/login');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not sign you out. Please try again.');
    }
  }

  return (
    <AuthLayout
      eyebrow="Secure your account"
      title="One more layer of protection."
      copy={pendingFactorId
        ? 'Your previous authenticator setup is unfinished. Remove it to discard its old QR code, then start again.'
        : 'Connect an authenticator app once. After that, use its current six-digit code whenever you sign in.'}
    >
      <div className="verify-icon"><ShieldCheck size={25} /></div>
      <h1 className="auth-title">Set up your authenticator.</h1>
      <p className="auth-subtitle">
        {pendingFactorId
          ? 'A pending setup has no usable verification code. Remove it below, then scan a new QR code with Google Authenticator.'
          : 'Scan this QR code with Google Authenticator on your iPhone, then confirm with the six-digit code it generates.'}
      </p>

      {loading && (
        <div className="mfa-loading" role="status">
          <LoaderCircle size={18} className="animate-spin" /> Checking your account…
        </div>
      )}
      {!loading && pendingFactorId && !enrollment && (
        <>
          <div className="form-alert" role="status">
            An authenticator setup is pending. Removing it will invalidate its old QR code; it will not remove a verified authenticator.
          </div>
          <button className="button auth-submit" type="button" onClick={removePendingSetup} disabled={removing}>
            {removing ? <><LoaderCircle size={16} className="animate-spin" /> Removing pending setup…</> : 'Remove pending setup'}
          </button>
        </>
      )}
      {!loading && !pendingFactorId && !enrollment && !error && (
        <button className="button auth-submit" type="button" onClick={startSetup} disabled={starting}>
          {starting ? <><LoaderCircle size={16} className="animate-spin" /> Preparing setup…</> : 'Set up authenticator'}
        </button>
      )}
      {starting && !enrollment && (
        <div className="mfa-loading" role="status">
          <LoaderCircle size={18} className="animate-spin" /> Preparing your secure setup…
        </div>
      )}
      {!loading && enrollment && (
        <>
          <div className="totp-qr-frame">
            <img className="totp-qr" src={enrollment.qrCode} alt="Authenticator enrollment QR code" />
          </div>
          <div className="totp-manual">
            <span className="totp-manual-title"><KeyRound size={14} /> Can’t scan? Enter this setup key manually</span>
            <code>{enrollment.secret}</code>
          </div>
          <p className="totp-safety">Keep this QR code and setup key private. Anyone who has them can generate sign-in codes for your account.</p>
          <form className="auth-form mfa-code-form" onSubmit={submit} noValidate>
            <div>
              <label className="field-label" htmlFor="totp-enrollment-code">Six-digit authenticator code</label>
              <input
                id="totp-enrollment-code"
                className="field-control mfa-code-control"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                aria-describedby="totp-enrollment-help"
                data-testid="input-totp-enrollment-code"
              />
              <span id="totp-enrollment-help" className="mfa-help">This confirms Google Authenticator is generating valid codes.</span>
            </div>
            {error && <div className="form-alert" role="alert" data-testid="status-totp-enrollment-error">{error}</div>}
            <button className="button auth-submit" type="submit" disabled={submitting || !enrollment}>
              {submitting ? <><LoaderCircle size={16} className="animate-spin" /> Verifying…</> : 'Verify and secure account'}
            </button>
          </form>
        </>
      )}
      {notice && <div className="form-success" role="status">{notice}</div>}
      {!loading && !enrollment && error && (
        <div className="form-alert" role="alert" data-testid="status-totp-setup-error">{error}</div>
      )}
      <p className="auth-switch">
        <button type="button" className="text-link" onClick={leave}>Sign out</button>
      </p>
    </AuthLayout>
  );
}
