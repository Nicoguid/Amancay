-- =============================================================================
-- Amancay: esquema inicial
-- -----------------------------------------------------------------------------
-- Regla de acceso: el navegador NUNCA habla directo con la base.
-- Todo pasa por el servidor de Next (Server Actions / Route Handlers) con la
-- clave secreta de Supabase. Por eso todas las tablas tienen RLS activado y
-- ninguna política para "anon" ni "authenticated": si alguien consigue la
-- clave pública, igual no puede leer ni escribir nada.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Utilidades
-- ---------------------------------------------------------------------------

-- Pone updated_at = now() en cada UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Código corto, legible y difícil de adivinar (sin 0/O ni 1/I/L).
-- Ej.: random_code('AMC') -> 'AMC-7K3QX9'
create or replace function public.random_code(prefix text, len int default 6)
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  result text := '';
  i int;
begin
  for i in 1..len loop
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  end loop;
  return prefix || '-' || result;
end;
$$;

-- ---------------------------------------------------------------------------
-- 1. Catálogo
-- ---------------------------------------------------------------------------

create table public.products (
  id                text primary key,                 -- se conservan los ids actuales (ej. 'perf-01')
  slug              text not null unique,             -- /producto/kevin-absolute
  name              text not null check (length(name) between 1 and 200),
  category          text not null check (category in ('mates', 'bombillas', 'perfumes', 'desodorantes', 'combos')),
  brand             text not null default '',
  description       text not null default '',
  short_description text,
  price             numeric(12, 2) not null check (price >= 0),
  original_price    numeric(12, 2) check (original_price is null or original_price >= price),
  stock             integer not null default 0 check (stock >= 0),
  images            text[] not null default '{}',     -- solo URLs https o rutas /productos/...
  is_featured       boolean not null default false,
  is_best_seller    boolean not null default false,
  is_new            boolean not null default false,
  sku               text not null unique,
  active            boolean not null default true,
  specifications    jsonb not null default '{}'::jsonb,
  curado_o_guia     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index products_category_active_idx on public.products (category) where active;

create trigger products_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- Variantes: "50 ml" / "100 ml", "Virola cincelada", etc.
-- Si un producto tiene variantes, el precio y el stock que valen son los de la variante.
create table public.product_variants (
  id          text primary key,
  product_id  text not null references public.products (id) on delete cascade,
  name        text not null check (length(name) between 1 and 120),
  price       numeric(12, 2) not null check (price >= 0),
  stock       integer not null default 0 check (stock >= 0),
  sku         text not null unique,
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index product_variants_product_idx on public.product_variants (product_id, position);

create trigger product_variants_updated_at
before update on public.product_variants
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Pedidos
-- ---------------------------------------------------------------------------

create table public.orders (
  id               uuid primary key default gen_random_uuid(),
  order_number     text not null unique default public.random_code('AMC'),

  -- Estado del pedido (lo que ve el cliente y maneja el local)
  status           text not null default 'pendiente'
                   check (status in ('pendiente', 'pagado', 'en_preparacion', 'listo_para_retirar',
                                     'despachado', 'entregado', 'cancelado')),

  -- Cliente (datos mínimos; el DNI solo para Correo Argentino)
  customer_name    text not null check (length(customer_name) between 2 and 120),
  customer_email   text not null check (customer_email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  customer_phone   text not null check (length(customer_phone) between 6 and 30),
  customer_dni     text check (customer_dni is null or customer_dni ~ '^[0-9]{7,8}$'),
  address          text,
  city             text,
  postal_code      text,
  notes            text check (notes is null or length(notes) <= 500),

  -- Entrega
  shipping_method  text not null check (shipping_method in ('pickup', 'moto_caba', 'correo_argentino')),
  shipping_cost    numeric(12, 2) not null default 0 check (shipping_cost >= 0),

  -- Pago
  payment_method   text not null check (payment_method in ('mercadopago', 'transferencia', 'mostrador')),
  payment_status   text not null default 'pendiente'
                   check (payment_status in ('pendiente', 'aprobado', 'rechazado', 'reembolsado',
                                             'reembolso_parcial', 'cancelado', 'vencido')),
  mp_order_id      text unique,                       -- id de la Order de Mercado Pago
  mp_payment_id    text,
  paid_at          timestamptz,
  expires_at       timestamptz,                       -- si no se paga antes, se cancela y vuelve el stock

  -- Importes (los calcula create_order con los precios de la base, nunca el navegador)
  subtotal         numeric(12, 2) not null check (subtotal >= 0),
  total            numeric(12, 2) not null check (total >= 0),

  is_sample        boolean not null default false,    -- pedidos de ejemplo del panel (EJ-...)
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint orders_total_ok check (total = subtotal + shipping_cost),
  constraint orders_dni_correo check (shipping_method <> 'correo_argentino' or customer_dni is not null),
  constraint orders_address_needed check (shipping_method = 'pickup' or address is not null),
  constraint orders_mostrador_solo_retiro check (payment_method <> 'mostrador' or shipping_method = 'pickup')
);

create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);
create index orders_pending_expiry_idx on public.orders (expires_at) where payment_status = 'pendiente';

create trigger orders_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

-- Renglones del pedido: guardan una "foto" del producto al momento de comprar,
-- así el pedido no cambia si después se edita o se borra el producto.
create table public.order_items (
  id             bigint generated always as identity primary key,
  order_id       uuid not null references public.orders (id) on delete cascade,
  product_id     text references public.products (id) on delete set null,
  variant_id     text references public.product_variants (id) on delete set null,
  product_name   text not null,
  variant_name   text,
  product_image  text,
  category       text not null,
  quantity       integer not null check (quantity between 1 and 50),
  unit_price     numeric(12, 2) not null check (unit_price >= 0),
  total_price    numeric(12, 2) not null,
  constraint order_items_total_ok check (total_price = unit_price * quantity)
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

-- Historial de cambios de estado (quién movió el pedido y cuándo).
create table public.order_events (
  id          bigint generated always as identity primary key,
  order_id    uuid not null references public.orders (id) on delete cascade,
  type        text not null,                          -- 'creado', 'estado', 'pago', 'reembolso', 'vencido'...
  from_value  text,
  to_value    text,
  source      text not null default 'sistema' check (source in ('sistema', 'panel', 'mercadopago', 'cliente')),
  detail      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index order_events_order_idx on public.order_events (order_id, created_at);

-- ---------------------------------------------------------------------------
-- 3. Legales
-- ---------------------------------------------------------------------------

-- Qué documento aceptó (o rechazó), qué versión, cuándo, dónde y cómo.
create table public.consents (
  id          bigint generated always as identity primary key,
  order_id    uuid references public.orders (id) on delete set null,   -- null para cookies
  doc         text not null check (doc in ('terminos', 'privacidad', 'cookies', 'cambios-y-devoluciones', 'aviso-legal')),
  version     text not null,
  decision    text not null check (decision in ('aceptado', 'rechazado')),
  method      text not null,                          -- ej. 'casilla en checkout', 'botón del aviso'
  page        text not null,                          -- ruta donde se dio
  reference   text,
  created_at  timestamptz not null default now()
);

create index consents_order_idx on public.consents (order_id);

-- Botón de arrepentimiento (Disp. 954/2025).
create table public.withdrawal_requests (
  id             uuid primary key default gen_random_uuid(),
  code           text not null unique default public.random_code('ARR'),
  order_number   text not null check (length(order_number) between 3 and 40),
  order_id       uuid references public.orders (id) on delete set null,   -- se vincula si el código existe
  full_name      text not null check (length(full_name) between 2 and 120),
  email          text not null check (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  status         text not null default 'recibido'
                 check (status in ('recibido', 'en_proceso', 'reembolsado', 'rechazado')),
  email_sent_at  timestamptz,                         -- la norma pide mandar el código dentro de las 24 h
  resolved_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index withdrawal_requests_created_idx on public.withdrawal_requests (created_at desc);

create trigger withdrawal_requests_updated_at
before update on public.withdrawal_requests
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Mercado Pago
-- ---------------------------------------------------------------------------

-- Cada aviso (webhook) que llega. La clave única evita procesar dos veces el mismo
-- aviso: Mercado Pago reintenta si no respondemos rápido.
create table public.payment_events (
  id            bigint generated always as identity primary key,
  provider      text not null default 'mercadopago',
  request_id    text not null unique,                 -- header x-request-id
  topic         text not null,                        -- 'order', 'payment'...
  resource_id   text not null,                        -- data.id
  order_id      uuid references public.orders (id) on delete set null,
  payload       jsonb not null,
  processed_at  timestamptz,
  error         text,
  received_at   timestamptz not null default now()
);

create index payment_events_resource_idx on public.payment_events (resource_id);

-- ---------------------------------------------------------------------------
-- 5. Seguridad del panel
-- ---------------------------------------------------------------------------

-- Reemplaza el contador en memoria: funciona igual con varias instancias de Vercel.
-- Se guarda un hash de la IP, no la IP.
create table public.admin_login_attempts (
  key           text primary key,                     -- sha256(ip + secreto) o 'global'
  failures      integer not null default 0,
  lockouts      integer not null default 0,           -- cuántas veces se bloqueó (duplica el tiempo)
  locked_until  timestamptz,
  last_attempt  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. RLS: todo cerrado para el navegador
-- ---------------------------------------------------------------------------

alter table public.products              enable row level security;
alter table public.product_variants      enable row level security;
alter table public.orders                enable row level security;
alter table public.order_items           enable row level security;
alter table public.order_events          enable row level security;
alter table public.consents              enable row level security;
alter table public.withdrawal_requests   enable row level security;
alter table public.payment_events        enable row level security;
alter table public.admin_login_attempts  enable row level security;

-- Además de RLS, se sacan los permisos de las claves públicas (defensa en dos capas).
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke all on all functions in schema public from anon, authenticated, public;

-- Lo mismo para tablas y funciones que se creen más adelante.
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated, public;
