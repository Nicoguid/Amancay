import { STORE } from './storeConfig';

/*
 * Textos legales de la tienda.
 *
 * BORRADOR: están escritos sobre la normativa argentina vigente a noviembre de 2026
 * (Ley 24.240 de Defensa del Consumidor, Código Civil y Comercial, Ley 25.326 de Protección
 * de Datos Personales, Disposición 954/2025 y Resolución 274/2021 de Comercio), pero no
 * reemplazan la revisión de un abogado. Todo lo que está entre corchetes lo completa la clienta.
 *
 * Cada documento tiene una versión. Cuando se cambia un texto, se sube la versión: los
 * consentimientos guardados indican qué versión aceptó cada persona.
 */

export type LegalSection = { heading: string; paragraphs?: string[]; list?: string[] };
export type LegalLink = { label: string; href: string };
export type LegalDoc = {
  slug: LegalSlug;
  title: string;
  description: string;
  version: string;
  sections: LegalSection[];
  links?: LegalLink[];
};

export type LegalSlug = 'terminos' | 'privacidad' | 'cookies' | 'cambios-y-devoluciones' | 'aviso-legal';

export const VUF_URL = 'https://www.argentina.gob.ar/produccion/defensadelconsumidor/formulario';
export const CABA_CONSUMIDOR_URL = 'https://buenosaires.gob.ar/defensadelconsumidor';
export const AAIP_URL = 'https://www.argentina.gob.ar/aaip/datospersonales';

/** Leyendas que la AAIP pide incluir donde se recolectan datos (Res. AAIP 14/2018). */
export const AAIP_ACCESS_NOTICE =
  'El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley N° 25.326.';
export const AAIP_AUTHORITY_NOTICE =
  'La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.';

const who = `${STORE.legal.holder}, CUIT ${STORE.legal.cuit}, con domicilio en ${STORE.address}, ${STORE.neighborhood}`;
const contact = `${STORE.email} o por WhatsApp al ${STORE.whatsappDisplay}`;

