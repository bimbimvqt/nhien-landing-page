"use client";

import { FormEvent, useState } from "react";
import { Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { FcGoogle } from "react-icons/fc";

import { cn } from "@/lib/utils";

type SeraGoogleLoginFormProps = {
  loading?: boolean;
  error?: string | null;
  onPasswordLogin: (email: string, password: string) => void | Promise<void>;
  onGoogleLogin: () => void;
  className?: string;
};

function SeraGoogleLoginForm({
  loading = false,
  error,
  onPasswordLogin,
  onGoogleLogin,
  className,
}: SeraGoogleLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handlePasswordSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onPasswordLogin(email.trim(), password);
  };

  return (
    <div
      className={cn(
        "w-full max-w-[460px] rounded-[1.75rem] border border-white/15 bg-black px-7 py-9 text-white shadow-[0_36px_120px_-60px_rgba(255,255,255,0.28)] md:px-10",
        className,
      )}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-2xl border border-white/12 bg-zinc-900 text-zinc-400 shadow-inner">
          <UserRound className="h-9 w-9" strokeWidth={1.8} />
        </div>

        <h2 className="text-4xl font-black tracking-tight md:text-[2.65rem]">
          Welcome back
        </h2>
        <p className="mt-3 text-lg text-zinc-400">
          Sign in to continue
        </p>
      </div>

      {error && (
        <div className="mt-7 rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm font-semibold leading-6 text-rose-200">
          {error}
        </div>
      )}

      <form onSubmit={handlePasswordSubmit} className="mt-7 space-y-4">
        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            Email
          </span>
          <span className="flex h-14 items-center gap-3 rounded-2xl border border-white/12 bg-zinc-950 px-4 text-zinc-200 transition-colors focus-within:border-white/30">
            <Mail className="h-5 w-5 shrink-0 text-zinc-500" />
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              disabled={loading}
              placeholder="you@example.com"
              className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-zinc-700 disabled:cursor-not-allowed"
            />
          </span>
        </label>

        <label className="block">
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            Password
          </span>
          <span className="flex h-14 items-center gap-3 rounded-2xl border border-white/12 bg-zinc-950 px-4 text-zinc-200 transition-colors focus-within:border-white/30">
            <LockKeyhole className="h-5 w-5 shrink-0 text-zinc-500" />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              disabled={loading}
              placeholder="••••••••"
              className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-zinc-700 disabled:cursor-not-allowed"
            />
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white text-base font-bold text-zinc-950 transition-all hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
          {loading ? "Signing in..." : "Sign in with email"}
        </button>
      </form>

      <div className="my-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/14" />
        <span className="bg-black px-3 text-sm font-semibold uppercase tracking-[0.22em] text-zinc-500">
          Or
        </span>
        <div className="h-px flex-1 bg-white/14" />
      </div>

      <button
        type="button"
        onClick={onGoogleLogin}
        disabled={loading}
        className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl border border-white/12 bg-zinc-950 text-base font-bold text-white transition-all hover:border-white/25 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <FcGoogle className="h-6 w-6" />
        )}
        {loading ? "Opening Google..." : "Continue with Google"}
      </button>

      <p className="mx-auto mt-6 max-w-xs text-center text-sm leading-6 text-zinc-500">
        Admin accounts will be redirected to the dashboard. Other users remain on the landing page.
      </p>
    </div>
  );
}

export { SeraGoogleLoginForm };
