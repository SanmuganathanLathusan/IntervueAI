'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shell } from '@/components/shell';
import { apiJson } from '@/lib/api';
import { getStoredToken, getStoredUser } from '@/lib/auth';
import type { ReportResponse } from '@/lib/types';

export default function ResultsPage() {
  const router = useRouter();
  const [report, setReport] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const loadReport = async () => {
      try {
        const token = getStoredToken();
        const response = await apiJson<ReportResponse>(`/api/report/${user.id}`, { token });
        setReport(response);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load results');
      } finally {
        setLoading(false);
      }
    };

    void loadReport();
  }, [router]);

  const latestInterview = report?.interviews?.[0];
  const score = latestInterview ? latestInterview.scoreSummary.averageScore * 10 : 0;

  return (
    <Shell>
      {loading ? (
        <div className="glass-panel p-8 text-center text-slate-500">Loading your performance results...</div>
      ) : error ? (
        <div className="glass-panel p-8 text-center text-red-500 border-red-200">{error}</div>
      ) : report && latestInterview ? (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
          
          {/* Top Summary Card */}
          <div className="glass-panel p-8 flex flex-col md:flex-row gap-8 items-center bg-gradient-to-br from-white to-aqua-50/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-aqua-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 opacity-50"></div>
            
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" stroke="#06b6d4" strokeWidth="8" 
                    strokeDasharray="283" strokeDashoffset={283 - (283 * score) / 100} 
                    strokeLinecap="round" 
                  />
                </svg>
                <div className="flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-navy-900">{score}</span>
                  <span className="text-xs font-medium text-slate-400">/ 100</span>
                </div>
              </div>
              <div className="mt-4 bg-aqua-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                {score >= 80 ? 'Exceptional Potential' : score >= 60 ? 'Strong Candidate' : 'Needs Practice'}
              </div>
            </div>

            <div className="flex-1 relative z-10">
              <h1 className="text-3xl font-bold text-navy-900 mb-3 tracking-tight">Interview Complete!</h1>
              <p className="text-slate-600 leading-relaxed max-w-xl mb-6">
                Your performance shows high technical proficiency and strong communication skills. You are in the <strong className="text-navy-900">top 5%</strong> of candidates for this role category.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="bg-navy-900 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-navy-800 transition shadow-sm">
                  Download Full Report
                </button>
                <button className="bg-white border border-slate-200 text-navy-900 px-6 py-2.5 rounded-xl font-semibold hover:bg-slate-50 transition shadow-sm">
                  Share Profile
                </button>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-[1.5fr_1fr] gap-6">
            {/* Key Strengths */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-aqua-600"><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
                <h2 className="text-xl font-bold text-navy-900">Key Strengths</h2>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {report.strengths.slice(0, 4).map((strength, idx) => (
                  <div key={idx} className="glass-panel p-5 border-l-4 border-l-aqua-500">
                    <h3 className="font-bold text-navy-900 mb-1">{strength}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Demonstrated effectively throughout the interview.
                    </p>
                  </div>
                ))}
                {report.strengths.length === 0 && (
                  <div className="glass-panel p-5 col-span-2 text-slate-500 italic">No strengths recorded.</div>
                )}
              </div>
            </div>

            {/* Growth Areas */}
            <div className="glass-panel p-6 bg-red-50/30 border-red-100 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-red-500"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
                <h2 className="text-xl font-bold text-navy-900">Growth Areas</h2>
              </div>
              <ul className="space-y-4 flex-1">
                {report.weaknesses.slice(0, 3).map((weakness, idx) => (
                  <li key={idx} className="flex gap-3 items-start">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0"></span>
                    <div>
                      <div className="font-semibold text-navy-900 mb-0.5">{weakness}</div>
                      <p className="text-sm text-slate-600">Consider focusing on this area in future sessions.</p>
                    </div>
                  </li>
                ))}
                {report.weaknesses.length === 0 && (
                  <li className="text-slate-500 italic">No major growth areas identified.</li>
                )}
              </ul>
              
              {report.improvementTips.length > 0 && (
                <div className="mt-6 bg-red-100 text-red-700 text-xs font-bold px-4 py-3 rounded-xl">
                  AI Tip: {report.improvementTips[0]}
                </div>
              )}
            </div>
          </div>

          {/* Question-by-Question Analysis */}
          <div>
            <h2 className="text-xl font-bold text-navy-900 mb-4">Question-by-Question Analysis</h2>
            <div className="space-y-4">
              {latestInterview.answers.map((answer, index) => (
                <div key={answer.questionId} className="glass-panel overflow-hidden border-slate-200 hover:shadow-md transition">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center cursor-pointer">
                    <div className="text-sm font-semibold text-slate-600">
                      Question {index + 1}: <span className="text-navy-900">Technical</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-aqua-600">{answer.score * 10}/100</span>
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 text-aqua-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="font-bold text-navy-900 mb-6 text-lg">"{answer.question}"</p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-2">Your Key Points</div>
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1">
                           <li>Answered completely</li>
                           <li>Used STAR method</li>
                           <li>{answer.strengths[0] || 'Good clarity'}</li>
                        </ul>
                      </div>
                      
                      <div className="bg-aqua-50/50 p-4 rounded-xl border border-aqua-100">
                        <div className="text-[10px] uppercase font-bold tracking-wider text-aqua-600 mb-2 flex items-center gap-1.5">
                          <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
                          AI Feedback
                        </div>
                        <p className="text-sm text-slate-700 italic">
                          "{answer.feedback}"
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-8 text-center text-slate-500">
          No completed sessions found. Upload a resume to start!
        </div>
      )}
    </Shell>
  );
}
