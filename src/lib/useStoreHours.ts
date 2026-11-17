'use client';

import { useSyncExternalStore } from 'react';
import { todayHours, type TodayHours } from './storeConfig';

const noopSubscribe = () => () => {};

/**
 * Horario de hoy y si el local está abierto en este momento.
 * Depende de la hora, así que en el HTML del servidor (generado en el build) no se muestra:
 * devuelve null hasta que corre en el navegador. Mismo criterio que usePromoActive.
 */
export function useTodayHours(): TodayHours | null {
  // useSyncExternalStore compara por identidad: se pasa un texto estable y se arma el objeto después.
  const snapshot = useSyncExternalStore(
    noopSubscribe,
    () => {
      const { time, isOpen } = todayHours();
      return `${isOpen ? '1' : '0'}|${time}`;
    },
    () => ''
  );
  if (!snapshot) return null;
  const [open, time] = snapshot.split('|');
  return { time, isOpen: open === '1' };
}
