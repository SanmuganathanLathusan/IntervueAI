'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type ShellProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  hideSidebar?: boolean;
};

const navigation = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/upload-pdf', label: 'Resumes' },
  { href: '/interview-session', label: 'Interviews' },
  { href: '/results', label: 'Analytics' },
  { href: '#', label: 'Settings' },
];

export const Shell = ({ children, title, subtitle, hideSidebar = false }: ShellProps) => {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[#f4f7f6] text-slate-800 font-sans">
      {/* Sidebar */}
      {!hideSidebar && (
        <aside className="w-64 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen overflow-y-auto">
          <div className="p-6">
            <h1 className="text-xl font-bold text-navy-900 tracking-tight">IntervueAI</h1>
            <p className="text-[10px] font-bold text-aqua-600 tracking-widest mt-1 uppercase">Elite Evaluation</p>
          </div>
          <nav className="flex-1 px-4 space-y-1.5 mt-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href === '/interview-session' && pathname?.includes('interview'));
              return (
                <div key={item.href} className="relative">
                  {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-aqua-500 rounded-r-full"></div>}
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ml-2 ${
                      isActive
                        ? 'bg-navy-900 text-white shadow-soft'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-navy-900'
                    }`}
                  >
                    {/* Icon placeholder block */}
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${isActive ? 'text-aqua-300' : 'text-slate-400'}`}>
                      <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                      </svg>
                    </div>
                    {item.label}
                  </Link>
                </div>
              );
            })}
          </nav>
          <div className="p-4 mb-4">
             <Link href="/upload-pdf" className="block w-full py-3 text-center rounded-xl bg-slate-100 text-slate-800 font-semibold border border-slate-200 hover:bg-slate-200 transition shadow-sm hover:shadow">
               New Session
             </Link>
          </div>
        </aside>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-[72px] px-8 flex flex-shrink-0 items-center justify-between bg-[#f4f7f6]">
          <div>
            {title && <h2 className="text-[22px] font-bold text-navy-900">{title}</h2>}
            {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-4">
             <button className="p-2 text-slate-400 hover:text-navy-900 transition bg-white rounded-full border border-slate-200 shadow-sm">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
             </button>
             <div className="w-10 h-10 rounded-full bg-slate-300 border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
               <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="User avatar" className="w-full h-full object-cover" />
             </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
