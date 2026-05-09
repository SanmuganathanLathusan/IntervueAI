'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiJson } from '@/lib/api';
import { saveSession } from '@/lib/auth';
import type { User } from '@/lib/types';

type AuthFormProps = {
  mode: 'login' | 'register';
};

type AuthResponse = {
  token: string;
  user: User;
  message: string;
};

export const AuthForm = ({ mode }: AuthFormProps) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isRegister = mode === 'register';

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await apiJson<AuthResponse>(`/api/auth/${mode}`, {
        method: 'POST',
        body: isRegister ? { name, email, password } : { email, password },
      });
      saveSession({ token: response.token, user: response.user });
      router.push('/dashboard');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to complete authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-xs font-bold uppercase tracking-widest text-aqua-600 mb-3">
        {isRegister ? 'Create Account' : 'Welcome Back'}
      </div>
      <h2 className="text-3xl font-bold text-navy-900 mb-2">
        {isRegister ? 'Start Your AI Journey' : 'Sign In to Continue'}
      </h2>
      <p className="text-slate-500 mb-8 leading-relaxed">
        {isRegister
          ? 'Create your interview workspace and save your interview history securely.'
          : 'Pick up where you left off and review previous mock interview sessions.'}
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {isRegister && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-aqua-500 focus:ring-2 focus:ring-aqua-100"
              placeholder="Alex Sterling"
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-aqua-500 focus:ring-2 focus:ring-aqua-100"
            placeholder="you@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-aqua-500 focus:ring-2 focus:ring-aqua-100"
            placeholder="At least 6 characters"
            required
            minLength={6}
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-navy-900 text-white font-bold py-3.5 rounded-xl hover:bg-navy-800 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Processing...' : isRegister ? 'Create Account' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-slate-500">
        {isRegister ? 'Already have an account?' : 'Need an account?'}{' '}
        <Link href={isRegister ? '/login' : '/register'} className="font-bold text-aqua-600 hover:text-aqua-700">
          {isRegister ? 'Sign In' : 'Register'}
        </Link>
      </div>
    </div>
  );
};
