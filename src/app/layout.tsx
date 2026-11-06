import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';

export const metadata: Metadata = {
  title: {
    default: 'Amancay — Mates, bombillas y perfumería en Almagro',
    template: '%s · Amancay',
  },
  description:
    'Perfumería Amancay, Av. Corrientes 3666 (Almagro, CABA). Mates, bombillas y perfumes con precio y stock a la vista. Retiro en el local o envío.',
  keywords: ['mates', 'bombillas de alpaca', 'perfumería', 'Almagro', 'Av. Corrientes 3666', 'Perfumería Amancay'],
};

export const viewport: Viewport = {
  themeColor: '#faf7f0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" className="h-full antialiased scroll-smooth">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=gambarino@400&f[]=general-sans@400,500,600,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--bg-page)] text-[var(--ink-primary)] font-sans selection:bg-[var(--amancay-gold)] selection:text-white">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[var(--ink-primary)] focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Saltar al contenido
        </a>
        <Navbar />
        <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
        <Suspense fallback={null}>
          <FloatingWhatsApp />
        </Suspense>
      </body>
    </html>
  );
}
