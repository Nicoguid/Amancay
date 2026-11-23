
import { LEGAL_DOCS } from './legal';
import { logCookieConsent } from '@/app/_actions/consent';

/*
 * Consentimientos y medición.
 *
 * - Registro: cada aceptación (términos, privacidad, cookies) se guarda con qué documento,
 *   qué versión, cuándo, desde qué página y cómo (casilla, botón). Queda una copia en el navegador
 *   y el registro que vale se guarda en el servidor: los del checkout junto con el pedido y la
 *   elección de cookies con logCookieConsent.
 * - Medición: los eventos de conversión solo se registran si la persona aceptó la medición.
 *   Sin un ID de Google Analytics configurado (NEXT_PUBLIC_GA_ID) no se carga ningún script
 *   de terceros: los eventos quedan en window.dataLayer y nada sale del navegador.
 */

export type ConsentDoc = 'terminos' | 'privacidad' | 'cookies';
export type ConsentRecord = {
  doc: ConsentDoc;
  version: string;
  decision: 'aceptado' | 'rechazado';
  at: string;
  method: string;
  page: string;
  reference?: string;
};

const LOG_KEY = 'amancay_consent_log_v1';
const COOKIE_KEY = 'amancay_cookie_choice_v1';
export const COOKIE_EVENT = 'amancay:cookie-preferences';

function readLog(): ConsentRecord[] {
  try {
    const raw = window.localStorage.getItem(LOG_KEY);
    return raw ? (JSON.parse(raw) as ConsentRecord[]) : [];
  } catch {
    return [];
  }
}

export function recordConsent(record: Omit<ConsentRecord, 'at' | 'page' | 'version'> & { version?: string }): ConsentRecord {
  const full: ConsentRecord = {
    version: record.version ?? LEGAL_DOCS[record.doc].version,
    at: new Date().toISOString(),
    page: window.location.pathname,
    ...record,
  };
  try {
    const log = readLog();
    log.push(full);
    // Se guardan los últimos 200 registros: alcanza para la demo y no llena el almacenamiento.
    window.localStorage.setItem(LOG_KEY, JSON.stringify(log.slice(-200)));
  } catch {
    // Sin almacenamiento disponible: el registro igual viaja dentro del pedido.
  }
  return full;
}

export function getConsentLog(): ConsentRecord[] {
  return readLog();
}

export type CookieChoice = { analytics: boolean; version: string; at: string };

export function getCookieChoice(): CookieChoice | null {
  try {
    const raw = window.localStorage.getItem(COOKIE_KEY);
    const choice = raw ? (JSON.parse(raw) as CookieChoice) : null;
    // Si cambió la política, se vuelve a preguntar.
    return choice && choice.version === LEGAL_DOCS.cookies.version ? choice : null;
  } catch {
    return null;
  }
}

export function setCookieChoice(analytics: boolean, method: string) {
  const choice: CookieChoice = { analytics, version: LEGAL_DOCS.cookies.version, at: new Date().toISOString() };
  try {
    window.localStorage.setItem(COOKIE_KEY, JSON.stringify(choice));
  } catch {
    // modo incógnito estricto: la elección dura lo que dura la pestaña
  }
  const record = recordConsent({ doc: 'cookies', decision: analytics ? 'aceptado' : 'rechazado', method });
  // Sin esperar: si falla, la elección igual vale en este navegador.
  void logCookieConsent({ decision: record.decision, method: record.method, page: record.page }).catch(() => {});
  if (analytics) loadAnalytics();
}

export function openCookiePreferences() {
  window.dispatchEvent(new Event(COOKIE_EVENT));
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
let analyticsLoaded = false;

/** Carga Google Analytics solo con permiso y solo si hay un ID configurado. */
export function loadAnalytics() {
  if (analyticsLoaded || !getCookieChoice()?.analytics) return;
  analyticsLoaded = true;
  window.dataLayer = window.dataLayer || [];
  if (!GA_ID) return;
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { anonymize_ip: true });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);
}

/**
 * Evento de conversión (add_to_cart, begin_checkout, purchase, contact_whatsapp, ...).
 * Sin permiso de medición no hace nada.
 */
export function track(event: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined' || !getCookieChoice()?.analytics) return;
  loadAnalytics();
  if (window.gtag) window.gtag('event', event, params);
  else (window.dataLayer = window.dataLayer || []).push({ event, ...params });
}
