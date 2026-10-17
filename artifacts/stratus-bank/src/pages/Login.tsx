import { useState, type FormEvent } from 'react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import AuthLayout from '../components/AuthLayout';
import { signIn } from '../lib/auth';

export default function Login() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldError, setFieldError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setFieldError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFieldError('Enter a valid email address.'); return; }
    if (!password) { setFieldError('Enter your password.'); return; }
    setLoading(true);
    try { await signIn(email.trim(), password); setLocation('/dashboard'); }
    catch (err) { setError(err instanceof Error ? err.message : 'We could not sign you in. Please try again.'); }
    finally { setLoading(false); }
  }

  return <AuthLayout eyebrow="Welcome back" title="Your money is right where you left it." copy="Sign in securely to pick up where you left off. Your whole picture, ready when you are.">
    <h1 className="auth-title">Good to see you.</h1><p className="auth-subtitle">Sign in to your Stratus account.</p>
    <form className="auth-form" onSubmit={submit} noValidate>
      <div><label className="field-label" htmlFor="login-email">Email address</label><input id="login-email" className="field-control" type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" data-testid="input-email"/></div>
      <div><label className="field-label" htmlFor="login-password">Password</label><div className="field-wrap"><input id="login-password" className="field-control" type={showPassword?'text':'password'} autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password" data-testid="input-password"/><button className="field-toggle" type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?'Hide password':'Show password'} data-testid="button-toggle-password">{showPassword?<EyeOff size={16}/>:<Eye size={16}/>}</button></div></div>
      <div className="form-meta"><span>Use your email and password</span><span>Sign in securely</span></div>
      {fieldError && <div className="field-error" role="alert">{fieldError}</div>}
      {error && <div className="form-alert" role="alert" data-testid="status-login-error">{error}</div>}
      <button className="button auth-submit" disabled={loading} type="submit" data-testid="button-login">{loading?<><LoaderCircle size={16} className="animate-spin"/> Signing in…</>:'Sign in securely'}</button>
    </form>
    <p className="auth-switch">New to Stratus? <Link href="/signup" className="text-link">Open an account</Link></p>
    <p className="auth-legal">Your connection is protected with encrypted sign-in.</p>
  </AuthLayout>;
}
