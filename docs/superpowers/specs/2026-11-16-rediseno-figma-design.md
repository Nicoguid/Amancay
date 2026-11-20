# Rediseño de la tienda a partir del Figma "Amancay" (16/11/2026)

## Qué se pidió y para qué

Rediseñar la web de Perfumería Amancay tomando el archivo de Figma "Amancay" (8 pantallas) como fuente de
marca, estructura y tono, mejorando jerarquía visual, uso en celular y conversión, con animaciones sutiles.
Todo sobre la base ya trabajada (commit `4c9785b`): seguridad, legales, SEO, catálogo real.

## Enfoque elegido

**Figma como guía de diseño, con datos reales** (elegido por Nicolás el 16/11).

Descartados:

- *Textos del Figma tal cual*: publica promesas, reseñas y productos que no existen (PRODUCT.md lo prohíbe).
- *Reescribir desde cero en otra arquitectura*: tira el trabajo de seguridad, legales y SEO ya verificado.

## Objetivos

- Que se vea como el Figma: crema, espresso, dorado; Playfair Display + Plus Jakarta Sans.
- Precio, stock y retiro en el local a la vista (principios 1 y 2 de PRODUCT.md).
- Celular primero: controles de 44 px o más, texto de 16 px, navegación inferior.
- Animaciones con función: entrada escalonada (la del Figma), respuesta al tocar, cambios de estado.

## Lo que no se hace

- Cuentas de usuario, login de clientes o servidor (no hay backend).
- Inventar reseñas, calificaciones, plazos, garantías, productos o antigüedad del local.
- Usar las fotos del Figma (son ilustrativas): se usan las 47 fotos reales de `public/productos/`.
- Subir a GitHub: se trabaja en la rama local `rediseno-figma`.

## Lo que haría fracasar el trabajo aunque "funcione"

- Perder algo del checklist `claude/checklist-seguridad-seo-legal.md` (arrepentimiento, consentimientos,
  headers, links de Defensa del Consumidor, precio sin impuestos, datos mínimos).
- Volver a mostrar el descuento por transferencia, o el WhatsApp y horario viejos.
- Animaciones que marean, tapan contenido o ignoran "reducir movimiento".

## Decisiones de construcción

| Tema | Decisión | Por qué |
|---|---|---|
| Colores | Se cambian los valores de las variables CSS de `src/app/globals.css` (los nombres quedan) | Todo el sitio, incluidos legales y panel, toma la paleta nueva sin reescribir cada pantalla |
| Animaciones | CSS + un componente `Reveal` con IntersectionObserver. Sin librería nueva | El repo no tiene librería de animación (se sacó gsap por no usarse); menos peso y nada que mantener |
| Valores de movimiento | Los del Figma: sube 8 a 18 px, 400 a 600 ms, curva `cubic-bezier(0.22, 1, 0.36, 1)`, 70 ms entre tarjetas | Es la animación que diseñó Nicolás. En Figma está en bucle para previsualizar; en la web corre una vez |
| Datos del local | Siempre desde `src/lib/storeConfig.ts` | Una sola fuente: WhatsApp, horario y dirección no se pueden desincronizar |
| Guardados, perfil, mis pedidos | En `localStorage`, dentro del store existente (`src/context/StoreContext.tsx`) | Misma arquitectura que carrito y pedidos; sin cuenta |
| Perfil | Solo nombre, teléfono, email, entrega preferida y una dirección. Sin DNI | Datos mínimos (el DNI solo lo pide Correo Argentino en el checkout) |
| Mis pedidos | Lista los pedidos hechos en ese navegador y permite buscar por código | Sin servidor no se puede consultar desde otro dispositivo; la pantalla lo dice |
| Mapa | Esquema dibujado en SVG, sin iframe de Google | El checklist exige cero pedidos a terceros al cargar |
| Vidriera del inicio | Estantes con fotos reales de producto y puntos "+" que muestran nombre y precio | El Figma usa fotos de un local que no es el real |
| Tipografía chica | Los rótulos de 10 px del Figma suben a 12 px o más; el cuerpo a 15/16 px | PRODUCT.md: público de todas las edades, texto legible |
| Logo | Sigue el sello provisorio, con la paleta nueva | El logo del Figma no coincide con ninguna de las 3 opciones de `Logos/`; falta que la clienta elija |

## Pantallas

1. **Inicio**: barra superior, header, vidriera (hero), beneficios, mates y bombillas, ayuda por WhatsApp,
   perfumería, promo vigente, el local con esquema de cómo llegar, entrega, marcas, preguntas frecuentes.
2. **Catálogo**: mismos filtros por URL; tarjetas nuevas.
3. **Producto**: galería, compra, entrega; pirámide olfativa (perfumes) o materiales y curado (mates);
   preguntas frecuentes. Sin reseñas.
4. **Carrito** (`/carrito`, nueva) y **checkout** (restilado, misma lógica y consentimientos).
5. **Guardados** (`/guardados`), **Mis pedidos** (`/mis-pedidos`), **Perfil** (`/perfil`): nuevas.
6. **Panel del local**: misma lógica y seguridad, estética nueva.

## Queda a criterio de quien implemente

Nombres de componentes, tamaños exactos, textos de microcopy (siempre verdaderos y sin emojis).
