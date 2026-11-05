import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/context/StoreContext';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';

export const metadata: Metadata = {
  title: 'Amancay — Mates de Autor, Bombillas de Alpaca y Perfumería Fina',
  description: 'Tienda tradicional en Almagro (Av. Corrientes 3666, CABA). Mates imperiales y camioneros, bombillas cinceladas de alpaca y perfumería fina con retiro en mostrador o envíos a todo el país.',
  keywords: 'mates imperiales, bombillas alpaca, perfumeria amancay, mates almagro, perfumes corrientes 3666, bombillas pico de loro',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full antialiased scroll-smooth">
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="anonymous" />
        <link
          href="https://api.fontshare.com/v2/css?f[]=gambarino@400&f[]=general-sans@400,500,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#faf7f0] text-[#1a1612] font-sans selection:bg-[#a67c3f] selection:text-white">
        <StoreProvider>
          <Navbar />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <FloatingWhatsApp />
        </StoreProvider>
      </body>
    </html>
  );
}
