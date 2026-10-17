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

function getClient() {
  if (client) return client;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
  if (!url || !key) {
    throw new Error('Secure sign-in is not connected yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the app environment, then try again.');
  }
  client = createClient(url, key, {
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
  const { data, error } = await getClient().auth.signUp({
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

export async function signIn(email: string, password: string) {
  const { data, error } = await getClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
  if (!data.session) throw new Error('Your sign-in could not be completed. Check your details and try again.');
  return toStratusSession(data.session, data.user);
}

export async function getCurrentUser() {
  const supabase = getClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (!sessionData.session) return null;
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    await supabase.auth.signOut({ scope: 'local' });
    return null;
  }
  return toStratusSession(sessionData.session, userData.user);
}

export function getPendingEmail() {
  return sessionStorage.getItem(pendingEmailKey) || '';
}

export async function signOut() {
  const { error } = await getClient().auth.signOut();
  if (error) throw error;
  sessionStorage.removeItem(pendingEmailKey);
}
