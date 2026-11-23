import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import localFont from 'next/font/local';
import './globals.css';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';
import { CookieBanner } from '@/components/CookieBanner';
import { MobileTabBar } from '@/components/MobileTabBar';
import { SITE_URL } from '@/lib/storeConfig';
import { CatalogProvider } from '@/context/StoreContext';
import { getCatalog, getCategories } from '@/lib/server/catalog';

// Tipografías del sistema visual (las del Figma "Amancay"), autohospedadas (licencia OFL en ./fonts).
// next/font las precarga y genera un fallback con métricas ajustadas: sin salto de layout.
const playfair = localFont({
  src: './fonts/PlayfairDisplay-latin-wght.woff2',
  weight: '400 900',
  variable: '--font-playfair',
  display: 'swap',
  fallback: ['Georgia', 'serif'],
});
const jakarta = localFont({
  src: './fonts/PlusJakartaSans-latin-wght.woff2',
  weight: '200 800',
  variable: '--font-jakarta',
  display: 'swap',
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Amancay — Mates, bombillas, perfumes y desodorantes en Almagro, CABA',
    template: '%s · Amancay',
  },
  description:
    'Amancay, Av. Corrientes 3666 (Almagro, CABA). Mates, bombillas, perfumes, desodorantes y combos con precio y stock a la vista. Retiro en el local o envío.',
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Amancay',
    images: [{ url: '/og-amancay.jpg', width: 1200, height: 630, alt: 'Amancay: mates, bombillas y fragancias de Avenida Corrientes, Almagro' }],
  },
  twitter: { card: 'summary_large_image' },
  keywords: ['mates', 'bombillas de alpaca', 'perfumes', 'desodorantes', 'Kevin', 'Bross London', 'CaroCuore', 'Almagro', 'Av. Corrientes 3666', 'Amancay'],
};

export const viewport: Viewport = {
  themeColor: '#fdf9f0',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // El catálogo sale de la base (en caché) y llega a todos los componentes del navegador por contexto.
  const [catalog, categories] = await Promise.all([getCatalog(), getCategories()]);
  // Un rubro oculto oculta también sus productos en la tienda.
  const visible = new Set(categories.map((c) => c.id));
  const products = catalog.map((p) => (visible.has(p.category) ? p : { ...p, active: false }));
  return (
    <html lang="es-AR" className={`${playfair.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[var(--bg-page)] text-[var(--ink-primary)] font-sans selection:bg-[var(--brand-brass-soft)] selection:text-[var(--ink-primary)]">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-btn focus:bg-[var(--brand-espresso)] focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white"
        >
          Saltar al contenido
        </a>
        <CatalogProvider products={products} categories={categories}>
        <Navbar />
        <main id="contenido" tabIndex={-1} className="flex-1 focus:outline-none">
          {children}
        </main>
        <Footer />
        <Suspense fallback={null}>
          <FloatingWhatsApp />
          <MobileTabBar />
        </Suspense>
        <CookieBanner />
        </CatalogProvider>
      </body>
    </html>
  );
}
