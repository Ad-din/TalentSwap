import { Fraunces, Inter } from 'next/font/google';
import './globals.css';
import NavBar from '../components/NavBar';
import { AuthProvider } from '../lib/AuthContext';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'TalentSwap — Exchange Skills. Learn Together. Grow Together.',
  description:
    'Teach what you know. Learn what you want. TalentSwap matches you with people for a real, two-way skill exchange.',
};

// Nearly every page reads live Firebase auth state via the nav bar and
// RequireAuth, so there's little to gain from static prerendering - and
// prerendering breaks if Firebase env vars aren't present at build time.
export const dynamic = 'force-dynamic';

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          <NavBar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
