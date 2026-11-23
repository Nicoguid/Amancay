'use client';

import { useEffect, useState } from 'react';
import type { ShippingMethod } from './types';
import { parsePostalCode } from './storeConfig';
import { getShippingQuote } from '@/app/checkout/shippingAction';
import type { ShippingQuote } from '@/lib/server/shipping';

type Line = { productId: string; variantId?: string; quantity: number };
export type QuoteState = { status: 'idle' | 'loading' } | { status: 'done'; quote: ShippingQuote };

/**
 * Pide la cotización al servidor cuando hay un código postal de 4 números.
 * Espera medio segundo después de la última tecla para no consultar por cada número.
 */
export function useShippingQuote(method: ShippingMethod, postalCode: string, lines: Line[]): QuoteState {
  const cp = parsePostalCode(postalCode);
  const linesKey = lines.map((l) => `${l.productId}:${l.variantId ?? ''}:${l.quantity}`).join('|');
  // Qué se está pidiendo ahora. Si la última respuesta es de otro pedido, todavía está "cargando".
  const key = method === 'pickup' || cp === null || !linesKey ? null : `${method}|${cp}|${linesKey}`;
  const [result, setResult] = useState<{ key: string; quote: ShippingQuote } | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      getShippingQuote(method, String(cp), lines)
        .then((quote) => !cancelled && setResult({ key, quote }))
        .catch(() => !cancelled && setResult({ key, quote: { ok: false, error: 'No pudimos calcular el envío.' } }));
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // key resume método, CP y carrito; lines cambia de referencia en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!key) return { status: 'idle' };
  return result?.key === key ? { status: 'done', quote: result.quote } : { status: 'loading' };
}
