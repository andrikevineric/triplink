import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TripLink - Travel Together',
  description: 'Visualize and coordinate trips with friends on a 3D globe',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
