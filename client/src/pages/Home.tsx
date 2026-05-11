import { Link } from 'react-router-dom';

const features = [
  {
    icon: '📄',
    title: 'PDF Understanding',
    description: 'Upload a CV, job description, or study notes and let the backend extract the content automatically.',
  },
  {
    icon: '🎯',
    title: 'Role-Aware Questions',
    description: 'Generate 5 technical, 3 HR, and 2 scenario-based questions tailored to the uploaded document.',
  },
  {
    icon: '⚡',
    title: 'AI Evaluation',
    description: 'Score each answer from 0 to 10 and get instant feedback, strengths, weaknesses, and a better answer.',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f4f7f6] text-navy-900">
      {/* Navbar */}
      <header className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div>
          <span className="text-xl font-bold tracking-tight text-navy-900">IntervueAI</span>
          <span className="ml-2 text-[10px] font-bold text-aqua-600 tracking-widest uppercase">Elite Evaluation</span>
        </div>
        <nav className="flex items-center gap-4 text-sm font-semibold">
          <Link to="/login" className="text-slate-600 hover:text-navy-900 transition">Login</Link>
          <Link to="/register" className="bg-navy-900 text-white px-5 py-2.5 rounded-xl hover:bg-navy-800 transition shadow-sm">
            Get Started
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-aqua-50 text-aqua-700 px-4 py-2 rounded-full text-sm font-semibold mb-8 border border-aqua-200">
            <span className="w-2 h-2 rounded-full bg-aqua-500 animate-pulse"></span>
            AI Enabled — Powered by Gemini 2.5
          </div>
          <h1 className="text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-navy-900 mb-6">
            Master your <span className="text-aqua-600">narrative.</span><br />Land the role.
          </h1>
          <p className="text-xl text-slate-500 leading-relaxed mb-10 max-w-lg">
            Upload your resume or a job description. Get personalized interview questions powered by AI. Practice, get feedback, and improve your score every time.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/register" className="bg-navy-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-navy-800 transition shadow-md">
              Start Free Interview
            </Link>
            <Link to="/dashboard" className="bg-white border border-slate-200 text-navy-900 px-8 py-4 rounded-xl font-bold text-lg hover:shadow-soft transition shadow-sm">
              View Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Card */}
        <div className="relative">
          <div className="bg-navy-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-aqua-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            
            <div className="grid grid-cols-2 gap-6 mb-8 relative z-10">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="text-3xl font-bold">10</div>
                <div className="text-sm text-slate-400 mt-1">Questions/session</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="text-3xl font-bold text-aqua-400">AI</div>
                <div className="text-sm text-slate-400 mt-1">Powered feedback</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="text-3xl font-bold">85%</div>
                <div className="text-sm text-slate-400 mt-1">Avg improvement</div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="text-3xl font-bold">0-10</div>
                <div className="text-sm text-slate-400 mt-1">Score per answer</div>
              </div>
            </div>

            <div className="relative z-10 space-y-3">
              {['Upload PDF & extract text', 'Generate role-specific questions', 'Answer & get instant AI scores', 'Review report & improve'].map((step, i) => (
                <div key={step} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="w-7 h-7 rounded-full bg-aqua-500/20 text-aqua-300 font-bold flex items-center justify-center flex-shrink-0">{i+1}</span>
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-navy-900 text-center mb-12">Everything you need to ace your interview</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-soft transition shadow-sm group hover:border-aqua-200">
              <div className="text-4xl mb-5">{f.icon}</div>
              <h3 className="text-lg font-bold text-navy-900 mb-2">{f.title}</h3>
              <p className="text-slate-500 leading-relaxed text-sm">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400">
        © 2024 IntervueAI — AI-Powered Interview Training
      </footer>
    </main>
  );
}
