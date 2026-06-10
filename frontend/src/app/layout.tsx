import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'HOZWORK — Хозяйственные товары',
  description: 'Качественные хозяйственные товары для бизнеса и дома с залоговой системой оплаты и гарантией надежности.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-white text-gray-900">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
