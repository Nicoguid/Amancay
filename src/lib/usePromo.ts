'use client';

import { useSyncExternalStore } from 'react';
import { isPromoActive } from './storeConfig';

const noopSubscribe = () => () => {};

/**
 * La promo depende de la fecha de hoy. En el HTML del servidor (generado en el build)
 * no se muestra; el navegador la muestra si está vigente. Así nunca queda una promo vencida.
 */
export function usePromoActive(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => isPromoActive(),
    () => false
  );
}
