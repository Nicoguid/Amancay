'use client';

import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { whatsappUrl } from '@/lib/storeConfig';

/** Botón flotante de WhatsApp. No aparece en checkout ni en el panel, donde tapaba botones. */
export function FloatingWhatsApp() {
  const pathname = usePathname();
  if (pathname.startsWith('/checkout') || pathname.startsWith('/admin')) return null;

  return (
    <aside aria-label="Contacto rápido">
      <a
      href={whatsappUrl('Hola Amancay, tengo una consulta sobre sus productos.')}
      target="_blank"
      rel="noopener noreferrer"
      className="tap-interactive fixed bottom-4 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--whatsapp-action)] text-white shadow-xl hover:bg-[var(--whatsapp-action-hover)] sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="h-7 w-7" aria-hidden="true" />
      <span className="sr-only">Consultar por WhatsApp (se abre en otra pestaña)</span>
      </a>
    </aside>
  );
}
