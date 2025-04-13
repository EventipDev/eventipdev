import { Poppins, Playfair_Display, Great_Vibes } from 'next/font/google';
import "./globals.css";
import { AuthProvider } from './context/AuthContext';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

const greatVibes = Great_Vibes({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata = {
  title: "Event-ip - Discover & Experience Events",
  description: "Find and book the best events in your area",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable} ${playfair.variable} ${greatVibes.variable}`}>
      <head>
        <title>Event-ip</title>
        <meta name="description" content="Your premier event platform" />
      </head>
      <body className="font-poppins">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
