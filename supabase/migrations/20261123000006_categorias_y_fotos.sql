-- =============================================================================
-- Rubros editables desde el panel + fotos en Supabase Storage
-- =============================================================================

create table public.categories (
  id           text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(id) <= 40),  -- va en la URL: /catalogo?rubro=mates
  label        text not null check (length(label) between 2 and 40),
  blurb        text not null default '' check (length(blurb) <= 200),
  image        text,
  variant_noun text not null default 'opción' check (variant_noun in ('opción', 'tamaño', 'color', 'modelo')),
  position     integer not null default 0,
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create trigger categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

insert into public.categories (id, label, blurb, image, variant_noun, position) values
  ('mates', 'Mates', 'Imperiales, camioneros, torpedos y poritos de calabaza, y mates de caldén y algarrobo.', '/productos/mate-imperial-calabaza-cuero-virola-alpaca-cincelada.webp', 'opción', 1),
  ('bombillas', 'Bombillas', 'Pico de loro, chatas y de cuchara, en alpaca y acero inoxidable.', '/productos/bombilla-pico-de-loro-alpaca-cincelada.webp', 'opción', 2),
  ('perfumes', 'Perfumes', 'Kevin, Bross London, CaroCuore, Valeria Mazza, Colbert, Ciel y Cannon.', '/productos/carocuore-cuore-perfume.webp', 'tamaño', 3),
  ('desodorantes', 'Desodorantes', 'Los desodorantes en aerosol de cada línea, para acompañar tu perfume.', '/productos/kevin-dubai-desodorante.webp', 'tamaño', 4),
  ('combos', 'Combos', 'Perfume y desodorante de la misma línea, en caja. Resuelven un regalo.', '/productos/bross-london-gold-perfume-desodorante.webp', 'opción', 5);

-- El rubro del producto pasa de una lista fija a la tabla. No se puede borrar un rubro con productos.
alter table public.products drop constraint if exists products_category_check;
alter table public.products
  add constraint products_category_fkey foreign key (category)
  references public.categories (id) on update cascade on delete restrict;

alter table public.categories enable row level security;
revoke all on public.categories from anon, authenticated;

-- Fotos: bucket público de solo lectura. Solo el servidor sube (con la clave secreta),
-- por eso no hay políticas de escritura. Máximo 5 MB y solo imágenes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;
