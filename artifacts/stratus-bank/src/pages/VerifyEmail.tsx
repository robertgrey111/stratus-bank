import { useEffect, useRef, useState, type SubmitEvent, type KeyboardEvent } from 'react';
import { ArrowRight, LoaderCircle, MailCheck } from 'lucide-react';
import { Link, useLocation } from 'wouter';
import AuthLayout from '../components/AuthLayout';
import { getPendingEmail, resendSignupCode, verifyEmail } from '../lib/auth';

export default function VerifyEmail() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [digits, setDigits] = useState(['','','','','','']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => { setEmail(getPendingEmail()); }, []);

  function updateDigit(index: number, value: string) {
    const entered = value.replace(/\D/g, '').slice(0, 6);
    if (entered.length > 1) {
      setDigits(current => current.map((item, i) => i >= index && i < index + entered.length ? entered[i - index] : item));
      inputs.current[Math.min(index + entered.length, 5)]?.focus();
      return;
    }
    const digit = entered.slice(-1);
    setDigits(current => current.map((item, i) => i === index ? digit : item));
    if (digit && index < 5) inputs.current[index + 1]?.focus();
  }
  function handleKey(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === 'ArrowLeft' && index > 0) inputs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < 5) inputs.current[index + 1]?.focus();
  }
   async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault(); setError(''); setSuccess('');
    if (!email) { setError('Your verification email is missing. Please return to account creation and try again.'); return; }
    const token = digits.join('');
    if (token.length !== 6) { setError('Enter the six-digit code from your email.'); return; }
    setLoading(true);
    try { await verifyEmail(email, token); setSuccess('Email verified. Preparing secure sign-in…'); setTimeout(()=>setLocation('/mfa-setup'),650); }
    catch (err) { setError(err instanceof Error ? err.message : 'That code could not be verified. Check it and try again.'); }
    finally { setLoading(false); }
  }
  async function resend() {
    setError(''); setSuccess('');
    if (!email) { setError('Your verification email is missing. Please return to account creation and try again.'); return; }
    setResending(true);
    try { await resendSignupCode(email); setSuccess('A new verification code is on its way.'); }
    catch (err) { setError(err instanceof Error ? err.message : 'We could not send a new code. Please try again.'); }
    finally { setResending(false); }
  }
  return <AuthLayout eyebrow="One last step" title="A quick check, then you’re in." copy="We use a one-time code to make sure your email address belongs to you. It only takes a moment.">
    <div className="verify-icon"><MailCheck size={25}/></div>
    <h1 className="auth-title">Check your inbox.</h1>
    <p className="auth-subtitle">Enter the six-digit code we sent to <strong>{email || 'your email address'}</strong>. Take a look in spam if you don’t see it.</p>
    <form className="auth-form" onSubmit={submit}>
      <div className="otp-row" aria-label="Six digit email verification code">
        {digits.map((digit,index)=><input key={index} ref={el=>{inputs.current[index]=el;}} className="otp-input" type="text" inputMode="numeric" autoComplete={index===0?'one-time-code':'off'} maxLength={1} value={digit} onChange={e=>updateDigit(index,e.target.value)} onKeyDown={e=>handleKey(index,e)} aria-label={`Code digit ${index+1}`} data-testid={`input-code-${index+1}`}/>)}
      </div>
      {error && <div className="form-alert" role="alert" data-testid="status-verify-error">{error}</div>}
      {success && <div className="form-success" role="status" data-testid="status-verify-success">{success}</div>}
      <button className="button auth-submit" disabled={loading} type="submit" data-testid="button-verify">{loading?<><LoaderCircle size={16} className="animate-spin"/> Verifying…</>:<>Verify email <ArrowRight size={15}/></>}</button>
    </form>
    <p className="auth-switch">Didn’t get a code? <button type="button" className="text-link" onClick={resend} disabled={resending} data-testid="button-resend-code">{resending?'Sending…':'Send a new code'}</button></p>
    <p className="auth-switch" style={{marginTop:12}}><Link href="/signup" className="text-link">Use a different email</Link></p>
  </AuthLayout>;
}
