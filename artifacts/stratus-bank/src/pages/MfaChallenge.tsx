import { useEffect, useState, type FormEvent } from 'react';
import { LoaderCircle, ShieldCheck } from 'lucide-react';
import { useLocation } from 'wouter';
import AuthLayout from '../components/AuthLayout';
import { getMfaAccessState, signOut, verifyTotpSignIn } from '../lib/auth';

export default function MfaChallenge() {
  const [, setLocation] = useLocation();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    let active = true;
    getMfaAccessState()
      .then(access => {
        if (!active) return;
        if (access.status === 'signed-out') setLocation('/login');
        else if (access.status === 'authenticated') setLocation('/dashboard');
        else if (access.status === 'setup') setLocation('/mfa-setup');
        else setEmail(access.session.user.email);
      })
      .catch(cause => {
        if (active) setError(cause instanceof Error ? cause.message : 'We could not check your authenticator. Please try again.');
      })
      .finally(() => { if (active) setChecking(false); });
    return () => { active = false; };
  }, [setLocation]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the six-digit code shown in your authenticator app.');
      return;
    }
    setSubmitting(true);
    try {
      await verifyTotpSignIn(code);
      setLocation('/dashboard');
    } catch (cause) {
      setCode('');
      setError(cause instanceof Error ? cause.message : 'Invalid or expired code. Please try again.');
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
      eyebrow="Two-step sign-in"
      title="Your account, protected."
      copy="Use the current code from your authenticator app to finish signing in."
    >
      <div className="verify-icon"><ShieldCheck size={25} /></div>
      <h1 className="auth-title">Enter your verification code.</h1>
      <p className="auth-subtitle">
        {email ? <>Enter the current six-digit code for <strong>{email}</strong>.</> : 'Enter the current six-digit code from Google Authenticator.'}
      </p>
      {checking ? (
        <div className="mfa-loading" role="status">
          <LoaderCircle size={18} className="animate-spin" /> Checking your sign-in…
        </div>
      ) : (
        <form className="auth-form mfa-code-form" onSubmit={submit} noValidate>
          <div>
            <label className="field-label" htmlFor="totp-signin-code">Six-digit authenticator code</label>
            <input
              id="totp-signin-code"
              className="field-control mfa-code-control"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={event => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              data-testid="input-totp-signin-code"
            />
          </div>
          {error && <div className="form-alert" role="alert" data-testid="status-totp-signin-error">{error}</div>}
          <button className="button auth-submit" type="submit" disabled={submitting}>
            {submitting ? <><LoaderCircle size={16} className="animate-spin" /> Verifying…</> : 'Verify Code'}
          </button>
        </form>
      )}
      {checking && error && <div className="form-alert" role="alert" data-testid="status-totp-signin-error">{error}</div>}
      {!checking && error && <p className="mfa-help">Check that your iPhone’s date and time are set automatically, then try the latest code.</p>}
      <p className="auth-switch">
        <button type="button" className="text-link" onClick={leave}>Sign out</button>
      </p>
    </AuthLayout>
  );
}
