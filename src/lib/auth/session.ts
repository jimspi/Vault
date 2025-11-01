import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';

export const getSession = cache(async () => {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
});

export const getUser = cache(async () => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getProfile = cache(async () => {
  const supabase = createClient();
  const user = await getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile;
});

export const requireAuth = async () => {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return session;
};

export const requireProfile = async () => {
  await requireAuth();
  const profile = await getProfile();

  if (!profile) {
    redirect('/onboarding');
  }

  return profile;
};
