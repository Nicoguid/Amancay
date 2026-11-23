import type { NextConfig } from "next";
import { INITIAL_PRODUCTS } from "./src/lib/mockData";

/*
 * Encabezados de seguridad para todas las rutas.
 * - frame-ancestors / X-Frame-Options: nadie puede embeber la tienda en un iframe
 *   (evita clickjacking sobre el carrito, el checkout y el panel).
 * - La CSP es mínima a propósito: no restringe scripts porque Next inyecta scripts
 *   inline y eso requiere nonces (ver node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md).
 *   Cuando haya backend real conviene sumar script-src con nonce.
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  },
  { key: "X-Frame-Options", value: "DENY" },
  // HTTPS obligatorio por 2 años (el navegador lo aplica solo cuando el sitio ya se sirve por HTTPS).
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  experimental: {
    // Fotos del panel: el navegador ya las achica antes de subir; esto deja margen para el formulario.
    serverActions: { bodySizeLimit: '7mb' },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Fotos de producto: una semana en caché y revalidación en segundo plano.
      // Si se reemplaza una foto, conviene cambiarle el nombre al archivo.
      {
        source: "/productos/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
  // URLs viejas con el código interno (/producto/mate-01) -> URL limpia con el nombre (redirección permanente).
  async redirects() {
    return INITIAL_PRODUCTS.filter((p) => p.slug && p.slug !== p.id).map((p) => ({
      source: `/producto/${p.id}`,
      destination: `/producto/${p.slug}`,
      statusCode: 301 as const,
    }));
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
