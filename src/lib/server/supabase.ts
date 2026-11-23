import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

/**
 * Cliente de Supabase SOLO para el servidor.
 *
 * Usa la clave secreta, que saltea RLS: por eso este archivo importa 'server-only'
 * (si algún componente del navegador lo importa, el build falla en vez de filtrar la clave).
 * El navegador nunca habla directo con la base: pasa siempre por Server Actions o Route Handlers.
 */

let client: SupabaseClient<Database> | null = null;

export function dbConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);
}

export function db(): SupabaseClient<Database> {
  if (!dbConfigured()) {
    throw new Error('Falta configurar SUPABASE_URL y SUPABASE_SECRET_KEY (mirá .env.example).');
  }
  client ??= createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  return client;
}

/** Errores de las funciones de la base ("sin_stock:perf-01") en un mensaje para el cliente. */
export function friendlyDbError(message: string | undefined, names: Record<string, string> = {}): string {
  const [code, ref] = (message ?? '').split(':');
  const name = (ref && names[ref]) || 'un producto';
  switch (code) {
    case 'sin_stock':
      return `No queda stock suficiente de ${name}. Revisá el carrito.`;
    case 'producto_no_disponible':
    case 'variante_invalida':
    case 'producto_sin_precio':
      return `${name[0].toUpperCase()}${name.slice(1)} ya no está disponible. Sacalo del carrito y probá de nuevo.`;
    case 'falta_variante':
      return `Elegí el tamaño o la opción de ${name} antes de confirmar.`;
    case 'carrito_vacio':
      return 'Tu carrito está vacío.';
    case 'cantidad_invalida':
      return 'Revisá las cantidades del carrito.';
    default:
      return 'No pudimos confirmar el pedido. Probá de nuevo en un momento o escribinos por WhatsApp.';
  }
}
