# INSTRUCCIONES PERMANENTES Y PLAYBOOK TÉCNICO DE ARQUITECTURA: DOREAR

> **MANDATO OBLIGATORIO PARA CUALQUIER AGENTE DE IA:**  
> Este documento representa la **fuente de verdad técnica, arquitectónica y de seguridad** del proyecto **DOREAR**.  
> **REGLA DE ORO:** Antes de responder cualquier consulta, generar código, proponer refactorizaciones o realizar cambios en este repositorio, el agente **DEBE revisar y contrastar sus respuestas contra las directivas, advertencias de seguridad y lecciones aprendidas aquí documentadas**.

---

## 1. Contexto del Negocio y Dominio

* **Negocio:** Cafetería de Especialidad & Pastelería de Autor Dorear.
* **Ubicación:** Rosario Vera Peñaloza 460, Puerto Madero, CABA (Buenos Aires, Argentina).
* **Fundadora & Chef Pastelera:** Agustina Ramírez.
* **Eslogan:** *"Que espere todo, este ratito es tuyo"*.
* **Perfil de Usuarios:** Clientes de salón, oficinistas de Puerto Madero, turistas internacionales (foco en público brasileño y angloparlante) y personal operativo del local (mozos/baristas y administración).
* **Propuesta Técnica:** Menú Web Digital Mobile-First puro (acceso por QR, sin descargas, carga sub-100ms, resiliente sin señal).

---

## 2. Mapa de Arquitectura y Topología del Sistema

### A. Diagrama de Flujo y Sincronización en Tiempo Real
El sistema cuenta con una arquitectura de sincronización híbrida:
1. **Modo Producción Serverless (Cloud - Vercel + Supabase):**
   * El cliente estático se sirve desde la CDN perimetral de Vercel con cabeceras HTTP de seguridad (`Strict-Transport-Security`, `Content-Security-Policy`, etc.).
   * La sincronización reactiva se realiza a través de `@supabase/supabase-js` conectado a PostgreSQL vía WebSockets (`postgres_changes` en el canal `dorear_realtime_menu`).
2. **Modo Local / Salón Autónomo (Vite On-Premises):**
   * Servidor local Node/Vite con middleware Connect (`back/apiMiddleware.ts`).
   * Difusión unidireccional vía Server-Sent Events (`GET /api/menu-stream`) gestionado por `back/sseBroker.ts`.
   * Persistencia en disco atómica en `.dorear-live-state.json` (`back/stateStore.ts`).
3. **Sincronización Inter-Pestañas en el Navegador:**
   * Uso de la `BroadcastChannel API` (`dorear_realtime_sync_v13`) para sincronizar cambios locales instantáneamente sin tráfico de red.

### B. Rutas Físicas Críticas del Repositorio
* **Punto de Entrada & Shell:** `index.html`, `front/main.tsx`, `front/App.tsx`.
* **Tipos y Contratos de Datos:** `db/types.ts`, `db/storeSettings.ts`, `db/menuData.ts`, `db/weeklyMenu.ts`.
* **Validación y Seguridad:** `db/stateValidation.ts`, `front/utils/securityAndFormat.ts`.
* **Transporte y Sincronización:** `front/utils/supabaseClient.ts`, `front/utils/menuSync.ts`.
* **Backend Embebido / Vite Middleware:** `back/apiMiddleware.ts`, `back/sseBroker.ts`, `back/stateStore.ts`.
* **Accesibilidad & Modales:** `front/modals/ModalDialog.tsx`, `front/modals/StaffModal.tsx`, `front/modals/ProductDetailModal.tsx`, `front/modals/GroupReservationModal.tsx`, `front/modals/WifiCardModal.tsx`.
* **Paneles Operativos:** `front/staff/BaristaPanel.tsx`, `front/staff/AdminPanel.tsx`, `front/staff/ItemFormModal.tsx`, `front/staff/WeeklyDishFormModal.tsx`.
* **Lógica Temporal y de Medios:** `front/utils/buenosAiresTime.ts`, `front/utils/imageUrl.ts`.

---

## 3. Inventario del Stack y Tecnologías

