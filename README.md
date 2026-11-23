# Amancay — tienda online (demo)

Demo de tienda para Perfumería Amancay (Av. Corrientes 3666, Almagro). Catálogo con filtros, ficha con variantes, carrito, checkout con retiro o envío y un panel para precios, stock y pedidos. Contexto del producto en [`PRODUCT.md`](./PRODUCT.md).

## Correr el proyecto

```bash
npm install
npm run dev     # http://localhost:3000
npm run lint
npm run build
```

## Cómo está armado

- Next.js 16 (App Router), React 19, Tailwind v4, TypeScript.
- Sin backend todavía: catálogo, carrito, pedidos, guardados y perfil viven en el `localStorage` de cada navegador (`src/context/StoreContext.tsx`). Lo que se cargue en el panel lo ve solo ese navegador.
- Datos del comercio, horario, promo y tarifas de envío: `src/lib/storeConfig.ts`. Mismo precio con cualquier medio de pago (no hay descuento por transferencia). Todo lo marcado `PLACEHOLDER` hay que confirmarlo con la clienta.
- Rubros: `src/lib/categories.ts`. Catálogo de la demo: `src/lib/mockData.ts`, con las fotos de `public/productos/`.

## Diseño y animaciones

El diseño sale del archivo de Figma "Amancay" (crema, espresso y dorado; Playfair Display + Plus Jakarta Sans). Decisiones y motivos: [`docs/superpowers/specs/2026-11-16-rediseno-figma-design.md`](./docs/superpowers/specs/2026-11-16-rediseno-figma-design.md).

- **Colores, botones y movimiento:** `src/app/globals.css`. Las variables CSS (`--bg-page`, `--brand-espresso`, `--brand-gold`…) son la única fuente de color; `.btn`, `.chip`, `.tag` y `.field` son los componentes base.
- **Entrada al cargar:** clase `enter` con `style={{ '--i': n }}` (cada bloque entra 70 ms después del anterior).
- **Entrada al scrollear:** componente `src/components/Reveal.tsx`. El contenido sale visible del servidor y solo se anima si hay JavaScript.
- Todo respeta "reducir movimiento" del sistema: nada se desplaza ni escala, solo funde.

## Pantallas

| Ruta | Qué es |
|---|---|
| `/` | Inicio con la vidriera interactiva (`src/components/home/`) |
| `/catalogo` | Catálogo con filtros en la URL |
| `/producto/[slug]` | Ficha, con pirámide olfativa (perfumes) o cómo curarlo (mates) |
| `/carrito` | Carrito completo y forma de entrega |
| `/checkout` | Datos, pago y consentimientos |
| `/guardados` | Productos guardados para después (sin cuenta) |
| `/mis-pedidos` | Seguimiento de los pedidos hechos en ese navegador y búsqueda por código |
| `/perfil` | Datos de contacto y entrega habitual, guardados en el navegador (sin cuenta) |
| `/admin` | Panel del local |

## Panel del local

`/admin` (linkeado desde el footer). Entra con contraseña: copiá `.env.example` como `.env.local` y generá las claves con `node scripts/hash-password.mjs "la-contraseña"`.

- **Precios:** aumento por rubro, marca o todo el catálogo, con vista previa y deshacer. Planilla CSV para editar en Excel (separador `;`, se actualiza por SKU, las celdas vacías no se tocan).
- **Productos y stock:** edición de precio base (las variantes mantienen su diferencia) y stock por variante.
- **Pedidos** y **Resumen** con stock bajo.

## Pendiente para producción

Backend y base de datos, Mercado Pago real, proveedor de envíos, facturación (ARCA), logo definitivo y revisión legal. El detalle está en el checklist del proyecto (seguridad, SEO y legales).
