import type { ShippingMethod } from './types';
import { parsePostalCode, postalZone } from './storeConfig';

/*
 * Validación del formulario del checkout. La usan el navegador (para mostrar los errores al toque)
 * y el servidor (que vuelve a validar todo: lo del navegador se puede saltear).
 */

export type CheckoutField = 'fullName' | 'dni' | 'phone' | 'email' | 'address' | 'city' | 'postalCode' | 'notes';
export type CheckoutForm = Record<CheckoutField, string>;

export const CHECKOUT_LIMITS: Record<CheckoutField, number> = {
  fullName: 120,
  dni: 12,
  phone: 30,
  email: 120,
  address: 160,
  city: 80,
  postalCode: 10,
  notes: 500,
};

export function validateCheckout(data: CheckoutForm, shipping: ShippingMethod): Partial<Record<CheckoutField, string>> {
  const errors: Partial<Record<CheckoutField, string>> = {};
  if (data.fullName.trim().length < 3) errors.fullName = 'Escribí tu nombre y apellido.';
  // El DNI solo lo pide Correo Argentino: no se pide para retiro ni moto.
  if (shipping === 'correo_argentino' && !/^\d{7,8}$/.test(data.dni.replace(/[.\-\s]/g, '')))
    errors.dni = 'Escribí el DNI sin puntos (7 u 8 números).';
  if (data.phone.replace(/\D/g, '').length < 8) errors.phone = 'Escribí un teléfono con código de área, ej.: 11 2345 6789.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) errors.email = 'Escribí un email válido, ej.: nombre@mail.com.';
  if (shipping !== 'pickup') {
    if (data.address.trim().length < 5) errors.address = 'Escribí calle, número, piso y departamento.';
    if (!/\d{4}/.test(data.postalCode)) errors.postalCode = 'Escribí el código postal (4 números).';
    else if (shipping === 'moto_caba' && postalZone(parsePostalCode(data.postalCode)!) !== 'caba')
      errors.postalCode = 'La moto llega solo a CABA (CP 1000 a 1499). Para otra zona elegí Correo Argentino.';
    if (!data.city.trim()) errors.city = 'Escribí la localidad o barrio.';
  }
  return errors;
}

/** Recorta cada campo a su largo máximo (el servidor no guarda textos gigantes). */
export function clampCheckout(data: Partial<CheckoutForm>): CheckoutForm {
  const out = {} as CheckoutForm;
  for (const key of Object.keys(CHECKOUT_LIMITS) as CheckoutField[]) {
    const value = data[key];
    out[key] = typeof value === 'string' ? value.slice(0, CHECKOUT_LIMITS[key]) : '';
  }
  return out;
}