| Skill / Librería | Versión | Ubicación | Problema que resuelve | Decisión de Ingeniería |
| :--- | :--- | :--- | :--- | :--- |
| **React** | `^18.3.1` | `front/App.tsx` | Renderizado declarativo y división de código | Carga ultrarrápida; soporte de `React.lazy` y `Suspense` para aislar paneles privados. |
| **TypeScript** | `~5.6.2` | Transversal | Tipado estricto en runtime y compile-time | Uso de type guards (`val is MenuItem`) para validar payloads externos. |
| **Vite** | `^6.0.5` | `vite.config.ts` | Empaquetado ESM y middleware Connect | Servidor ligero local con hot-reload y capacidad de servir APIs sin framework externo. |
| **@supabase/supabase-js** | `^2.118.0` | `front/utils/supabaseClient.ts` | Base de datos reactiva con CDC | Permite sincronización de stock y precios en la nube sin requerir servidor persistente en Vercel. |
| **Tailwind CSS** | `^3.4.17` | `tailwind.config.js` | Tokens visuales y CSS atómico | Paleta corporativa sobria (`cream`, `gold`, `wine`, `paper`); CSS final minificado <15 KB. |
| **Lucide React** | `^1.16.0` | `front/menu/DietaryIcons.tsx` | Iconografía vectorial accesible | Tree-shaking activo; empaquetado en un chunk separado Rollup (`icons`). |
| **Type Guards Nativos** | *Nativo TS* | `db/stateValidation.ts` | Validación profunda de datos | Cero dependencias adicionales (evita agregar los ~50 KB de librerías como Zod). |
| **BroadcastChannel API** | *Web API* | `front/utils/menuSync.ts` | Comunicación inter-pestañas | Sincronización inmediata (<1ms) sin llamadas a red ni consumo de cuota de API. |
| **Intl.DateTimeFormat** | *JS Standard* | `front/utils/buenosAiresTime.ts` | Normalización de zona horaria | Fuerza el cálculo horario a `America/Argentina/Buenos_Aires` para turistas extranjeros. |

---

## 4. Playbook y Directivas por Dominio Técnico

### A. Ciberseguridad & Resiliencia
1. **Reglas para Autenticación de PINs:**
   * **ADVERTENCIA DE SEGURIDAD CRÍTICA:** `PIN_SALT`, `HASH_BARISTA` y `HASH_ADMIN` residen en `db/storeSettings.ts`. Cualquier usuario técnico puede extraerlos del bundle JS y romper un PIN de 4 dígitos en milisegundos.
   * **Directiva:** Al refactorizar o añadir endpoints, **NO exponer credenciales ni hashes en el cliente**. La verificación debe ocurrir en el servidor o mediante una Edge Function que emita una cookie segura `HttpOnly`.
   * En `back/apiMiddleware.ts`, mantener siempre la función de comparación timing-safe (`safePinEquals`) basada en XOR bit a bit para prevenir ataques de temporización.
2. **Control de Acceso (RBAC):**
   * `customer`: Solo lectura.
   * `barista`: Únicamente permitido mutar el estado `available` de un ítem (ejecutado por `applyBaristaStateUpdate`).
   * `admin`: Modificación de precios, creación/edición de platos, menú semanal, settings y reset general.
