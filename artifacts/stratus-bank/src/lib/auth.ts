import { createClient, type Session, type User } from '@supabase/supabase-js';

const pendingEmailKey = 'stratus.auth.pendingEmail';
let client: ReturnType<typeof createClient> | null = null;

export type StratusUser = {
  id: string;
  email: string;
  user_metadata?: { full_name?: string };
};
export type StratusSession = Pick<Session, 'access_token' | 'refresh_token'> & {
  user: StratusUser;
};
export type MfaAccessState =
  | { status: 'signed-out' }
  | { status: 'setup' | 'challenge' | 'authenticated'; session: StratusSession };
export type TotpEnrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

function getClient() {
  if (client) return client;
  const configuredUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = (
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
    || import.meta.env.VITE_SUPABASE_ANON_KEY
  ) as string | undefined;
  if (!configuredUrl || !key) {
    throw new Error('Secure sign-in is not connected yet. Add VITE_SUPABASE_URL and a Supabase publishable key to the app environment, then try again.');
  }

  let projectUrl: URL;
  try {
    projectUrl = new URL(configuredUrl.trim());
  } catch {
    throw new Error('The Supabase project URL is invalid. Set VITE_SUPABASE_URL to the project URL, not an API endpoint.');
  }
  if (!['https:', 'http:'].includes(projectUrl.protocol) || !projectUrl.hostname) {
    throw new Error('The Supabase project URL must be an HTTP or HTTPS project URL.');
  }

  // Supabase JS adds /auth/v1 itself. Passing an API path such as /rest/v1 here
  // causes the SDK to construct an invalid nested request path.
  const baseUrl = projectUrl.origin;
  client = createClient(baseUrl, key, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });
  return client;
}

function toStratusSession(session: Session, user: User = session.user): StratusSession {
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    user: {
      id: user.id,
      email: user.email ?? '',
      user_metadata: {
        full_name: typeof user.user_metadata.full_name === 'string'
          ? user.user_metadata.full_name
          : undefined,
      },
    },
  };
}

export async function signUp(email: string, password: string, fullName: string) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw error;
  sessionStorage.setItem(pendingEmailKey, email);
  return { requiresOtp: !data.session };
}

export async function verifyEmail(email: string, token: string) {
  const { data, error } = await getClient().auth.verifyOtp({
    email,
    token,
    type: 'signup',
  });
  if (error) throw error;
  if (!data.session) throw new Error('Email verification did not create a secure session. Please sign in and try again.');
  sessionStorage.removeItem(pendingEmailKey);
  return toStratusSession(data.session, data.user ?? data.session.user);
}

export async function resendSignupCode(email: string) {
  const { error } = await getClient().auth.resend({ type: 'signup', email });
  if (error) throw error;
}

export async function signIn(email: string, password: string): Promise<MfaAccessState> {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error('Your sign-in could not be completed. Check your details and try again.');
  return getMfaAccessState();
}

export async function getMfaAccessState(): Promise<MfaAccessState> {
  const supabase = getClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) return { status: 'signed-out' };
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    await supabase.auth.signOut({ scope: 'local' });
    return { status: 'signed-out' };
  }

  const [{ data: assurance, error: assuranceError }, { data: factors, error: factorsError }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);
  if (assuranceError) throw assuranceError;
  if (factorsError) throw factorsError;

  const session = toStratusSession(sessionData.session, userData.user);
  if (assurance.currentLevel === 'aal2' && assurance.nextLevel === 'aal2') {
    return { status: 'authenticated', session };
  }
  if (factors.totp.some(factor => factor.status === 'verified')) {
    return { status: 'challenge', session };
  }
  return { status: 'setup', session };
}

export async function beginTotpEnrollment(): Promise<TotpEnrollment> {
  const state = await getMfaAccessState();
  if (state.status === 'signed-out') {
    throw new Error('Sign in before setting up an authenticator.');
  }
  if (state.status === 'authenticated') {
    throw new Error('Your authenticator is already verified.');
  }
  if (state.status === 'challenge') {
    throw new Error('This account already has an authenticator. Enter its current code to continue.');
  }

  const supabase = getClient();
  const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
  if (factorsError) throw factorsError;
  const existingTotp = factors.all.find(factor => factor.factor_type === 'totp');
  if (existingTotp?.status === 'verified') {
    throw new Error('This account already has a verified authenticator. Return to sign-in and enter its current code.');
  }
  if (existingTotp) {
    throw new Error('Authenticator setup is already pending for this account. No new factor was created. Contact support to complete or remove the pending setup.');
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'Stratus Bank authenticator',
  });
  if (error) throw error;
  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
    secret: data.totp.secret,
  };
}

export async function getPendingTotpFactorId(): Promise<string | null> {
  const { data, error } = await getClient().auth.mfa.listFactors();
  if (error) throw error;
  return data.all.find(factor => factor.factor_type === 'totp' && factor.status === 'unverified')?.id ?? null;
}

export async function removePendingTotpFactor(factorId: string) {
  const supabase = getClient();
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  const factor = data.all.find(item => item.id === factorId);
  if (!factor || factor.factor_type !== 'totp' || factor.status !== 'unverified') {
    throw new Error('Only an unfinished authenticator setup can be removed here. Verified authenticators are protected.');
  }

  const { error: removeError } = await supabase.auth.mfa.unenroll({ factorId });
  if (removeError) throw removeError;
}

async function challengeAndVerifyTotp(factorId: string, code: string) {
  const supabase = getClient();
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) throw challengeError;

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
  if (verifyError) {
    const status = 'status' in verifyError
      ? (verifyError as typeof verifyError & { status?: number }).status
      : undefined;
    if (status === 400 || status === 401 || status === 403 || status === 404 || status === 422) {
      throw new Error('Invalid or expired code. Please try again.');
    }
    throw verifyError;
  }

  const state = await getMfaAccessState();
  if (state.status !== 'authenticated') {
    throw new Error('The authenticator code was accepted, but your session did not reach the required security level. Please sign in again.');
  }
}

export async function verifyTotpEnrollment(factorId: string, code: string) {
  await challengeAndVerifyTotp(factorId, code);
}

export async function verifyTotpSignIn(code: string) {
  const state = await getMfaAccessState();
  if (state.status === 'signed-out') {
    throw new Error('Your sign-in session has expired. Please sign in again.');
  }
  if (state.status === 'authenticated') return;
  if (state.status !== 'challenge') {
    throw new Error('Set up an authenticator before verifying a sign-in code.');
  }

  const supabase = getClient();
  const { data: factors, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  const factor = factors.totp.find(item => item.status === 'verified');
  if (!factor) {
    throw new Error('No verified authenticator was found for this account. Set one up to continue.');
  }
  await challengeAndVerifyTotp(factor.id, code);
}


export async function signOut() {
  const { error } = await getClient().auth.signOut();
  if (error) throw error;

  sessionStorage.removeItem(pendingEmailKey);
}

export async function requestEmailChange(newEmail: string) {
  const email = newEmail.trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.');
  }

  const supabase = getClient();
  const { data: sessionData, error: sessionError } =
    await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!sessionData.session) {
    throw new Error('Please sign in before changing your email.');
  }

  const { error } = await supabase.auth.updateUser({ email });

  if (error) throw error;
}
