import type { Metadata } from 'next';
import { Inter, Noto_Sans_Devanagari } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-noto',
  weight: ['400', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'AgriSense AI — 3D Smart Irrigation Simulation | SIH 2026',
  description: 'Interactive 3D animated digital twin simulation of ET₀-based autonomous smart irrigation with ESP32 edge safety, MQTT telemetry, and multilingual farmer app.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${notoSansDevanagari.variable}`}>
      <body className="antialiased bg-[#060e08] text-white">
        {children}
      </body>
    </html>
  );
}
