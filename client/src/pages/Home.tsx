import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { isAuthenticated, getStoredUser, clearSession } from '@/lib/auth';
import type { User } from '@/lib/types';

export default function HomePage() {
  const navigate = useNavigate();
  const [showVideo, setShowVideo] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      setUser(getStoredUser());
    }
  }, []);

  const handleLogout = () => {
    clearSession();
    setUser(null);
    navigate('/');
  };

  const avatarUrl = user?.avatar || (user?.email 
    ? `https://i.pravatar.cc/150?u=${encodeURIComponent(user.email)}`
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0D8ABC&color=fff`);

  return (
    <main className="min-h-screen bg-white text-navy-900 font-sans">
      {/* Video Modal */}
      {showVideo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <div className="absolute inset-0 bg-navy-950/90 backdrop-blur-sm" onClick={() => setShowVideo(false)} />
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowVideo(false)}
              className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white z-10 transition"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <iframe 
              src="https://www.youtube.com/embed/uUI3g-0C7OE?autoplay=1" 
              title="YouTube video player"
              className="w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold tracking-tight text-navy-900 flex items-center gap-2">
            <div className="w-9 h-9 bg-navy-900 rounded-lg flex items-center justify-center overflow-hidden shadow-sm group">
              <img src="/logo.jpg" alt="IntervueAI Logo" className="w-full h-full object-cover" />
            </div>
            IntervueAI
          </Link>

          <nav className="hidden md:flex items-center gap-10 text-base font-medium text-navy-900">
            <Link to={user ? "/upload-pdf" : "/login"} className="flex items-center gap-2 hover:text-aqua-600 transition-colors">
              Resume Scorer
            </Link>
            <Link to={user ? "/interview-session" : "/login"} className="flex items-center gap-2 hover:text-aqua-600 transition-colors">
              Interviews
            </Link>
            <Link to={user ? "/chat" : "/login"} className="flex items-center gap-2 hover:text-aqua-600 transition-colors">
              AI Practice
            </Link>
            <Link to={user ? "/results" : "/login"} className="flex items-center gap-2 hover:text-aqua-600 transition-colors">
              Performance
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-sm font-bold text-navy-900">{user.name}</span>
                  <Link to="/dashboard" className="text-[10px] font-bold text-aqua-600 uppercase tracking-widest hover:text-aqua-700 transition">View Dashboard</Link>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-slate-100 overflow-hidden bg-slate-50">
                  <img src={avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500 transition rounded-lg hover:bg-red-50"
                  title="Logout"
                >
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="text-base font-semibold text-navy-900 hover:text-aqua-600 px-4 py-2 transition-colors">Login</Link>
                <Link to="/register" className="bg-navy-900 text-white px-6 py-2.5 rounded-xl font-bold text-base hover:bg-navy-800 transition shadow-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10">
           
            <h1 className="text-6xl lg:text-7xl font-extrabold text-navy-900 leading-[1.1] tracking-tight mb-8">
              Master Your<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-aqua-500 to-indigo-600">Career Narrative</span>
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed max-w-lg mb-10">
              Elite AI-driven interview simulation that provides real-time coaching, behavioral analysis, and industry-specific feedback to land your dream role.
            </p>
            <div className="flex items-center gap-6">
              <Link to="/register" className="bg-navy-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-navy-800 transition shadow-lg hover:-translate-y-1">
                Get Started for Free
              </Link>
              <button 
                onClick={() => setShowVideo(true)}
                className="flex items-center gap-3 text-navy-900 font-bold group"
              >
                <div className="w-12 h-12 rounded-full border border-slate-200 flex items-center justify-center group-hover:bg-slate-50 transition">
                  <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 ml-1">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                Watch Demo
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden shadow-2xl border-8 border-white bg-slate-100">
              <img 
                src="/hero-wide.png" 
                alt="AI Interview Platform" 
                className="w-full h-auto min-h-[400px] object-cover object-top hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
                <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-bold text-navy-900 shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  Sentiment: Confident
                </div>
                <div className="bg-navy-900/90 backdrop-blur px-3 py-1.5 rounded-lg text-[10px] font-bold text-white shadow-sm flex items-center gap-2">
                  Confidence: 94%
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-full bg-aqua-500 flex items-center justify-center text-white text-xs font-bold italic">AI</div>
                  <div className="text-[10px] font-bold text-navy-900">AI Feedback</div>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                  "Excellent response on project management. Consider adding more quantitative results in the final stage..."
                </p>
              </div>
            </div>
            {/* Background elements */}
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-aqua-100/50 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-100/50 rounded-full blur-3xl" />
          </div>
        </div>
      </section>

      {/* Engineered for Peak Performance */}
      <section className="py-24 bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-navy-900 mb-4">Engineered for Peak Performance</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">IntervueAI was designed to dismantle interview anxiety and build professional authority.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<MockInterviewIcon />}
              title="High-Fidelity Mock Interviews"
              desc="Simulate realistic scenarios tailored to Fortune 500 standards and niche industry requirements."
              tags={["FAANG Style Practice", "Adaptive AI Difficulty"]}
            />
            <FeatureCard 
              icon={<AnalysisIcon />}
              title="Real-Time Sentiment Analysis"
              desc="Instant metrics of your pace, tone, and facial expressions to ensure your delivery matches your content."
              visual={<div className="h-20 flex items-end gap-1 mt-4">
                {[40, 70, 45, 90, 65, 80].map((h, i) => (
                  <div key={i} className="flex-1 bg-aqua-500 rounded-t-md" style={{height: `${h}%`}} />
                ))}
              </div>}
            />
            <FeatureCard 
              icon={<InsightsIcon />}
              title="Actionable Career Insights"
              desc="Granular reports post-interview that highlight specific strengths and offer precise areas for improvement."
              link="View Performance"
              onClick={() => navigate('/results')}
            />
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="bg-navy-900 rounded-[3rem] p-12 lg:p-20 text-white relative overflow-hidden">
             <div className="relative z-10 grid lg:grid-cols-[1fr_2fr] gap-16 items-center">
                <div>
                   <h2 className="text-4xl font-bold mb-4">From Preparation to Job Offer</h2>
                   <p className="text-slate-400">A streamlined 3-step workflow optimized for busy professionals who demand results.</p>
                </div>
                <div className="grid sm:grid-cols-3 gap-10">
                   <Step num="1" title="Upload" desc="Upload your PDF resume or job description to customize the AI's persona." />
                   <Step num="2" title="Practice" desc="Engage in interactive AI-driven interview sessions tailored to your role." />
                   <Step num="3" title="Improve" desc="Receive deep-dive analytics and practice until your narrative is flawless." />
                </div>
             </div>
             {/* Abstract background pattern */}
             <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
                <svg width="600" height="600" viewBox="0 0 600 600" fill="none">
                   <path d="M300 0L559.808 150V450L300 600L40.1924 450V150L300 0Z" stroke="white" strokeWidth="20" />
                   <path d="M300 100L473.205 200V400L300 500L126.795 400V200L300 100Z" stroke="white" strokeWidth="20" />
                </svg>
             </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="glass-panel p-16 text-center bg-white border border-slate-100 shadow-soft">
            <h2 className="text-5xl font-bold text-navy-900 mb-6">Ready to Ace the Interview?</h2>
            <p className="text-slate-500 text-lg mb-10 max-w-2xl mx-auto">
              Join 25,000+ professionals who have transformed their interview performance and secured roles at top global firms.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register" className="bg-navy-900 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-navy-800 transition shadow-lg">
                Get Started for Free
              </Link>
              <a href="mailto:enterprise@intervueai.com" className="bg-white border border-slate-200 text-navy-900 px-10 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 transition inline-block">
                Contact Enterprise
              </a>
            </div>
            <div className="mt-12 flex justify-center gap-10 grayscale opacity-40">
               <span className="font-bold tracking-widest text-sm">TECHCORP</span>
               <span className="font-bold tracking-widest text-sm">GLOBALMIND</span>
               <span className="font-bold tracking-widest text-sm">NEXTVENTURES</span>
               <span className="font-bold tracking-widest text-sm">VITALSOURCE</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-950 text-white pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-6">
              <Link to="/" className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg group">
                  <img src="/logo.jpg" alt="IntervueAI Logo" className="w-full h-full object-cover" />
                </div>
                IntervueAI
              </Link>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                Elite AI-driven career intelligence designed to help professionals master their narrative and land dream roles at top global firms.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-aqua-500 transition-colors group">
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                </a>
                <a href="#" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center hover:bg-aqua-500 transition-colors group">
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Platform</h4>
              <ul className="space-y-4">
                <li><Link to="/upload-pdf" className="text-slate-400 hover:text-aqua-400 text-sm transition-colors">Resume Scorer</Link></li>
                <li><Link to="/interview-session" className="text-slate-400 hover:text-aqua-400 text-sm transition-colors">Mock Interviews</Link></li>
                <li><Link to="/chat" className="text-slate-400 hover:text-aqua-400 text-sm transition-colors">AI Career Coach</Link></li>
                <li><Link to="/results" className="text-slate-400 hover:text-aqua-400 text-sm transition-colors">Performance Analytics</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Support</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-400 hover:text-aqua-400 text-sm transition-colors">Help Center</a></li>
                <li><a href="#" className="text-slate-400 hover:text-aqua-400 text-sm transition-colors">Interview Guides</a></li>
                <li><a href="#" className="text-slate-400 hover:text-aqua-400 text-sm transition-colors">API Documentation</a></li>
                <li><a href="mailto:support@intervueai.com" className="text-slate-400 hover:text-aqua-400 text-sm transition-colors">Contact Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Legal</h4>
              <ul className="space-y-4">
                <li><a href="#" className="text-slate-400 hover:text-aqua-400 text-sm transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-slate-400 hover:text-aqua-400 text-sm transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-slate-400 hover:text-aqua-400 text-sm transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-xs text-slate-500 font-medium tracking-wide">
              © {new Date().getFullYear()} IntervueAI Inc. Precision Engineered in California.
            </p>
            <div className="flex items-center gap-8 text-[10px] font-bold text-slate-500 tracking-widest">
               <span className="hover:text-white cursor-pointer transition-colors">SYSTEM STATUS: OPTIMAL</span>
               <span className="hover:text-white cursor-pointer transition-colors">v2.1.4</span>
            </div>
          </div>
        </div>
      </footer>

    </main>
  );
}

function FeatureCard({ icon, title, desc, tags, visual, link, onClick }: any) {
  return (
    <div 
      className="glass-panel p-8 bg-white border border-slate-100 hover:border-aqua-500/50 transition-all duration-300 hover:shadow-xl group cursor-pointer"
      onClick={onClick}
    >
      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-navy-900 mb-6 group-hover:bg-aqua-50 group-hover:text-aqua-600 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-navy-900 mb-3">{title}</h3>
      <p className="text-sm text-slate-500 leading-relaxed mb-6">{desc}</p>
      {tags && (
        <div className="space-y-2">
          {tags.map((t: string) => (
            <div key={t} className="flex items-center gap-2 text-xs font-bold text-slate-400">
               <div className="w-4 h-4 bg-slate-100 rounded flex items-center justify-center">
                 <svg fill="currentColor" viewBox="0 0 24 24" className="w-2 h-2"><path d="M21 7L9 19L3.5 13.5L4.91 12.09L9 16.17L19.59 5.59L21 7Z" /></svg>
               </div>
               {t}
            </div>
          ))}
        </div>
      )}
      {visual}
      {link && (
        <button className="flex items-center gap-2 text-aqua-600 font-bold text-xs mt-4 hover:gap-3 transition-all">
          {link}
          <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </button>
      )}
    </div>
  );
}

function Step({ num, title, desc }: any) {
  return (
    <div>
      <div className="w-8 h-8 bg-aqua-500 rounded-lg flex items-center justify-center text-navy-900 font-bold text-sm mb-6">
        {num}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

function MockInterviewIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
    </svg>
  );
}

function AnalysisIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  );
}

function InsightsIcon() {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}
