import './globals.css';
import React from 'react';

export const metadata = {
  title: 'Request Form MVP',
  description: 'Tournament video request form',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const showAdmin = process.env.NEXT_PUBLIC_SHOW_ADMIN === '1';
  return (
    <html lang="ja">
      <body className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-gray-900">
        <header className="border-b bg-white/70 backdrop-blur sticky top-0 z-30">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 font-semibold">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white">RF</span>
              <span>Request Form</span>
            </a>
            <nav className="text-sm text-gray-600">
              <a className="px-3 py-1.5 rounded hover:bg-gray-100" href="/request">申込</a>
              {showAdmin && (
                <a className="ml-1 px-3 py-1.5 rounded hover:bg-gray-100" href="/admin/tournaments">大会管理</a>
              )}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
        <footer className="mt-8 border-t bg-white/60">
          <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-gray-600 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>© {new Date().getFullYear()} Request Form MVP</div>
            <div>
              <a
                href="https://zentori-landing.netlify.app/"
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
              >
                ゼントリを見る
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
