import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'USDT Settlement Monitor',
  description: 'TRON USDT TRC20 settlement monitoring dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
