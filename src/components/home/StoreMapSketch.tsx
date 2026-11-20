import { MapPin } from 'lucide-react';
import { STORE } from '@/lib/storeConfig';

/**
 * Esquema de cómo llegar, dibujado en código: sin mapa embebido no hay pedidos a terceros al cargar
 * (el botón "Abrir en Google Maps" lleva al mapa real). No está a escala.
 */
export function StoreMapSketch() {
  return (
    <figure className="relative h-56 overflow-hidden bg-[#e9e4d6] sm:h-64">
      {/* Manzanas */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'linear-gradient(90deg, #f7f3ea 0 6px, transparent 6px), linear-gradient(0deg, #f7f3ea 0 6px, transparent 6px)',
          backgroundSize: '84px 100%, 100% 62px',
          backgroundPosition: '20px 0, 0 14px',
        }}
      />
      {/* Av. Corrientes */}
      <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-9 -translate-y-1/2 bg-[#fffdf7] shadow-[0_0_0_1px_rgba(29,15,9,0.06)]" />
      {/* Subte B, por debajo de la avenida */}
      <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-0 -translate-y-1/2 border-t-[3px] border-dashed border-[#c8372d]/70" />
      <p aria-hidden="true" className="absolute left-3 top-[calc(50%-2.4rem)] text-[12px] font-bold uppercase tracking-[0.08em] text-[var(--ink-muted)]">
        Av. Corrientes
      </p>

      {[
        { name: 'Medrano', side: 'left-[8%]' },
        { name: 'Carlos Gardel', side: 'right-[8%]' },
      ].map((station) => (
        <div key={station.name} aria-hidden="true" className={`absolute top-1/2 flex -translate-y-1/2 flex-col items-center ${station.side}`}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#c8372d] text-[13px] font-bold text-white ring-4 ring-[#fffdf7]">B</span>
          <span className="absolute top-9 whitespace-nowrap rounded bg-white/90 px-1.5 py-0.5 text-[12px] font-semibold text-[var(--ink-secondary)]">
            {station.name}
          </span>
        </div>
      ))}

      <div aria-hidden="true" className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center pb-1">
        <span className="whitespace-nowrap rounded-md bg-[var(--brand-espresso)] px-2.5 py-1.5 text-[13px] font-bold text-white shadow-lg">
          Amancay · {STORE.address}
        </span>
        <MapPin className="-mt-0.5 h-8 w-8 fill-[var(--brand-gold)] text-[var(--brand-espresso)]" />
      </div>

      <figcaption className="sr-only">
        Esquema de ubicación: Amancay está sobre Avenida Corrientes al 3666, entre las estaciones Medrano y Carlos Gardel de la línea B de
        subte.
      </figcaption>
      <p aria-hidden="true" className="absolute bottom-2 right-3 text-[12px] text-[var(--ink-muted)]">
        Esquema, no a escala
      </p>
    </figure>
  );
}
