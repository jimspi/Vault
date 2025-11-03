'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(1, 'Full name is required'),
});

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function signUp(formData: FormData) {
  const supabase = createClient();

  try {
    const validatedData = signUpSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
      fullName: formData.get('fullName'),
    });

    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          full_name: validatedData.fullName,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    if (data.session) {
      redirect('/dashboard');
    }

    // Email confirmation required
    redirect('/login?message=Check your email to confirm your account');
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect('/signup?error=' + encodeURIComponent(error.errors[0].message));
    }
    redirect('/signup?error=' + encodeURIComponent(error instanceof Error ? error.message : 'An error occurred'));
  }
}

export async function signIn(formData: FormData) {
  const supabase = createClient();

  try {
    const validatedData = signInSchema.parse({
      email: formData.get('email'),
      password: formData.get('password'),
    });

    const { error } = await supabase.auth.signInWithPassword({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      throw new Error(error.message);
    }

    redirect('/dashboard');
  } catch (error) {
    if (error instanceof z.ZodError) {
      redirect('/login?error=' + encodeURIComponent(error.errors[0].message));
    }
    redirect('/login?error=' + encodeURIComponent(error instanceof Error ? error.message : 'Invalid credentials'));
  }
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export async function resetPassword(formData: FormData) {
  const supabase = createClient();
  const email = formData.get('email') as string;

  if (!email) {
    redirect('/forgot-password?error=' + encodeURIComponent('Email is required'));
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
  });

  if (error) {
    redirect('/forgot-password?error=' + encodeURIComponent(error.message));
  }

  redirect('/login?message=' + encodeURIComponent('Check your email for password reset link'));
}

export async function updatePassword(formData: FormData) {
  const supabase = createClient();
  const password = formData.get('password') as string;

  if (!password || password.length < 8) {
    redirect('/auth/reset-password?error=' + encodeURIComponent('Password must be at least 8 characters'));
  }

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirect('/auth/reset-password?error=' + encodeURIComponent(error.message));
  }

  redirect('/dashboard');
}
