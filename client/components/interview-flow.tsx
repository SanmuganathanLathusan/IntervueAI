'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiJson } from '@/lib/api';
import { clearSession, getStoredUser } from '@/lib/auth';
import type { InterviewSession, Question } from '@/lib/types';

type SessionStorageShape = {
  interviewId: string;
  questions: Question[];
  pdfText: string;
  userId: string;
  answers?: InterviewSession['answers'];
  scores?: number[];
  scoreSummary?: InterviewSession['scoreSummary'];
};

type EvaluationResponse = {
  evaluation: InterviewSession['answers'][number];
  interview: InterviewSession;
};

const SESSION_KEY = 'ai-smart-interview-session';
const RESULTS_KEY = 'ai-smart-interview-results';

export const InterviewFlow = () => {
  const router = useRouter();
  const [session, setSession] = useState<SessionStorageShape | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [draftAnswer, setDraftAnswer] = useState('');
  const [evaluation, setEvaluation] = useState<InterviewSession['answers'][number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const rawSession = window.localStorage.getItem(SESSION_KEY);
      if (!rawSession) {
        setError('No active interview session found. Upload a PDF first.');
      } else {
        setSession(JSON.parse(rawSession) as SessionStorageShape);
      }
    } catch {
      setError('Could not load your interview session.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const currentQuestion = useMemo(() => session?.questions[currentIndex] || null, [currentIndex, session]);

  const persistSession = (nextSession: SessionStorageShape) => {
    setSession(nextSession);
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
  };

  const handleSubmit = async () => {
    if (!session || !currentQuestion || !draftAnswer.trim()) {
      setError('Write an answer before continuing.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await apiJson<EvaluationResponse>('/api/evaluate-answer', {
        method: 'POST',
        body: {
          interviewId: session.interviewId,
          questionId: currentQuestion.id,
          question: currentQuestion.question,
          answer: draftAnswer,
        },
      });

      const nextSession: SessionStorageShape = {
        ...session,
        answers: response.interview.answers,
        scores: response.interview.scores,
        scoreSummary: response.interview.scoreSummary,
      };

      persistSession(nextSession);
      setEvaluation(response.evaluation);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to evaluate answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (!session) return;

    const isLastQuestion = currentIndex >= session.questions.length - 1;
    if (isLastQuestion) {
      const finalPayload = {
        interviewId: session.interviewId,
        questions: session.questions,
        answers: session.answers || [],
        scores: session.scores || [],
        scoreSummary: session.scoreSummary,
      };
      window.localStorage.setItem(RESULTS_KEY, JSON.stringify(finalPayload));
      router.push('/results');
      return;
    }

    setCurrentIndex((value) => value + 1);
    setEvaluation(null);
    setDraftAnswer('');
  };

  if (loading) {
    return <div className="glass-panel p-6 text-slate-500">Loading interview session...</div>;
  }

  if (error && !session) {
    return (
      <div className="glass-panel p-6 text-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button onClick={() => router.push('/upload-pdf')} className="bg-aqua-500 px-6 py-2 rounded-xl font-bold text-navy-900">
          Upload PDF
        </button>
      </div>
    );
  }

  if (!session || !currentQuestion) {
    return null;
  }

  const isLastQuestion = currentIndex >= session.questions.length - 1;

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-120px)] relative">
      {/* Top Session Header */}
      <div className="flex flex-wrap items-center justify-between mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-navy-900 tracking-tight">Interview Role</h1>
          <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
            <span>Session in progress</span>
            <span>&bull;</span>
            <span>Question {currentIndex + 1} of {session.questions.length}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {submitting && (
            <div className="flex items-center gap-2 text-xs font-bold text-aqua-600 bg-aqua-50 px-3 py-1.5 rounded-full uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-aqua-500 animate-pulse"></span>
              AI Processing
            </div>
          )}
          <button 
            onClick={handleNext}
            className="px-4 py-2 text-sm font-semibold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition bg-white"
          >
            End Session
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24 space-y-8 pr-4">
        {/* AI Interviewer Bubble */}
        <div className="flex gap-4">
          <div className="w-10 h-10 rounded-xl bg-navy-900 flex-shrink-0 flex items-center justify-center text-aqua-300">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 10.5h.008v.008H8.25V10.5zm5.25 0h.008v.008h-.008V10.5zm3.75 0h.008v.008h-.008V10.5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.39 0 4.56-.93 6.18-2.45A1.5 1.5 0 0021 18.25V12z" />
            </svg>
          </div>
          <div className="glass-panel p-6 w-full max-w-3xl rounded-tl-sm relative">
            <div className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">AI Interviewer</div>
            <p className="text-slate-700 leading-relaxed text-lg font-medium">{currentQuestion.question}</p>
          </div>
        </div>

        {/* Evaluation Output (if answered) */}
        {evaluation && (
          <div className="flex gap-4 justify-end">
             <div className="glass-panel p-6 w-full max-w-3xl rounded-tr-sm bg-aqua-50/50 border-aqua-100">
               <div className="flex justify-between items-start mb-4">
                 <div>
                   <div className="text-xs font-bold text-aqua-600 mb-1 uppercase tracking-wide">AI Feedback</div>
                   <div className="text-2xl font-bold text-navy-900">{evaluation.score}/10</div>
                 </div>
               </div>
               <p className="text-slate-700 leading-relaxed mb-4">{evaluation.feedback}</p>
               
               <div className="grid sm:grid-cols-2 gap-4 mb-4">
                 <div className="bg-white p-4 rounded-xl border border-slate-200">
                   <div className="text-xs font-bold text-emerald-600 mb-2 uppercase tracking-wider">Strengths</div>
                   <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                     {evaluation.strengths.map(s => <li key={s}>{s}</li>)}
                   </ul>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-slate-200">
                   <div className="text-xs font-bold text-amber-600 mb-2 uppercase tracking-wider">Growth Areas</div>
                   <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                     {evaluation.weaknesses.map(w => <li key={w}>{w}</li>)}
                   </ul>
                 </div>
               </div>
               
               <div className="bg-white p-4 rounded-xl border border-slate-200">
                 <div className="text-xs font-bold text-navy-900 mb-2 uppercase tracking-wider">Improved Answer</div>
                 <p className="text-sm text-slate-600 leading-relaxed">{evaluation.improvedAnswer}</p>
               </div>
               
               <button onClick={handleNext} className="mt-4 w-full bg-navy-900 text-white font-bold py-3 rounded-xl hover:bg-navy-800 transition">
                 {isLastQuestion ? 'Finish Interview' : 'Next Question'}
               </button>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-300 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center flex-shrink-0">
               <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User avatar" className="w-full h-full object-cover" />
             </div>
          </div>
        )}

        {/* User Response Draft (if not answered) */}
        {!evaluation && (
          <div className="flex gap-4 justify-end">
            <div className="bg-navy-900 text-white p-6 w-full max-w-3xl rounded-tr-sm rounded-2xl relative shadow-lg">
              <div className="flex justify-between items-center mb-4 text-xs font-bold text-slate-400 uppercase tracking-wide">
                <span>Your Response (Live Transcription)</span>
                <span className="flex items-center gap-2 text-aqua-400">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aqua-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-aqua-500"></span>
                  </span>
                  Listening...
                </span>
              </div>
              <textarea
                value={draftAnswer}
                onChange={(e) => setDraftAnswer(e.target.value)}
                placeholder="Start speaking or type your answer here..."
                className="w-full min-h-[150px] bg-transparent text-white placeholder:text-slate-500 resize-none outline-none text-lg leading-relaxed"
              />
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-300 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center flex-shrink-0">
               <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User avatar" className="w-full h-full object-cover" />
             </div>
          </div>
        )}
        
        {/* Metric Cards (Mock UI to match design) */}
        {!evaluation && (
          <div className="grid grid-cols-3 gap-4 max-w-3xl ml-auto mr-14">
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-aqua-50 text-aqua-600 flex items-center justify-center">
                 <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tone Analysis</div>
                <div className="text-sm font-bold text-navy-900">Confident & Clear</div>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" /></svg>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Speaking Pace</div>
                <div className="text-sm font-bold text-navy-900">145 WPM (Optimal)</div>
              </div>
            </div>
            <div className="glass-panel p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                 <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400">STAR Method</div>
                <div className="text-sm font-bold text-navy-900">Task Identified</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Bottom Input Bar */}
      {!evaluation && (
        <div className="absolute bottom-4 left-0 right-0 glass-panel p-2 pl-6 flex items-center gap-4 shadow-lg border-slate-300">
          <input 
            type="text" 
            placeholder="Type your response or click the mic to speak..." 
            value={draftAnswer}
            onChange={(e) => setDraftAnswer(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="flex-1 bg-transparent border-none outline-none text-slate-700"
          />
          <button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="w-10 h-10 rounded-full bg-navy-900 text-white flex items-center justify-center hover:bg-navy-800 transition shadow-sm"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 relative -right-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
          <button className="w-12 h-12 rounded-full bg-aqua-500 text-white flex items-center justify-center hover:bg-aqua-600 transition shadow-md">
             <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
             </svg>
          </button>
        </div>
      )}
    </div>
  );
};
