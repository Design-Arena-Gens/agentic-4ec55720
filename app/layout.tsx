import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Clicker Simf',
  description: 'Idle clicker simulation built with Next.js'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
