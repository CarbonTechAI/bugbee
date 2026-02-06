import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AuthGuard from './components/AuthGuard';
import { UserProvider } from './context/UserContext';
import { ToastProvider } from './components/Toast';
import AppShell from './components/AppShell';

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
            <ToastProvider>
              <AppShell>
                {children}
              </AppShell>
            </ToastProvider>
          </AuthGuard>
        </UserProvider>
      </body>
    </html>
  );
}