export const LEGAL_DOCS: Record<LegalSlug, LegalDoc> = {
  terminos: {
    slug: 'terminos',
    title: 'Términos y condiciones',
    description: 'Condiciones de compra en la tienda online de Perfumería Amancay: precios, pagos, envíos, retiro y derecho de arrepentimiento.',
    version: '2026-11-07',
    sections: [
      {
        heading: 'Quién vende',
        paragraphs: [
          `La tienda online de ${STORE.name} es operada por ${who}. Contacto: ${contact}.`,
          'Comprar en el sitio implica aceptar estas condiciones. Las podés leer antes de confirmar el pedido y quedan publicadas en esta página.',
        ],
      },
      {
        heading: 'Productos, precios y stock',
        paragraphs: [
          'Los precios están en pesos argentinos y son finales: incluyen los impuestos. El precio sin impuestos nacionales se informa aparte, en letra más chica, como pide la Resolución 4/2025 de la Secretaría de Industria y Comercio.',
          'El precio es el mismo para todos los medios de pago. Las promociones bancarias indican su vigencia, la cantidad y el monto de las cuotas y el costo financiero total.',
          'El stock se actualiza a mano desde el local. Si al preparar tu pedido falta un producto, te avisamos antes de cobrar y elegís si lo cambiás por otro o te devolvemos el dinero.',
        ],
      },
      {
        heading: 'Cómo se confirma un pedido',
        paragraphs: [
          'Al confirmar el pedido recibís un número de pedido. El local lo revisa y te contacta por WhatsApp o email para coordinar el pago y la entrega. El contrato queda cerrado cuando se acredita el pago o, si pagás en el local, cuando retirás.',
        ],
      },
      {
        heading: 'Medios de pago',
        list: ['Transferencia bancaria.', 'Mercado Pago.', 'Efectivo o tarjeta en el local (posnet), solo para pedidos con retiro.'],
      },
      {
        heading: 'Retiro y envíos',
        list: [
          `Retiro en ${STORE.address}: sin costo. Te avisamos cuando el pedido está listo.`,
          'Moto en CABA: la pedimos por aplicación cuando el pedido está listo. El costo lo fija la aplicación en ese momento, te lo confirmamos antes de enviarla y se paga aparte.',
          'Correo Argentino a todo el país: el costo se cotiza con Correo Argentino según el código postal y el tamaño del paquete, y se muestra antes de pagar. Incluye número de seguimiento.',
        ],
      },
      {
        heading: 'Derecho de arrepentimiento',
        paragraphs: [
          'Tenés 10 días corridos para revocar una compra hecha a distancia, contados desde que recibís el producto o desde que se celebra el contrato, lo último que ocurra (artículo 34 de la Ley 24.240 y artículos 1110 a 1116 del Código Civil y Comercial). No tenés que explicar el motivo y no tiene costo para vos.',
          'Lo pedís desde el Botón de arrepentimiento que está en todas las páginas del sitio, sin registrarte. Dentro de las 24 horas te enviamos un código de trámite (Disposición 954/2025). El detalle está en la política de cambios y devoluciones.',
        ],
      },
      {
        heading: 'Garantía',
        paragraphs: [
          'Los mates, bombillas y demás productos no consumibles tienen la garantía legal de tres meses por defectos de fabricación (artículo 11 de la Ley 24.240). Si un producto llega dañado, escribinos con una foto y lo resolvemos.',
        ],
      },
      {
        heading: 'Uso del sitio',
        paragraphs: [
          'No está permitido usar el sitio para fines ilícitos, intentar acceder a partes restringidas o cargar pedidos falsos. Podemos rechazar pedidos con datos claramente falsos, avisándote el motivo.',
        ],
      },
      {
        heading: 'Reclamos, ley aplicable y jurisdicción',
        paragraphs: [
          `Para cualquier reclamo escribinos a ${contact}. También podés reclamar ante Defensa de las y los Consumidores (links al pie de esta página).`,
          'Se aplica la ley argentina. Como consumidor, podés iniciar acciones ante los tribunales de tu domicilio.',
        ],
      },
    ],
    links: [
      { label: 'Defensa de las y los Consumidores. Para reclamos. Ingrese aquí', href: VUF_URL },
      { label: 'Defensa y Protección al Consumidor de la Ciudad de Buenos Aires', href: CABA_CONSUMIDOR_URL },
    ],
  },

  privacidad: {
    slug: 'privacidad',
    title: 'Política de privacidad',
    description: 'Qué datos personales pide Perfumería Amancay, para qué los usa, con quién los comparte y cómo ejercer tus derechos (Ley 25.326).',
    version: '2026-11-16',
    sections: [
      {
        heading: 'Responsable',
        paragraphs: [`El responsable de los datos es ${who}. Para cualquier consulta sobre tus datos: ${contact}.`],
      },
      {
        heading: 'Qué datos pedimos y para qué',
        list: [
          'Nombre y apellido: para identificar el pedido y entregártelo.',
          'Teléfono: para coordinar el pago, el retiro o el envío por WhatsApp.',
          'Email: para mandarte la confirmación del pedido y el código si usás el botón de arrepentimiento.',
          'Dirección, localidad y código postal: solo si elegís envío.',
          'DNI: solo si elegís Correo Argentino, porque el correo lo pide para entregar o retirar en sucursal.',
          'Notas del pedido: solo si las escribís.',
          'Perfil (opcional): si tildás “Guardar mis datos” en el checkout o completás “Mi perfil”, tu nombre, teléfono, email, entrega habitual y dirección quedan guardados en tu navegador para no volver a escribirlos. No se crea una cuenta, no se guarda el DNI ni datos de pago, y los borrás cuando quieras desde “Mi perfil”.',
        ],
        paragraphs: [
          'No pedimos datos que no usemos para el pedido. No usamos tus datos para publicidad ni los vendemos.',
        ],
      },
      {
        heading: 'Base legal',
        paragraphs: [
          'Tratamos tus datos porque son necesarios para cumplir la compra que pediste y porque nos das tu consentimiento al confirmar el pedido. Podés retirar el consentimiento cuando quieras, sin efecto sobre lo ya hecho.',
        ],
      },
      {
        heading: 'Con quién los compartimos',
        list: [
          'Correo Argentino o el servicio de moto, solo los datos de entrega.',
          'Mercado Pago, si elegís ese medio de pago (rige además su propia política).',
          'WhatsApp (Meta), solo si nos escribís por ese canal.',
        ],
      },
      {
        heading: 'Cuánto tiempo los guardamos',
        paragraphs: [
          'Guardamos los datos del pedido mientras dure la relación comercial y el tiempo que exigen las normas fiscales y de defensa del consumidor. [Plazo a confirmar con el contador.] Después se borran.',
        ],
      },
      {
        heading: 'Tus derechos',
        paragraphs: [
          'Podés pedir acceso, rectificación, actualización o supresión de tus datos escribiendo a los contactos de arriba. Respondemos el pedido de acceso dentro de los 10 días corridos y el de rectificación o supresión dentro de los 5 días hábiles (artículos 14 y 16 de la Ley 25.326).',
          AAIP_ACCESS_NOTICE,
          AAIP_AUTHORITY_NOTICE,
        ],
      },
      {
        heading: 'Seguridad',
        paragraphs: [
          'El sitio se sirve por HTTPS. El acceso al panel del local está restringido al personal. [Completar cuando la tienda tenga servidor: dónde se alojan los datos y quién accede.]',
        ],
      },
      {
        heading: 'Cambios en esta política',
        paragraphs: ['Si cambiamos esta política publicamos la versión nueva acá con su fecha. Los pedidos guardan qué versión aceptaste.'],
      },
    ],
    links: [{ label: 'Agencia de Acceso a la Información Pública: datos personales', href: AAIP_URL }],
  },

  cookies: {
    slug: 'cookies',
    title: 'Política de cookies',
    description: 'Qué guarda la tienda de Amancay en tu navegador, qué es necesario para que funcione y qué podés rechazar.',
    version: '2026-11-16',
    sections: [
      {
        heading: 'Qué guardamos en tu navegador',
        paragraphs: [
          'La tienda no usa cookies propias. Usa el almacenamiento local del navegador (localStorage), que funciona parecido, para estas cosas:',
        ],
        list: [
          'Necesario: el carrito, los pedidos de la demo y el catálogo. Sin esto el carrito no funciona. No se puede desactivar desde el sitio, pero lo borrás cuando limpiás los datos del navegador.',
          'Necesario: tu elección sobre la medición y el registro de cuándo aceptaste los términos y la política de privacidad.',
          'Solo si lo usás: los productos que marcás como guardados, los datos de “Mi perfil” (si elegís guardarlos), la lista de tus pedidos hechos desde este navegador y, durante la visita, la forma de entrega que elegiste en el carrito. Los borrás desde “Guardados” y “Mi perfil”, o limpiando los datos del navegador.',
          'Medición (solo si aceptás): estadísticas anónimas de visitas y compras para saber qué funciona en la tienda. Si la rechazás, no se carga ninguna herramienta de medición.',
        ],
      },
      {
        heading: 'Herramientas de terceros',
        paragraphs: [
          'Hoy no hay ninguna herramienta de medición activa. Si se agrega una (por ejemplo Google Analytics), se lista acá con su nombre y su política, y solo se carga si aceptaste la medición.',
          'Los links a WhatsApp, Mercado Pago o Correo Argentino abren sus sitios, que tienen sus propias políticas.',
        ],
      },
      {
        heading: 'Cómo cambiar tu elección',
        paragraphs: ['Desde "Preferencias de cookies", al pie de cualquier página, podés aceptar o rechazar la medición cuando quieras.'],
      },
      {
        heading: '¿Hace falta pedir permiso?',
        paragraphs: [
          'En Argentina no hay una ley específica de cookies; si una cookie permite identificar a una persona, rige la Ley 25.326 de datos personales. Por eso lo necesario funciona sin preguntar y la medición espera tu permiso.',
        ],
      },
    ],
  },

  'cambios-y-devoluciones': {
    slug: 'cambios-y-devoluciones',
    title: 'Cambios, devoluciones y reembolsos',
    description: 'Cómo arrepentirte de una compra online en Amancay, cómo cambiar un producto y cuándo se devuelve el dinero.',
    version: '2026-11-07',
    sections: [
      {
        heading: 'Arrepentimiento: 10 días, sin explicar el motivo',
        paragraphs: [
          'Si compraste online, tenés 10 días corridos desde que recibiste el producto para revocar la compra (artículo 34 de la Ley 24.240). Usá el Botón de arrepentimiento: no hace falta registrarte. Te mandamos un código de trámite dentro de las 24 horas.',
          'Devolvés el producto en el local o te indicamos cómo enviarlo. Los gastos de devolución corren por cuenta del local.',
          'Te devolvemos el total pagado, incluido el envío, por el mismo medio de pago, apenas recibimos el producto. [Plazo de acreditación a confirmar según medio de pago.]',
        ],
      },
      {
        heading: 'Excepciones',
        paragraphs: [
          'El derecho de arrepentimiento no aplica en los casos del artículo 1116 del Código Civil y Comercial, por ejemplo productos hechos a pedido o personalizados. Te lo avisamos antes de comprar si es el caso.',
        ],
      },
      {
        heading: 'Cambios',
        paragraphs: [
          '[Política de cambio a definir con la clienta, por ejemplo: cambios dentro de los 30 días con el ticket, producto sin uso y en su caja.] Los perfumes y desodorantes se cambian cerrados, con el precinto intacto.',
        ],
      },
      {
        heading: 'Productos con fallas',
        paragraphs: [
          'Si un mate, una bombilla u otro producto llega con una falla, escribinos con una foto dentro de los tres meses (garantía legal). Lo reparamos, lo cambiamos o te devolvemos el dinero.',
        ],
      },
    ],
  },

  'aviso-legal': {
    slug: 'aviso-legal',
    title: 'Aviso legal',
    description: 'Datos del titular del sitio de Perfumería Amancay, propiedad intelectual y responsabilidad.',
    version: '2026-11-07',
    sections: [
      {
        heading: 'Titular del sitio',
        list: [
          `Titular: ${STORE.legal.holder}`,
          `CUIT: ${STORE.legal.cuit}`,
          `Condición frente al IVA: ${STORE.legal.taxStatus}`,
          `Domicilio: ${STORE.address}, ${STORE.neighborhood}`,
          `Contacto: ${contact}`,
        ],
      },
      {
        heading: 'Marcas e imágenes',
        paragraphs: [
          'Kevin, Bross London, CaroCuore, Valeria Mazza, Colbert, Cannon, Ciel y las demás marcas pertenecen a sus titulares y se mencionan solo para identificar los productos que vende el local.',
          'Las fotos de producto son del local o de los fabricantes, usadas para mostrar la mercadería en venta. [Confirmar autorización de uso de las fotos de fabricante.]',
        ],
      },
      {
        heading: 'Responsabilidad',
        paragraphs: [
          'Cuidamos que la información del sitio sea correcta. Si encontrás un error en un precio o en una descripción, avisanos y lo corregimos. Los links a otros sitios se ofrecen como referencia; su contenido es responsabilidad de cada sitio.',
        ],
      },
    ],
  },
};

export const LEGAL_ORDER: LegalSlug[] = ['terminos', 'privacidad', 'cookies', 'cambios-y-devoluciones', 'aviso-legal'];

export function legalPath(slug: LegalSlug) {
  return `/legal/${slug}`;
}

/** ¿El texto todavía tiene datos entre corchetes para completar? */
export function hasPlaceholders(doc: LegalDoc): boolean {
  const text = JSON.stringify(doc);
  return /\[[^\]]+\]/.test(text);
}
