'use client';

import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
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
    scoreSummary: {
      totalScore: number;
      averageScore: number;
      strengths: string[];
      weaknesses: string[];
      improvementTips: string[];
    };
  };
};

export default function UploadPdfPage() {
  const navigate = useNavigate();
  const [, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      // Auto-submit on file select to match smooth UX
      handleUpload(selected);
    } else {
      setError('Please select a valid PDF file.');
    }
  };

  const handleUpload = async (selectedFile: File) => {
    setError('');
    const user = getStoredUser();
    if (!user) {
      navigate('/login');
      return;
    }

    const token = getStoredToken();
    setProcessing(true);
    setProgress(15); // Start progress

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      setProgress(35); // Uploading
      const uploadResponse = await apiForm<UploadResponse>('/api/upload-pdf', formData, token || undefined);
      
      setProgress(60); // Analyzing resume strength
      const analysisResponse = await apiJson<any>('/api/analyze-resume', {
        method: 'POST',
        body: { pdfText: uploadResponse.pdfText },
        token: token || undefined,
      });

      // Save analysis to user profile for dashboard access
      const updatedUserResponse = await apiJson<any>('/api/auth/resume-analysis', {
        method: 'PUT',
        body: analysisResponse,
        token: token || undefined,
      });

      // Update local storage so the dashboard reflects the new score immediately
      if (updatedUserResponse.user) {
        const currentUser = JSON.parse(window.localStorage.getItem('ai-smart-interview-user') || '{}');
        window.localStorage.setItem('ai-smart-interview-user', JSON.stringify({
          ...currentUser,
          ...updatedUserResponse.user
        }));
      }

      // Notify other components to refresh user data
      window.dispatchEvent(new Event('user-updated'));

      setProgress(80); // Generating questions
      const questionResponse = await apiJson<GeneratedQuestionsResponse>('/api/generate-questions', {
        method: 'POST',
        body: { pdfText: uploadResponse.pdfText },
        token: token || undefined,
      });

      setProgress(90); // Saving session
      const interviewResponse = await apiJson<StartInterviewResponse>('/api/start-interview', {
        method: 'POST',
        body: {
          pdfText: uploadResponse.pdfText,
          questions: questionResponse.questions,
        },
        token: token || undefined,
      });

      setProgress(100); // Done
      window.localStorage.setItem(
        'ai-smart-interview-session',
        JSON.stringify({
          interviewId: interviewResponse.interview._id,
          questions: interviewResponse.interview.questions,
          pdfText: uploadResponse.pdfText,
          userId: user.id,
          answers: [],
          scores: [],
          scoreSummary: interviewResponse.interview.scoreSummary,
        })
      );

      // Brief delay to show 100%
      setTimeout(() => {
        navigate('/interview-session');
      }, 500);
      
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to process PDF');
      setProcessing(false);
      setProgress(0);
    }
  };

  return (
    <Shell>
      <div className="max-w-3xl mx-auto mt-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-navy-900 tracking-tight mb-3">Upload Your Resume</h1>
          <p className="text-slate-500 text-lg">Our AI will analyze your experience to generate personalized interview simulations.</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        <div className="glass-panel p-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition relative overflow-hidden group min-h-[300px]">
          <input 
            type="file" 
            accept="application/pdf" 
            onChange={handleFileChange} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            disabled={processing}
          />
          
          <div className="w-16 h-16 bg-aqua-50 rounded-full flex items-center justify-center text-aqua-500 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          
          <div className="text-xl font-semibold text-navy-900 mb-1">
            Drag and drop your CV
          </div>
          <div className="text-slate-500 mb-8">
            or click to browse your files
          </div>
          
          <div className="px-6 py-2 bg-slate-200/60 text-slate-600 rounded-full text-sm font-medium flex items-center gap-2">
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            PDF Files Only (Max 10MB)
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mt-6">
          <div className="glass-panel p-6 flex gap-4 items-start">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 flex-shrink-0">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-navy-900 mb-1">Privacy First</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Your data is encrypted and used only for your private session simulations.</p>
            </div>
          </div>
          
          <div className="glass-panel p-6 flex gap-4 items-start">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 flex-shrink-0">
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.82 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.496 1.509 1.333 1.509 2.316V18" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-navy-900 mb-1">Pro Tip</h3>
              <p className="text-sm text-slate-500 leading-relaxed">A standard chronological PDF format works best for our AI parser.</p>
            </div>
          </div>
        </div>

        {processing && (
          <div className="mt-8 glass-panel p-6 bg-slate-50/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-navy-900 rounded-lg flex items-center justify-center text-white">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 animate-pulse">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-bold text-navy-900 text-sm">Analyzing Resume...</h4>
                  <p className="text-xs text-slate-500">Extracting skills and experience</p>
                </div>
              </div>
              <div className="font-bold text-aqua-600">{progress}%</div>
            </div>
            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-aqua-500 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
