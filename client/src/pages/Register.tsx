import { AuthForm } from '@/components/auth-form';

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen bg-[#f4f7f6]">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-navy-900 text-white flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-aqua-500 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-aqua-300 blur-3xl"></div>
        </div>
        <div className="relative z-10">
          <div className="text-2xl font-bold tracking-tight mb-1">IntervueAI</div>
          <div className="text-xs font-bold text-aqua-400 tracking-widest uppercase">Elite Evaluation</div>
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

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <AuthForm mode="register" />
        </div>
      </div>
    </main>
  );
}
