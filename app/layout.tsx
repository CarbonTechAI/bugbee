import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthGuard from './components/AuthGuard';
import Nav from './components/Nav';
import Link from 'next/link';
import LogoutButton from './components/LogoutButton';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'BugBee',
  description: 'Internal Bug & Feature Tracker',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthGuard>
          <div className="min-h-screen flex flex-col">
            <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
              <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-start">
                  <Link href="/" className="font-bold text-lg tracking-tight flex items-center gap-2">
                    <img src="/favicon.ico" alt="BugBee Logo" className="w-6 h-6 rounded" />
                    BugBee
                  </Link>
                  <div className="hidden md:block">
                    <Nav />
                  </div>
                </div>

                {/* Mobile Nav Placeholder (if needed in future) or simple stacking */}
                <div className="md:hidden w-full flex justify-center">
                  <Nav />
                </div>

                <div className="hidden md:block">
                  <LogoutButton />
                </div>
                {/* Mobile Logout - maybe small icon? For now keep simple */}
              </div>
            </header>
            <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </AuthGuard>
      </body>
    </html>
  );
}
