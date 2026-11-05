import { Product, Order, ProductCategory } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  // ==================== MATES ====================
  {
    id: 'mate-01',
    name: 'Mate Imperial de Calabaza con Virola Cincelada',
    slug: 'mate-imperial-calabaza-virola-cincelada',
    category: 'mates',
    brand: 'Amancay Orfebrería',
    description: 'Mate Imperial premium elaborado con calabaza brasilera de pared gruesa seleccionada a mano. Forrado íntegramente en cuero vacuno legítimo de primera calidad con costura artesanal punto cruz y 4 patas reforzadas. Virola de alpaca maciza cincelada artesanalmente por maestros orfebres con guardas criollas tradicionales.',
    shortDescription: 'Calabaza brasilera seleccionada, cuero vacuno legítimo y virola de alpaca cincelada.',
    price: 38900,
    originalPrice: 45000,
    stock: 14,
    sku: 'MAT-IMP-01',
    images: [
      'https://images.unsplash.com/photo-1583321500900-82807e458f3c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v1', name: 'Cuero Negro - Virola Cincelada Guardas', priceModifier: 0, price: 38900, stock: 8, sku: 'MAT-IMP-NEG' },
      { id: 'v2', name: 'Cuero Marrón Suela - Virola Cincelada Clásica', priceModifier: 0, price: 38900, stock: 6, sku: 'MAT-IMP-MAR' }
    ],
    isFeatured: true,
    isBestSeller: true,
    isNew: true,
    active: true,
    specifications: {
      'Material del cuerpo': 'Calabaza natural gruesa tratada',
      'Revestimiento': 'Cuero vacuno genuino curtido vegetal',
      'Virola': 'Alpaca de primera calidad labrada a mano',
      'Base': '4 patas de soporte estructurado anti-vuelco',
      'Origen': 'Hecho en Argentina por artesanos orfebres'
    },
    curadoOGuia: 'Llenar el mate con yerba usada templada, agregar un chorro de agua caliente (80°C) y dejar reposar 24 horas. Raspar suavemente con una cuchara para retirar las partes blandas de la calabaza y repetir el proceso dos veces más.'
  },
  {
    id: 'mate-02',
    name: 'Mate Camionero de Algarrobo Macizo',
    slug: 'mate-camionero-algarrobo-macizo',
    category: 'mates',
    brand: 'Amancay Tradición',
    description: 'El clásico mate camionero torneado en madera de algarrobo chaqueño estacionado, altamente resistente a cambios térmicos y con aroma dulce natural característico. Cuenta con virola de acero inoxidable pulido espejo y una boca ancha ideal para armar y mantener la montañita de yerba intacta por muchas cebadas.',
    shortDescription: 'Madera de algarrobo chaqueño estacionado con virola de acero inoxidable.',
    price: 24500,
    originalPrice: 28000,
    stock: 22,
    sku: 'MAT-CAM-02',
    images: [
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583321500900-82807e458f3c?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v1', name: 'Algarrobo Tono Natural', priceModifier: 0, price: 24500, stock: 12, sku: 'MAT-CAM-NAT' },
      { id: 'v2', name: 'Algarrobo Lustre Ahumado', priceModifier: 1500, price: 26000, stock: 10, sku: 'MAT-CAM-AHU' }
    ],
    isFeatured: true,
    isBestSeller: true,
    isNew: false,
    active: true,
    specifications: {
      'Material': 'Algarrobo macizo seleccionado',
      'Virola': 'Acero inoxidable AISI 304 pulido',
      'Capacidad aproximada': '35 a 45 gramos de yerba',
      'Diámetro de boca': '9 cm de apertura cómoda'
    },
    curadoOGuia: 'Untar el interior con un poco de manteca o aceite neutro para sellar los poros de la madera. Al día siguiente, llenar con yerba húmeda durante 24 horas, enjuagar sin detergente y comenzar a utilizar.'
  },
  {
    id: 'mate-03',
    name: 'Mate Torpedo Uruguayo con Virola de Alpaca',
    slug: 'mate-torpedo-uruguayo-alpaca',
    category: 'mates',
    brand: 'Amancay Orfebrería',
    description: 'Diseño clásico uruguayo tipo torpedo, estilizado y anatómico para la mano. Fabricado con calabaza de paredes super gruesas y base forrada en cuero vacuno graneado en color negro azabache o borgoña. Virola lisa de alpaca con borde redondeado que facilita el cebado continuo.',
    shortDescription: 'Calabaza uruguaya compacta, cuero legítimo graneado y virola de alpaca lisa.',
    price: 34900,
    originalPrice: 41000,
    stock: 10,
    sku: 'MAT-TOR-03',
    images: [
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1583321500900-82807e458f3c?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v1', name: 'Cuero Negro Graneado', priceModifier: 0, price: 34900, stock: 6, sku: 'MAT-TOR-NEG' },
      { id: 'v2', name: 'Cuero Bordó Borgoña', priceModifier: 0, price: 34900, stock: 4, sku: 'MAT-TOR-BOR' }
    ],
    isFeatured: false,
    isBestSeller: true,
    isNew: true,
    active: true,
    specifications: {
      'Formato': 'Torpedo oriental ergonómico',
      'Material': 'Calabaza gruesa y cuero vacuno',
      'Virola': 'Alpaca nacional pulida a mano'
    },
    curadoOGuia: 'Curar con yerba usada tibia durante 48 horas cambiando la yerba a las 24 horas. Evitar mojar el cuero exterior para mantener su flexibilidad y lustre.'
  },
  {
    id: 'mate-04',
    name: 'Mate Imperial Criollo Cincelado con Detalles en Bronce',
    slug: 'mate-imperial-criollo-detalles-bronce',
    category: 'mates',
    brand: 'Amancay Orfebrería',
    description: 'Pieza de colección orfebre. Posee una virola de alpaca ancha cincelada con flores de cardo y detalles en relieve en bronce envejecido. Calabaza premium de gran porte, forrada en cuero curtido artesanal y base cosida a lezna.',
    shortDescription: 'Edición exclusiva con relieve en bronce, virola ancha y cardos cincelados.',
    price: 49500,
    originalPrice: 58000,
    stock: 5,
    sku: 'MAT-IMP-BRO',
    images: [
      'https://images.unsplash.com/photo-1583321500900-82807e458f3c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v1', name: 'Edición Única Cardos Criollos', priceModifier: 0, price: 49500, stock: 5, sku: 'MAT-IMP-BRO-1' }
    ],
    isFeatured: true,
    isBestSeller: false,
    isNew: true,
    active: true,
    specifications: {
      'Cuerpo': 'Calabaza extra gruesa de autor',
      'Orfebrería': 'Alpaca y apliques de bronce labrado',
      'Empaque': 'Incluye caja de presentación rígida para regalo'
    }
  },

  // ==================== BOMBILLAS ====================
  {
    id: 'bomb-01',
    name: 'Bombilla Pico de Loro de Alpaca Cincelada',
    slug: 'bombilla-pico-de-loro-alpaca-cincelada',
    category: 'bombillas',
    brand: 'Amancay Orfebrería',
    description: 'Bombilla insignia de orfebrería criolla tradicional. Fabricada íntegramente en alpaca maciza con diseño anatómico en pico de loro para un cebado cómodo y sin forzar la postura. Caño labrado con virola torneada y pala tipo cuchara ancha con micro-ranuras que filtran hasta el polvo más fino de la yerba.',
    shortDescription: 'Alpaca maciza con curva ergonómica, caño cincelado y pala de filtrado fino.',
    price: 18500,
    originalPrice: 22000,
    stock: 35,
    sku: 'BOM-PIC-01',
    images: [
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v1', name: 'Alpaca Labrada Cincelada 19 cm', priceModifier: 0, price: 18500, stock: 20, sku: 'BOM-PIC-CIN' },
      { id: 'v2', name: 'Alpaca Lisa Satinada 19 cm', priceModifier: -1500, price: 17000, stock: 15, sku: 'BOM-PIC-LIS' }
    ],
    isFeatured: true,
    isBestSeller: true,
    isNew: false,
    active: true,
    specifications: {
      'Material': 'Alpaca maciza no ferroso (no calienta los labios)',
      'Largo': '19 cm',
      'Tipo de pico': 'Pico de loro curvado anatómico',
      'Filtro': 'Cuchara con ranuras de alta precisión'
    },
    curadoOGuia: 'Hervir cada 20 días en agua con una cucharadita de bicarbonato de sodio durante 10 minutos para despejar conductos y mantener el sabor puro del mate.'
  },
  {
    id: 'bomb-02',
    name: 'Bombillón Cuchara de Acero Inoxidable 304',
    slug: 'bombillon-cuchara-acero-inoxidable-304',
    category: 'bombillas',
    brand: 'Amancay Acero',
    description: 'Bombillón robusto forjado en acero quirúrgico inoxidable AISI 304 de máxima pureza. Inalterable al paso de los años, no altera los sabores y cuenta con caño grueso de 10mm que ofrece un caudal generoso de agua. Cuchara ranurada de gran superficie que facilita vaciar la yerba al limpiar el mate.',
    shortDescription: 'Acero quirúrgico inoxidable 304, caño grueso de 10mm y caudal óptimo.',
    price: 12900,
    originalPrice: 15000,
    stock: 40,
    sku: 'BOM-CUCH-02',
    images: [
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v1', name: 'Acero Inox Brillante 19 cm', priceModifier: 0, price: 12900, stock: 25, sku: 'BOM-ACR-BRI' },
      { id: 'v2', name: 'Acero Inox Mate Cepillado 19 cm', priceModifier: 0, price: 12900, stock: 15, sku: 'BOM-ACR-CEP' }
    ],
    isFeatured: true,
    isBestSeller: true,
    isNew: false,
    active: true,
    specifications: {
      'Material': 'Acero inoxidable AISI 304 quirúrgico',
      'Diámetro del caño': '10 mm de alto caudal',
      'Largo': '19 cm',
      'Apta lavavajillas': 'Sí'
    }
  },
  {
    id: 'bomb-03',
    name: 'Bombilla Desarmable con Filtro de Resorte y Cepillo',
    slug: 'bombilla-desarmable-filtro-resorte-cepillo',
    category: 'bombillas',
    brand: 'Amancay Técnica',
    description: 'La solución definitiva para una higiene impecable. Posee un resorte tensor de acero que se desenrosca completamente en segundos para una limpieza profunda de su interior. Incluye de obsequio cepillo limpiador de cerdas finas.',
    shortDescription: '100% desarmable para fácil limpieza. Incluye cepillo limpiador de obsequio.',
    price: 14200,
    originalPrice: 16800,
    stock: 28,
    sku: 'BOM-RES-03',
    images: [
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v1', name: 'Acero Desarmable + Cepillo', priceModifier: 0, price: 14200, stock: 28, sku: 'BOM-RES-KIT' }
    ],
    isFeatured: false,
    isBestSeller: false,
    isNew: true,
    active: true,
    specifications: {
      'Sistema': 'Resorte con tuerca desmontable',
      'Material': 'Acero inoxidable',
      'Accesorios': 'Cepillo interior de cerdas sintéticas'
    }
  },
  {
    id: 'bomb-04',
    name: 'Bombilla Chata Criolla de Alpaca Cincelada',
    slug: 'bombilla-chata-criolla-alpaca',
    category: 'bombillas',
    brand: 'Amancay Orfebrería',
    description: 'Diseño clásico rural con caño plano o chato que se apoya naturalmente sobre el labio. Cincelado criollo en espiral y pala ranurada compacta. Ideal para mates pequeños o mates torpedos.',
    shortDescription: 'Formato chato tradicional con cincelado rústico criollo.',
    price: 16900,
    originalPrice: 19500,
    stock: 18,
    sku: 'BOM-CHA-04',
    images: [
      'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v1', name: 'Alpaca Chata 17 cm', priceModifier: 0, price: 16900, stock: 18, sku: 'BOM-CHA-17' }
    ],
    isFeatured: false,
    isBestSeller: false,
    isNew: false,
    active: true,
    specifications: {
      'Largo': '17 cm (ideal formato compacto)',
      'Material': 'Alpaca de orfebre'
    }
  },

  // ==================== PERFUMES ====================
  {
    id: 'perf-01',
    name: 'Amancay Néctar Silvestre Eau de Parfum',
    slug: 'amancay-nectar-silvestre-eau-de-parfum',
    category: 'perfumes',
    brand: 'Perfumería Amancay',
    description: 'La fragancia insignia de la casa, inspirada en la mística flor del Amancay y los jardines botánicos porteños. Una creación olfativa de autor que abre con notas chispeantes de bergamota de Calabria y pimienta rosa, evolucionando hacia un corazón aterciopelado de jazmín nocturno, higo dulce y orquídeas silvestres, reposando sobre un fondo envolvente de sándalo blanco, cedro y ámbar gris.',
    shortDescription: 'Fragancia insignia de autor. Notas de bergamota, flor de amancay, higo y sándalo.',
    price: 46500,
    originalPrice: 54000,
    stock: 16,
    sku: 'PERF-AMA-01',
    images: [
      'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v1', name: '50 ml Eau de Parfum', priceModifier: 0, price: 46500, stock: 10, sku: 'AMA-NEC-50' },
      { id: 'v2', name: '100 ml Eau de Parfum', priceModifier: 18000, price: 64500, stock: 6, sku: 'AMA-NEC-100' }
    ],
    isFeatured: true,
    isBestSeller: true,
    isNew: true,
    active: true,
    specifications: {
      'Concentración': 'Eau de Parfum (18% aceites esenciales)',
      'Familia Olfativa': 'Floral Amaderada Especiada',
      'Notas de salida': 'Bergamota italiana, pimienta rosa y hojas de higuera',
      'Notas de corazón': 'Flor de amancay, jazmín del país y pétalos blancos',
      'Notas de fondo': 'Sándalo cremoso, cedro de virginia y almizcle limpio',
      'Fijación en piel': 'Entre 8 y 12 horas'
    }
  },
  {
    id: 'perf-02',
    name: 'Perfume Kevin Black Eau de Toilette',
    slug: 'perfume-kevin-black-edt',
    category: 'perfumes',
    brand: 'Kevin',
    description: 'El clásico indiscutido de la perfumería masculina nacional. Una composición amaderada aromática de gran presencia y elegancia formal. Destacan acordes de lavanda fresca, nuez moscada y un fondo noble de maderas oscuras y musgo.',
    shortDescription: 'Clásico masculino amaderado con lavanda, especias y cedro noble.',
    price: 38500,
    originalPrice: 44000,
    stock: 20,
    sku: 'PERF-KEV-02',
    images: [
      'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v1', name: '60 ml EDT con vaporizador', priceModifier: 0, price: 38500, stock: 12, sku: 'KEV-BLK-60' },
      { id: 'v2', name: '100 ml EDT con vaporizador', priceModifier: 13500, price: 52000, stock: 8, sku: 'KEV-BLK-100' }
    ],
    isFeatured: true,
    isBestSeller: true,
    isNew: false,
    active: true,
    specifications: {
      'Concentración': 'Eau de Toilette',
      'Familia Olfativa': 'Amaderada Aromática Fougère',
      'Presentación': 'Frasco de vidrio macizo negro con vaporizador'
    }
  },
  {
    id: 'perf-03',
    name: 'Paula Cahen d\'Anvers Luna EDT',
    slug: 'paula-cahen-danvers-luna-edt',
    category: 'perfumes',
    brand: 'Paula Cahen d\'Anvers',
    description: 'Fragancia femenina luminosa, romántica y delicada. Una caricia olfativa con apertura cítrica suave que da paso a flores blancas silvestres, jazmín y un fondo dulce y reconfortante de sándalo y vainilla cálida.',
    shortDescription: 'Fragancia femenina floral y etérea con azahar, jazmín y sándalo.',
    price: 42000,
    originalPrice: 48000,
    stock: 14,
    sku: 'PERF-PCD-03',
    images: [
      'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v1', name: '50 ml EDT', priceModifier: 0, price: 42000, stock: 8, sku: 'PCD-LUN-50' },
      { id: 'v2', name: '100 ml EDT', priceModifier: 16000, price: 58000, stock: 6, sku: 'PCD-LUN-100' }
    ],
    isFeatured: true,
    isBestSeller: false,
    isNew: true,
    active: true,
    specifications: {
      'Concentración': 'Eau de Toilette',
      'Familia Olfativa': 'Floral Fresca',
      'Uso recomendado': 'Diario, oficina y ocasiones de media tarde'
    }
  },
  {
    id: 'perf-04',
    name: 'Colbert Space Eau de Cologne',
    slug: 'colbert-space-eau-de-cologne',
    category: 'perfumes',
    brand: 'Colbert',
    description: 'Colonia tradicional porteña de alta frescura y distinción. Una combinación vigorizante de notas cítricas mediterráneas, cardamomo y fondo de cuero suave que evoca la sastrería clásica y el mostrador de confianza.',
    shortDescription: 'Cítricos chispeantes, hierbas aromáticas y fondo de cuero sutil.',
    price: 29900,
    originalPrice: 34500,
    stock: 18,
    sku: 'PERF-COL-04',
    images: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?auto=format&fit=crop&w=800&q=80'
    ],
    variants: [
      { id: 'v1', name: '60 ml Frasco', priceModifier: 0, price: 29900, stock: 10, sku: 'COL-SPC-60' },
      { id: 'v2', name: '100 ml Frasco', priceModifier: 9600, price: 39500, stock: 8, sku: 'COL-SPC-100' }
    ],
    isFeatured: false,
    isBestSeller: true,
    isNew: false,
    active: true,
    specifications: {
      'Concentración': 'Eau de Cologne',
      'Familia Olfativa': 'Cítrica Amaderada Cuero'
    }
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    orderNumber: 'AMC-2026-089',
    createdAt: '2026-11-04T18:24:00.000Z',
    customer: {
      fullName: 'Mariano Benítez',
      email: 'marianob@gmail.com',
      phone: '1145229081',
      dni: '34890123',
      address: 'Bulnes 742, 3B',
      city: 'Almagro, CABA',
      postalCode: '1176'
    },
    items: [
      {
        productId: 'mate-01',
        productName: 'Mate Imperial de Calabaza con Virola Cincelada',
        productImage: 'https://images.unsplash.com/photo-1583321500900-82807e458f3c?auto=format&fit=crop&w=800&q=80',
        variantName: 'Cuero Negro - Virola Cincelada Guardas',
        quantity: 1,
        unitPrice: 38900,
        totalPrice: 38900
      },
      {
        productId: 'bomb-01',
        productName: 'Bombilla Pico de Loro de Alpaca Cincelada',
        productImage: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
        variantName: 'Alpaca Labrada Cincelada 19 cm',
        quantity: 1,
        unitPrice: 18500,
        totalPrice: 18500
      }
    ],
    subtotal: 57400,
    discount: 0,
    shippingMethod: 'pickup',
    shippingCost: 0,
    paymentMethod: 'transferencia',
    total: 57400,
    status: 'en_preparacion'
  }
];

export const CATEGORIES_CONFIG: { id: ProductCategory; name: string; desc: string; image: string; tag: string }[] = [
  {
    id: 'mates',
    name: 'Mates de Autor',
    desc: 'Imperiales, camioneros y torpedos en alpaca y algarrobo',
    image: 'https://images.unsplash.com/photo-1583321500900-82807e458f3c?auto=format&fit=crop&w=800&q=80',
    tag: 'Artesanía Criolla'
  },
  {
    id: 'bombillas',
    name: 'Bombillas Cinceladas',
    desc: 'Pico de loro en alpaca maciza y acero quirúrgico 304',
    image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=800&q=80',
    tag: 'Caudal y Filtrado Óptimo'
  },
  {
    id: 'perfumes',
    name: 'Perfumería Fina',
    desc: 'Fragancias exclusivas de autor, clásicos nacionales e importados',
    image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=800&q=80',
    tag: 'Esencias Porteñas'
  }
];
