'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { getAuthRedirectUrl, isAdminUser } from '@/lib/auth';
import { SeraGoogleLoginForm } from '@/components/auth/SeraGoogleLoginForm';

const LoginPage = () => {
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (isAdminUser(user)) {
        router.replace('/admin/dashboard');
        return;
      }

      if (user) {
        setError('Tài khoản Google này chưa được cấp quyền quản trị.');
      }

      setCheckingSession(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setLoading(false);

      if (isAdminUser(user)) {
        router.replace('/admin/dashboard');
        return;
      }

      if (user) {
        setError('Tài khoản Google này chưa được cấp quyền quản trị.');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: getAuthRedirectUrl('/admin/login'),
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handlePasswordLogin = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Loader2 className="h-6 w-6 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black p-6 font-sans text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="relative w-full max-w-[460px]">
        <SeraGoogleLoginForm
          loading={loading}
          error={error}
          onPasswordLogin={handlePasswordLogin}
          onGoogleLogin={handleGoogleLogin}
        />
      </div>
    </div>
  );
};

export default LoginPage;
