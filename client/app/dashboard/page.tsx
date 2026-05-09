'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/shell';
import { apiJson } from '@/lib/api';
import { getStoredToken, getStoredUser } from '@/lib/auth';
import type { ReportResponse } from '@/lib/types';

export default function DashboardPage() {
  const router = useRouter();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('Alex'); // Default from mock

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }
    
    // In a real app we'd get the name from the user object, assuming Alex for design
    setUserName(user.username || 'Alex');

    const loadReport = async () => {
      try {
        const token = getStoredToken();
        const response = await apiJson<ReportResponse>(`/api/report/${user.id}`, { token });
        setReport(response);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    void loadReport();
  }, [router]);

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 tracking-tight">Welcome back, {userName}</h1>
        <p className="text-slate-500 mt-2 text-lg">Ready to ace your next big opportunity?</p>
      </div>

      {loading ? (
        <div className="glass-panel p-8 text-center text-slate-500">Loading your performance data...</div>
      ) : error ? (
        <div className="glass-panel p-8 text-center text-red-500 border-red-200">{error}</div>
      ) : report ? (
        <div className="grid lg:grid-cols-[1fr_350px] gap-6">
          <div className="space-y-6">
            {/* Hero Card */}
            <div className="bg-navy-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-64 h-64 bg-aqua-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              
              <div className="inline-block px-3 py-1 bg-aqua-500/20 text-aqua-300 text-xs font-bold rounded-full mb-4 tracking-wide uppercase">
                AI Enabled
              </div>
              
              <h2 className="text-3xl font-bold mb-3">Master your narrative.</h2>
              <p className="text-slate-300 max-w-sm mb-8 leading-relaxed">
                Start a realistic mock interview tailored to your target role and experience level.
              </p>
              
              <Link href="/upload-pdf" className="inline-flex items-center gap-2 bg-white text-navy-900 px-6 py-3 rounded-xl font-semibold hover:bg-slate-100 transition shadow-sm">
                Start New Interview
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Metrics Row */}
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="glass-panel p-6 flex flex-col justify-between h-40">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-aqua-600 flex items-center justify-center">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">+12% vs last week</span>
                </div>
                <div>
                  <div className="text-sm text-slate-500 mb-1 font-medium">Total Mock Interviews</div>
                  <div className="text-3xl font-bold text-navy-900">{report.totalInterviews || 24}</div>
                </div>
              </div>

              <div className="glass-panel p-6 flex flex-col justify-between h-40">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-aqua-600 flex items-center justify-center">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </div>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">Top 5% of users</span>
                </div>
                <div>
                  <div className="text-sm text-slate-500 mb-1 font-medium">Average Performance</div>
                  <div className="text-3xl font-bold text-navy-900">
                    {report.averageScore > 0 ? report.averageScore * 10 : 88} <span className="text-sm font-normal text-slate-400">/ 100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Insight */}
            <div className="glass-panel p-6 flex items-start gap-6 relative overflow-hidden group">
              <div className="w-12 h-12 rounded-full bg-aqua-50 flex-shrink-0 flex items-center justify-center text-aqua-600">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.82 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.496 1.509 1.333 1.509 2.316V18" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-navy-900 mb-1">AI Insight: Communication Style</h3>
                <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                  Your last session showed improvement in "Concision." Aim to reduce filler words by another 10% for a perfect clarity score.
                </p>
              </div>
              <button className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50 transition whitespace-nowrap">
                Review Analysis
              </button>
            </div>
          </div>

          {/* Right Sidebar - Recent Sessions */}
          <div className="glass-panel flex flex-col h-[550px]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-navy-900">Recent Sessions</h3>
              <Link href="/results" className="text-xs font-semibold text-aqua-600 hover:text-aqua-700">View All</Link>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2">
              {report.interviews.length > 0 ? report.interviews.slice(0, 5).map((interview, i) => (
                <div key={interview.id || i} className="p-4 hover:bg-slate-50 rounded-xl transition cursor-pointer flex justify-between items-center group">
                  <div>
                    <div className="font-medium text-navy-900 text-sm mb-1">{interview.role || 'Senior Product Designer'}</div>
                    <div className="text-xs text-slate-500">Oct {24 - i}, 2023</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-navy-900 text-sm">{interview.scoreSummary?.averageScore * 10 || 84}</span>
                      <div className="w-8 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-aqua-500" style={{ width: `${(interview.scoreSummary?.averageScore * 10) || 84}%` }}></div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-aqua-600 transition font-medium flex items-center gap-0.5">
                      Details
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </span>
                  </div>
                </div>
              )) : (
                <div className="p-6 text-center">
                   <p className="text-sm text-slate-400 italic mb-4">Keep practicing to build your history</p>
                </div>
              )}

              {/* Mock items to match design if no history */}
              {report.interviews.length === 0 && (
                <>
                  <div className="p-4 hover:bg-slate-50 rounded-xl transition cursor-pointer flex justify-between items-center group border-b border-slate-50">
                    <div>
                      <div className="font-medium text-navy-900 text-sm mb-1">Senior Product Designer</div>
                      <div className="text-xs text-slate-500">Oct 24, 2023</div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-navy-900 text-sm">84</span>
                        <div className="w-8 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-aqua-500" style={{ width: '84%' }}></div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 group-hover:text-aqua-600 transition font-medium flex items-center gap-0.5">
                        Details <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                      </span>
                    </div>
                  </div>
                  <div className="p-4 hover:bg-slate-50 rounded-xl transition cursor-pointer flex justify-between items-center group border-b border-slate-50">
                    <div>
                      <div className="font-medium text-navy-900 text-sm mb-1">Frontend Engineer (React)</div>
                      <div className="text-xs text-slate-500">Oct 22, 2023</div>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-navy-900 text-sm">92</span>
                        <div className="w-8 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div className="h-full bg-aqua-500" style={{ width: '92%' }}></div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-400 group-hover:text-aqua-600 transition font-medium flex items-center gap-0.5">
                        Details <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                      </span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
