import { AuthForm } from '@/components/auth-form';
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen bg-[#f4f7f6]">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-navy-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-aqua-500 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-aqua-300 blur-3xl"></div>
        </div>
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center overflow-hidden shadow-sm group">
            <img src="/logo.jpg" alt="IntervueAI Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight mb-0.5">IntervueAI</div>
            <div className="text-[10px] font-bold text-aqua-400 tracking-widest uppercase">Elite Evaluation</div>
          </div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold leading-tight mb-6">
            Your career journey<br />
            <span className="text-aqua-400">starts here.</span>
          </h1>
          <p className="text-slate-300 leading-relaxed max-w-md">
            Upload a CV or job description, generate tailored questions, and track how your answers improve over time.
          </p>
        </div>
        <div className="relative z-10 text-xs text-slate-500">
          © 2024 IntervueAI — Privacy First
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-navy-900 transition group">
           <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 group-hover:-translate-x-1 transition-transform">
             <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
           </svg>
           Back to Home
        </Link>
        <div className="w-full max-w-md">
          <AuthForm mode="register" />
        </div>
      </div>
    </main>
  );
}
