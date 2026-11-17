import { normalizeText } from './storeConfig';

/** Lee CSV con comillas, separador "," o ";" (Excel en español usa ";") y BOM opcional. */
export function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '');
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? '';
  const delimiter = (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (inQuotes) {
      if (char === '"' && clean[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  if (cell !== '' || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.map((r) => r.map((c) => unguardFormula(c.trim()))).filter((r) => r.some((c) => c !== ''));
}

/*
 * Inyección de fórmulas: Excel y Google Sheets ejecutan una celda que empieza con
 * = + - @ (o tab / retorno). Un nombre de producto que viene de la planilla de un
 * proveedor podría traer, por ejemplo, =HYPERLINK(...). Al exportar se antepone un
 * apóstrofo (Excel lo muestra como texto) y al importar se quita, así ida y vuelta
 * el nombre queda igual.
 */
const FORMULA_START = /^[=+\-@\t\r]/;
function guardFormula(value: string): string {
  return FORMULA_START.test(value) ? `'${value}` : value;
}
function unguardFormula(value: string): string {
  return value.startsWith("'") && FORMULA_START.test(value.slice(1)) ? value.slice(1) : value;
}

/** Arma un CSV que Excel en español abre bien: BOM UTF-8, ";" y comillas escapadas. */
export function toCsv(rows: (string | number)[][]): string {
  const escape = (value: string | number) => {
    // Los números se exportan tal cual (un precio negativo no existe en la tienda).
    const s = typeof value === 'number' ? String(value) : guardFormula(value);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + rows.map((r) => r.map(escape).join(';')).join('\r\n');
}

/**
 * Número en formato argentino o simple: "38.900", "$ 38.900", "38900", "38900,5", "38.900,50".
 * Devuelve null si no es un número válido.
 */
export function parseArNumber(raw: string): number | null {
  let s = raw.replace(/[$\s]/g, '');
  if (s === '') return null;
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = s.replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Encuentra la columna por nombre de encabezado (sin importar acentos ni mayúsculas). */
export function headerIndex(headers: string[], ...names: string[]): number {
  const normalized = headers.map(normalizeText);
  for (const name of names) {
    const i = normalized.indexOf(normalizeText(name));
    if (i >= 0) return i;
  }
  return -1;
}
