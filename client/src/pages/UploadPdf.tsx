'use client';

import { useNavigate } from 'react-router-dom';
import { useState, useCallback, useEffect } from 'react';
import { Shell } from '@/components/shell';
import { apiForm, apiJson } from '@/lib/api';
import { getStoredToken, getStoredUser } from '@/lib/auth';
import type { Question } from '@/lib/types';

type UploadResponse = {
  pdfText: string;
  fileName: string;
  filePath: string;
};

type GeneratedQuestionsResponse = {
  questions: Question[];
};

type StartInterviewResponse = {
  interview: {
    _id: string;
    questions: Question[];
    answers: unknown[];
    scores: number[];
  };
};

type ProcessingStatus = 'idle' | 'uploading' | 'analyzing' | 'generating' | 'saving' | 'error' | 'success';

export default function UploadPdfPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ProcessingStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<{message: string, code?: number}>({message: ''});
  const [retryTimer, setRetryTimer] = useState(0);

  // Handle countdown for 429 errors
  useEffect(() => {
    if (retryTimer > 0) {
      const id = setInterval(() => setRetryTimer(prev => prev - 1), 1000);
      return () => clearInterval(id);
    }
  }, [retryTimer]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      if (status !== 'idle' && status !== 'error') return;
      handleUpload(selected);
    } else {
      setError({message: 'Please select a valid PDF file.'});
    }
  };

  const handleUpload = useCallback(async (selectedFile: File) => {
    if (status !== 'idle' && status !== 'error') return;
    
    setError({message: ''});
    const user = getStoredUser();
    const token = getStoredToken();
    
    if (!user || !token) {
      navigate('/login');
      return;
    }

    setStatus('uploading');
    setProgress(10);

    try {
      // 1. Upload & Extract Text
      const formData = new FormData();
      formData.append('file', selectedFile);
      const uploadData = await apiForm<UploadResponse>('/api/upload-pdf', formData, token);
      
      setProgress(40);
      setStatus('analyzing');

      // 2. Analyze Resume
      const analysisData = await apiJson<any>('/api/analyze-resume', {
        method: 'POST',
        body: { pdfText: uploadData.pdfText },
        token,
      });

      // 3. Save Analysis
      await apiJson<any>('/api/auth/resume-analysis', {
        method: 'PUT',
        body: analysisData,
        token,
      });

      // Update local user data
      const currentUser = JSON.parse(window.localStorage.getItem('ai-smart-interview-user') || '{}');
      window.localStorage.setItem('ai-smart-interview-user', JSON.stringify({
        ...currentUser,
        resumeScore: analysisData.score,
        resumeAnalysis: analysisData
      }));
      window.dispatchEvent(new Event('user-updated'));

      setProgress(70);
      setStatus('generating');

      // 4. Generate Questions
      const questionData = await apiJson<GeneratedQuestionsResponse>('/api/generate-questions', {
        method: 'POST',
        body: { pdfText: uploadData.pdfText },
        token,
      });

      setProgress(90);
      setStatus('saving');

      // 5. Start Interview Session
      const interviewData = await apiJson<StartInterviewResponse>('/api/start-interview', {
        method: 'POST',
        body: {
          pdfText: uploadData.pdfText,
          questions: questionData.questions,
        },
        token,
      });

      setProgress(100);
      setStatus('success');

      window.localStorage.setItem(
        'ai-smart-interview-session',
        JSON.stringify({
          interviewId: interviewData.interview._id,
          questions: interviewData.interview.questions,
          pdfText: uploadData.pdfText,
          userId: user.id,
          answers: [],
          scores: [],
        })
      );

      setTimeout(() => navigate('/interview-session'), 800);
      
    } catch (err: any) {
      const code = err.status || 500;
      const message = err.message || 'Unable to process PDF. Please try again.';
      
      setError({ message, code });
      setStatus('error');
      setProgress(0);
      
      if (code === 429) {
        setRetryTimer(60);
      }
    }
  }, [status, navigate]);

  return (
    <Shell>
      <div className="max-w-3xl mx-auto mt-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-navy-900 tracking-tight mb-3">Upload Your Resume</h1>
          <p className="text-slate-500 text-lg">Our AI will analyze your experience to generate personalized interview simulations.</p>
        </div>

        {error.message && (
          <div className={`mb-6 p-4 rounded-xl text-center font-medium border ${
            error.code === 429 ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-600'
          }`}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-bold">{error.code === 429 ? 'Rate Limit Exceeded' : 'Error'}</span>
            </div>
            {error.message}
            {retryTimer > 0 && (
              <div className="mt-2 text-sm opacity-80">
                You can try again in <span className="font-bold font-mono">{retryTimer}s</span>
              </div>
            )}
          </div>
        )}

        <div className={`glass-panel p-10 flex flex-col items-center justify-center border-2 border-dashed transition relative overflow-hidden group min-h-[300px] ${
          status !== 'idle' && status !== 'error' ? 'border-slate-200 bg-slate-50/30' : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 cursor-pointer'
        }`}>
          {(status === 'idle' || status === 'error') && retryTimer === 0 ? (
            <>
              <input 
                type="file" 
                accept="application/pdf" 
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-16 h-16 bg-aqua-50 rounded-full flex items-center justify-center text-aqua-500 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div className="text-xl font-semibold text-navy-900 mb-1">Drag and drop your CV</div>
              <div className="text-slate-500 mb-8">or click to browse your files</div>
              <div className="px-6 py-2 bg-slate-200/60 text-slate-600 rounded-full text-sm font-medium flex items-center gap-2">
                PDF Files Only (Max 10MB)
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center">
               <div className="w-20 h-20 mb-6 relative">
                 <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                 <div 
                   className="absolute inset-0 rounded-full border-4 border-aqua-500 border-t-transparent animate-spin"
                 ></div>
                 <div className="absolute inset-0 flex items-center justify-center text-2xl">
                   {status === 'uploading' && '📄'}
                   {status === 'analyzing' && '🧠'}
                   {status === 'generating' && '✨'}
                   {status === 'saving' && '💾'}
                   {status === 'error' && '⏳'}
                 </div>
               </div>
               <h3 className="text-xl font-bold text-navy-900 mb-2">
                 {status === 'uploading' && 'Uploading PDF...'}
                 {status === 'analyzing' && 'Analyzing Content...'}
                 {status === 'generating' && 'Generating Questions...'}
                 {status === 'saving' && 'Preparing Session...'}
                 {status === 'error' && retryTimer > 0 && 'Cooldown Period'}
               </h3>
               <p className="text-slate-500 max-w-xs">
                 {status === 'uploading' && 'Sending your file to our secure server.'}
                 {status === 'analyzing' && 'Extracting skills and professional experience.'}
                 {status === 'generating' && 'Creating personalized interview questions.'}
                 {status === 'saving' && 'Almost ready. Setting up your workspace.'}
                 {status === 'error' && retryTimer > 0 && `The AI is currently busy. Please wait ${retryTimer}s.`}
               </p>
               
               {progress > 0 && (
                 <div className="mt-8 w-64">
                    <div className="flex justify-between text-xs font-bold text-slate-400 mb-2">
                      <span>PROGRESS</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-aqua-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mt-6">
          <div className="glass-panel p-6 flex gap-4 items-start">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-navy-900 mb-1">Privacy First</h3>
              <p className="text-sm text-slate-500">Your data is used only for your private simulations.</p>
            </div>
          </div>
          <div className="glass-panel p-6 flex gap-4 items-start">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-navy-900 mb-1">Limits</h3>
              <p className="text-sm text-slate-500">Free tier allows up to 2 resume analyses per minute.</p>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
}
