/*
 * Antispam del lado del navegador: un campo trampa que una persona no ve y un tiempo mínimo
 * de llenado. Frena bots simples. Con backend hay que sumar verificación del lado del servidor
 * (por ejemplo Cloudflare Turnstile) y límite de envíos por IP: lo del navegador se puede saltear.
 */
export const MIN_FILL_MS = 2000;

export function looksAutomated(honeypot: string, startedAt: number): boolean {
  return honeypot.trim() !== '' || (startedAt > 0 && Date.now() - startedAt < MIN_FILL_MS);
}

/** Código corto y difícil de adivinar: ARR-7K2Q9M (sin 0/O ni 1/I para dictarlo sin errores). */
export function randomCode(prefix: string): string {
  const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `${prefix}-${Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')}`;
}
