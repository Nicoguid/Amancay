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
- Sin backend todavía: catálogo, carrito y pedidos viven en el `localStorage` de cada navegador (`src/context/StoreContext.tsx`). Lo que se cargue en el panel lo ve solo ese navegador.
- Datos del comercio, promo, tarifas de envío y descuento por transferencia: `src/lib/storeConfig.ts`. Todo lo marcado `PLACEHOLDER` hay que confirmarlo con la clienta.
- Datos de muestra: `src/lib/mockData.ts`. Las fotos son de Unsplash y hay que reemplazarlas.

## Panel del local

`/admin` (linkeado desde el footer). Sin login: es una demo.

- **Precios:** aumento por rubro, marca o todo el catálogo, con vista previa y deshacer. Planilla CSV para editar en Excel (separador `;`, se actualiza por SKU, las celdas vacías no se tocan).
- **Productos y stock:** edición de precio base (las variantes mantienen su diferencia) y stock por variante.
- **Pedidos** y **Resumen** con stock bajo.

## Pendiente para producción

Backend y base de datos, login del panel, Mercado Pago real, proveedor de envíos, facturación (ARCA) y fotos propias.
