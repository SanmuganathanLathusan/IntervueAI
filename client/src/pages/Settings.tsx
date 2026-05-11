'use client';

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shell } from '@/components/shell';
import { apiJson } from '@/lib/api';
import { getStoredUser, getStoredToken, saveSession } from '@/lib/auth';
import type { User } from '@/lib/types';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    setName(currentUser.name);
    setAvatar(currentUser.avatar || null);
  }, [navigate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = getStoredToken();
      if (!token) throw new Error('Not authenticated');

      const response = await apiJson<{ message: string; user: User; token: string }>('/api/auth/profile', {
        method: 'PUT',
        token,
        body: {
          name,
          avatar: avatar || undefined,
        },
      });

      // Update local storage
      saveSession({ token: response.token, user: response.user });
      setUser(response.user);
      setSuccess('Profile updated successfully!');
      
      // We want the shell to pick up the change immediately
      // dispatching an event can work, or just relying on page reload for simplicity if needed
      window.dispatchEvent(new Event('user-updated'));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const defaultAvatarUrl = user?.email 
    ? `https://i.pravatar.cc/150?u=${encodeURIComponent(user.email)}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0D8ABC&color=fff`;

  if (!user) {
    return <Shell><div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900"></div></div></Shell>;
  }

  return (
    <Shell title="Settings" subtitle="Manage your account profile and preferences">
      <div className="max-w-2xl mx-auto">
        <div className="glass-panel p-8">
          <h2 className="text-xl font-bold text-navy-900 mb-6">Profile Settings</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-soft overflow-hidden bg-slate-100 flex items-center justify-center">
                  {avatar ? (
                    <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <img 
                      src={defaultAvatarUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=0D8ABC&color=fff`;
                      }}
                    />
                  )}
                </div>
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-aqua-500 text-white rounded-full flex items-center justify-center shadow-sm border-2 border-white hover:bg-aqua-600 transition"
                  title="Change profile picture"
                >
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                  </svg>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
              <div>
                <h3 className="font-semibold text-navy-900 mb-1">Profile Picture</h3>
                <p className="text-sm text-slate-500 mb-3">Upload a square image, max 2MB.</p>
                {avatar && (
                  <button 
                    type="button" 
                    onClick={() => setAvatar(null)}
                    className="text-sm font-medium text-red-500 hover:text-red-600 transition"
                  >
                    Remove picture
                  </button>
                )}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-aqua-500 focus:ring-2 focus:ring-aqua-100"
                placeholder="Your full name"
                required
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-slate-500 outline-none cursor-not-allowed"
              />
              <p className="text-xs text-slate-400 mt-1.5">Email cannot be changed.</p>
            </div>

            {/* Alerts */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
            )}
            {success && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-600">{success}</div>
            )}

            {/* Submit */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading || !name.trim()}
                className="bg-navy-900 text-white font-bold py-3 px-6 rounded-xl hover:bg-navy-800 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Shell>
  );
}
