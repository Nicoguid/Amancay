'use client';

import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { whatsappUrl } from '@/lib/storeConfig';

/**
 * Botón flotante de WhatsApp. No aparece donde taparía botones (carrito, checkout, panel)
 * ni en las pantallas que ya tienen su propio botón de WhatsApp a la vista.
 */
const HIDDEN_ON = ['/checkout', '/carrito', '/admin', '/producto/', '/guardados', '/mis-pedidos', '/perfil'];

export function FloatingWhatsApp() {
  const pathname = usePathname();
  if (HIDDEN_ON.some((prefix) => pathname.startsWith(prefix))) return null;

  return (
    <aside aria-label="Contacto rápido">
      <a
        href={whatsappUrl('Hola Amancay, tengo una consulta sobre sus productos.')}
        target="_blank"
        rel="noopener noreferrer"
        className="tap-interactive fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--whatsapp-action)] text-white shadow-xl hover:bg-[var(--whatsapp-action-hover)] sm:right-6 lg:bottom-6"
      >
        <MessageCircle className="h-7 w-7" aria-hidden="true" />
        <span className="sr-only">Consultar por WhatsApp (se abre en otra pestaña)</span>
      </a>
    </aside>
  );
}
