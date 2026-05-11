'use client';

import { Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shell } from '@/components/shell';
import { apiJson } from '@/lib/api';
import { getStoredToken, getStoredUser } from '@/lib/auth';
import type { ReportResponse } from '@/lib/types';

const formatDate = (dateStr: string) => {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return 'N/A';
  }
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');

  const loadDashboard = useCallback(async () => {
    const user = getStoredUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setUserName(user.name || 'User');

    try {
      const token = getStoredToken();
      const response = await apiJson<ReportResponse>(`/api/report/${user.id}`, { 
        token: token || undefined 
      });
      setReport(response);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadDashboard();
    // Re-fetch on profile updates so name and data stay current
    window.addEventListener('user-updated', loadDashboard);
    return () => window.removeEventListener('user-updated', loadDashboard);
  }, [loadDashboard]);

  // Derived display values — always computed from real API data, never faked
  const totalInterviews = report?.totalInterviews ?? 0;
  const avgScorePct =
    report && report.averageScore > 0 ? Math.min(100, Math.round(report.averageScore * 10)) : 0;

  return (
    <Shell>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-navy-900 tracking-tight">
          Welcome back, {userName || '…'}
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Ready to ace your next big opportunity?</p>
      </div>

      {loading ? (
        <div className="glass-panel p-8 text-center text-slate-500">
          Loading your performance data…
        </div>
      ) : error ? (
        <div className="glass-panel p-8 text-center text-red-500 border-red-200">{error}</div>
      ) : report ? (
        <div className="grid lg:grid-cols-[1fr_350px] gap-6">
          <div className="space-y-6">
            {/* Hero CTA */}
            <div className="bg-navy-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 w-64 h-64 bg-aqua-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
              <div className="inline-block px-3 py-1 bg-aqua-500/20 text-aqua-300 text-xs font-bold rounded-full mb-4 tracking-wide uppercase">
                AI Enabled
              </div>
              <h2 className="text-3xl font-bold mb-3">Master your narrative.</h2>
              <p className="text-slate-300 max-w-sm mb-8 leading-relaxed">
                Start a realistic mock interview tailored to your target role and experience level.
              </p>
              <Link to="/upload-pdf"
                className="inline-flex items-center gap-2 bg-white text-navy-900 px-6 py-3 rounded-xl font-semibold hover:bg-slate-100 transition shadow-sm"
              >
                Start New Interview
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            {/* Metrics */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Interviews count */}
              <div className="glass-panel p-6 flex flex-col justify-between h-40">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-aqua-600 flex items-center justify-center">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                    </svg>
                  </div>
                  {totalInterviews > 0 && (
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                      All time
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm text-slate-500 mb-1 font-medium">Total Mock Interviews</div>
                  <div className="text-3xl font-bold text-navy-900">{totalInterviews}</div>
                </div>
              </div>

              {/* Average score */}
              <div className="glass-panel p-6 flex flex-col justify-between h-40">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-aqua-600 flex items-center justify-center">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </div>
                  {avgScorePct >= 80 && (
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                      Top 5%
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-sm text-slate-500 mb-1 font-medium">Average Performance</div>
                  <div className="text-3xl font-bold text-navy-900">
                    {avgScorePct > 0 ? (
                      <>
                        {avgScorePct}
                        <span className="text-sm font-normal text-slate-400"> / 100</span>
                      </>
                    ) : (
                      <span className="text-xl font-semibold text-slate-400">No data yet</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Resume Strength score */}
              <div className="glass-panel p-6 flex flex-col justify-between h-40 bg-gradient-to-br from-white to-aqua-50/20">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 text-aqua-600 flex items-center justify-center">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <span className="text-xs font-bold text-aqua-600 bg-aqua-50 px-2 py-1 rounded-md">
                    AI Scored
                  </span>
                </div>
                <div>
                  <div className="text-sm text-slate-500 mb-1 font-medium">Resume Strength</div>
                  <div className="text-3xl font-bold text-navy-900">
                    {getStoredUser()?.resumeScore ? (
                      <>
                        {getStoredUser()?.resumeScore}
                        <span className="text-sm font-normal text-slate-400"> / 100</span>
                      </>
                    ) : (
                      <span className="text-xl font-semibold text-slate-400">Not analyzed</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* AI tip — only shown when real improvement tips exist */}
            {report?.improvementTips && report.improvementTips.length > 0 && (
              <div className="glass-panel p-6 flex items-start gap-6 relative overflow-hidden">
                <div className="w-12 h-12 rounded-full bg-aqua-50 flex-shrink-0 flex items-center justify-center text-aqua-600">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.82 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.496 1.509 1.333 1.509 2.316V18" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-navy-900 mb-1">AI Improvement Tip</h3>
                  <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
                    {report.improvementTips[0]}
                  </p>
                </div>
                <Link to="/results"
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-navy-900 hover:bg-slate-50 transition whitespace-nowrap"
                >
                  View Analysis
                </Link>
              </div>
            )}
          </div>

          {/* Recent Sessions sidebar */}
          <div className="glass-panel flex flex-col h-[550px]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-navy-900">Recent Sessions</h3>
              <Link to="/results" className="text-xs font-semibold text-aqua-600 hover:text-aqua-700">
                View All
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {report?.interviews && report.interviews.length > 0 ? (
                report.interviews.slice(0, 8).map((interview, i) => {
                  const sessionScore = Math.min(
                    100,
                    Math.round((interview.scoreSummary?.averageScore ?? 0) * 10)
                  );
                  return (
                    <div
                      key={interview._id || i}
                      className="p-4 hover:bg-slate-50 rounded-xl transition cursor-pointer flex justify-between items-center group"
                    >
                      <div>
                        <div className="font-medium text-navy-900 text-sm mb-1">
                          Session #{report.interviews.length - i}
                        </div>
                        <div className="text-xs text-slate-500">{formatDate(interview.createdAt)}</div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-navy-900 text-sm">{sessionScore}</span>
                          <div className="w-8 h-1 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-aqua-500 rounded-full"
                              style={{ width: `${sessionScore}%` }}
                            />
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
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8">
                  <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-slate-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-navy-900 mb-1">No sessions yet</p>
                  <p className="text-xs text-slate-400 mb-4">
                    Upload a resume to start your first mock interview
                  </p>
                  <Link to="/upload-pdf" className="text-xs font-bold text-aqua-600 hover:text-aqua-700 transition">
                    Start Now →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </Shell>
  );
}
