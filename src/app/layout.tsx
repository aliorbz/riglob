import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RiGlob | Ritual Discord Community World Map',
  description: 'Interactive 3D globe visualization for Ritual Discord community members. Connect your wallet, pay the 0.001 RITUAL submission fee, and pin your Discord role and city on the globe.',
  keywords: ['Ritual', 'Web3', '3D Globe', 'Discord', 'World Map', 'Crypto', 'Ritual Testnet'],
  authors: [{ name: 'Ritual Community' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-black text-white">
        {children}
      </body>
    </html>
  );
}
