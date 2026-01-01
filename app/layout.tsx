import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthGuard from './components/AuthGuard';
import Nav from './components/Nav';
import Link from 'next/link';
import LogoutButton from './components/LogoutButton';
import { UserProvider } from './context/UserContext';
import UserNameInput from './components/UserNameInput';

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
        <UserProvider>
          <AuthGuard>
            <div className="min-h-screen flex flex-col">
              <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="w-full md:w-auto flex justify-between md:justify-start">
                    <Link href="/" className="font-bold text-lg tracking-tight flex items-center gap-2">
                      <img src="/favicon.ico" alt="BugBee Logo" className="w-6 h-6 rounded" />
                      BugBee
                    </Link>
                  </div>

                  {/* Desktop Nav + Logout */}
                  <div className="hidden md:flex items-center gap-6">
                    <UserNameInput />
                    <Nav />
                    <div className="w-px h-6 bg-slate-800"></div>
                    <LogoutButton />
                  </div>

                  {/* Mobile Nav */}
                  <div className="md:hidden w-full flex flex-col gap-4 items-center">
                    <UserNameInput />
                    <Nav />
                    <LogoutButton />
                  </div>
                </div>
              </header>
              <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
                {children}
              </main>
            </div>
          </AuthGuard>
        </UserProvider>
      </body>
    </html >
  );
}
