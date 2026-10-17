import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import AuthLayout from '../components/AuthLayout';
import { signUp } from '../lib/auth';

export default function Signup() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setFieldError('');
    if (name.trim().length < 2) { setFieldError('Enter your name as it appears on your ID.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError('Enter a valid email address.'); return; }
    if (password.length < 8) { setFieldError('Choose a password with at least 8 characters.'); return; }
    if (!agreed) { setFieldError('Please agree to the account terms to continue.'); return; }
    setLoading(true);
    try {
      const result = await signUp(email.trim(), password, name.trim());
      setLocation(result.requiresOtp ? '/verify-email' : '/dashboard');
    }
    catch (err) { setError(err instanceof Error ? err.message : 'We could not create your account. Please try again.'); }
    finally { setLoading(false); }
  }

  return <AuthLayout eyebrow="A better banking day" title="A fresh start for your finances." copy="Create your secure Stratus account in a few simple steps. It begins with a clear view and a little less friction.">
    <h1 className="auth-title">Let’s get started.</h1><p className="auth-subtitle">A few details, then we’ll send a code to verify your email.</p>
    <form className="auth-form" onSubmit={submit} noValidate>
      <div><label className="field-label" htmlFor="signup-name">Full name</label><input id="signup-name" className="field-control" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="Name as it appears on your ID" data-testid="input-full-name"/></div>
      <div><label className="field-label" htmlFor="signup-email">Email address</label><input id="signup-email" className="field-control" type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" data-testid="input-signup-email"/></div>
      <div><label className="field-label" htmlFor="signup-password">Create password</label><div className="field-wrap"><input id="signup-password" className="field-control" type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" placeholder="At least 8 characters" data-testid="input-signup-password"/><button className="field-toggle" type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Hide password':'Show password'} data-testid="button-toggle-signup-password">{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></div>
      <label className="checkline"><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} data-testid="checkbox-terms"/><span>I agree to the Stratus account terms and acknowledge the privacy notice.</span></label>
      {fieldError && <div className="field-error" role="alert">{fieldError}</div>}
      {error && <div className="form-alert" role="alert" data-testid="status-signup-error">{error}</div>}
      <button className="button auth-submit" disabled={loading} type="submit" data-testid="button-create-account">{loading?<><LoaderCircle size={16} className="animate-spin"/> Creating account…</>:'Create account'}</button>
    </form>
    <p className="auth-switch">Already have an account? <Link href="/login" className="text-link">Sign in</Link></p>
    <p className="auth-legal">We’ll email a one-time code to confirm it’s you.</p>
  </AuthLayout>;
}