3. **Sanitización y Validación:**
   * **Anti-SSRF (`isSafeImageUrl`):** Validar que toda URL de imagen comience estrictamente con `https:` y bloquear de forma exhaustiva rangos de red locales (`localhost`, `127.*`, `10.*`, `192.168.*`, `169.254.*`, `172.16-31.*`, `.local`, `.internal`).
   * **Inyección en WhatsApp (`sanitizeWhatsAppInput`):** Eliminar caracteres de control ASCII (`\u0000-\u001F`) y símbolos de formato markdown (`*`, `_`, `~`, `` ` ``) antes de interpolar datos en URLs de `wa.me`.
   * **Parseo Numérico Seguro (`parseArsPrice`):** Normalizar puntos de miles y comas decimales argentinas. Rechazar valores `<= 0`, `NaN`, infinitos o superiores a $10.000.000 ARS.
4. **Hardening de Cabeceras y Red:**
   * Mantener siempre en `vercel.json` y `back/apiMiddleware.ts`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security` y un CSP estricto con `connect-src 'self' https://*.supabase.co wss://*.supabase.co`.
   * En peticiones POST al middleware local, aplicar rate limiting por IP con bloqueo progresivo (30s, 45s, 60s) y límite de cuerpo de 512 KB (`MAX_BODY_BYTES = 512_000`).

### B. UI / UX & Experiencia de Usuario
1. **Patrones Visuales y Paleta Oficial:**
   * Fondos: Crema (`#faf7f0`), Papel (`#fffcf7`).
   * Textos: Tinta (`#372e25`), Muted (`#766b5d`).
   * Detalles y Acentos: Oro (`#a67c3f`), Borgoña/Vino (`#672d35`), Línea/Borde (`#e6dac6`).
   * Tipografías: *Cormorant Garamond* (serif para títulos, precios destacados y elegancia editorial) y *DM Sans* (sans para descripciones, legibilidad y controles).
2. **Soporte Multilingüe Completo:**
   * Cada texto nuevo debe proveerse en el triplete: `{ es: string, en: string, pt: string }`.
   * Adaptar las traducciones al léxico gastronómico (especial atención al público brasileño en Puerto Madero).
3. **Cumplimiento Legal y Alérgenos (Ley Nacional 26.588):**
   * En `evaluateDishDietarySafety`, si un modificador contiene gluten/avena o lácteos, se debe disparar la advertencia formal correspondiente para clientes celíacos.
4. **Accesibilidad Obligatoria (a11y):**
   * Todo modal debe usar el componente base `ModalDialog.tsx`, que implementa:
     * Focus trap nativo (`Tab` y `Shift+Tab`).
     * Cierre mediante tecla `Escape`.
     * Atributos `role="dialog"`, `aria-modal="true"`, `aria-labelledby`.
     * Bloqueo de scroll en `document.body.style.overflow = 'hidden'`.
   * Los botones seleccionables deben declarar `aria-pressed`.

### C. Frontend Architecture & Performance
1. **Separación de Chunks en Rollup (`vite.config.ts`):**
   * Mantener separados los chunks manuales: `vendor` (`react`, `react-dom`) e `icons` (`lucide-react`).
   * Los paneles de administración (`BaristaPanel`, `AdminPanel`) deben cargarse únicamente bajo demanda con `React.lazy()` y `Suspense`.
2. **Optimización de Imágenes:**
   * Utilizar siempre `getOptimizedImageUrl` y `getResponsiveImageSrcSet` (`front/utils/imageUrl.ts`) para fotos de Unsplash, forzando `auto=format`, `fit=crop`, `fm=webp` y generando `srcSet` con anchos de 400px, 720px y 960px.
3. **Gestión de Versiones y Caché Local:**
   * El estado persistido en `localStorage` utiliza claves prefijadas por versión (`CURRENT_STATE_VERSION = 13`).
   * Al migrar de versión, mantener la rutina `clearLocalStateSnapshot()` para purgar claves obsoletas y evitar estados corruptos en dispositivos de clientes habituales.

### D. Backend Architecture & Persistencia
1. **Escrituras Atómicas en Disco:**
   * En el backend Node/Vite (`back/stateStore.ts`), nunca escribir directamente al archivo `.json` de producción. Escribir primero en `.dorear-live-state.json.tmp` y luego ejecutar `fsPromises.rename()` para garantizar atomicidad y evitar archivos corruptos por apagones.
   * Serializar escrituras concurrentes encadenando promesas en `writeQueue`.
2. **Broker de Server-Sent Events:**
   * Limitar el número de clientes SSE concurrentes a 100 (`MAX_SSE_CLIENTS = 100`) para no agotar descriptores de archivo.
   * Mantener el heartbeat keepalive de 25 segundos con `timer.unref()`.
3. **Cálculo Temporal en Buenos Aires:**
   * No utilizar `new Date().getHours()` directamente para reglas de negocio. Usar siempre `getBuenosAiresNow()` de `front/utils/buenosAiresTime.ts` para respetar el huso horario oficial `America/Argentina/Buenos_Aires`.

---

## 5. Lista de Control (Checklist) para Toda Intervención

Antes de entregar cualquier código o respuesta en este repositorio, verificar:
- [ ] ¿Respeta la paleta cromática (`cream`, `paper`, `gold`, `wine`, `ink`) y las tipografías oficiales?
- [ ] ¿Incluye traducciones completas en Español, Inglés y Portugués (`LocalizedString`)?
- [ ] ¿Garantiza que no se expongan secretos, sales o hashes en código del frontend?
- [ ] ¿Verifica URLs de imágenes contra SSRF mediante `isSafeImageUrl`?
- [ ] ¿Sanitiza campos que se envían por WhatsApp mediante `sanitizeWhatsAppInput`?
- [ ] ¿Mantiene los roles ARIA y accesibilidad por teclado en cualquier modal o botón nuevo?
- [ ] ¿Conserva la separación de roles entre Barista (solo stock) y Admin (gestión total)?
- [ ] ¿Calcula horarios y fechas considerando la zona horaria de Buenos Aires (`America/Argentina/Buenos_Aires`)?
