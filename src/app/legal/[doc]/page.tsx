import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import { LEGAL_DOCS, LEGAL_ORDER, hasPlaceholders, legalPath, type LegalSlug } from '@/lib/legal';

type Params = Promise<{ doc: string }>;

export function generateStaticParams() {
  return LEGAL_ORDER.map((doc) => ({ doc }));
}

function find(doc: string) {
  return (LEGAL_ORDER as string[]).includes(doc) ? LEGAL_DOCS[doc as LegalSlug] : null;
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const doc = find((await params).doc);
  if (!doc) return { title: 'Página no encontrada' };
  return { title: doc.title, description: doc.description, alternates: { canonical: legalPath(doc.slug) } };
}

const dateLabel = (iso: string) =>
  new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${iso}T12:00:00`));

async function LegalDocument({ params }: { params: Params }) {
  const doc = find((await params).doc);
  if (!doc) notFound();

  return (
    <article className="mx-auto max-w-[760px] px-5 py-12 sm:px-8 sm:py-16">
      <nav aria-label="Ruta" className="mb-6 text-sm text-[var(--ink-muted)]">
        <Link href="/" className="inline-flex min-h-11 items-center hover:text-[var(--brand-leather)] hover:underline">
          Inicio
        </Link>
        <span aria-hidden="true" className="mx-2">
          /
        </span>
        <span>{doc.title}</span>
      </nav>
      <h1 className="font-display text-[36px] leading-tight sm:text-[44px]">{doc.title}</h1>
      <p className="mt-3 text-[var(--ink-muted)]">
        Perfumería Amancay · Versión del {dateLabel(doc.version)}
      </p>

      {hasPlaceholders(doc) && (
        <p role="note" className="mt-6 rounded-md border border-[var(--brand-brass)] bg-[var(--brand-brass-soft)] p-4 text-sm leading-relaxed">
          Borrador: los datos entre corchetes los completa el local y el texto lo revisa un abogado antes de publicar.
        </p>
      )}

      <div className="mt-10 space-y-10">
        {doc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-2xl">{section.heading}</h2>
            {section.paragraphs?.map((p) => (
              <p key={p} className="mt-3 max-w-[68ch] leading-[1.7] text-[var(--ink-secondary)]">
                {p}
              </p>
            ))}
            {section.list && (
              <ul className="mt-3 max-w-[68ch] list-disc space-y-2 pl-5 leading-[1.7] text-[var(--ink-secondary)] marker:text-[var(--brand-brass)]">
                {section.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {doc.links && (
        <ul className="mt-10 space-y-1 border-t border-[var(--amancay-border)] pt-6">
          {doc.links.map((l) => (
            <li key={l.href}>
              <a href={l.href} target="_blank" rel="noopener noreferrer" className="link-brass inline-flex min-h-11 items-center">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      )}

      <nav aria-label="Otros documentos legales" className="mt-12 rounded-lg bg-[var(--bg-subtle)] p-6">
        <h2 className="font-display text-xl">Otros documentos</h2>
        <ul className="mt-3 flex flex-wrap gap-x-6">
          {LEGAL_ORDER.filter((s) => s !== doc.slug).map((s) => (
            <li key={s}>
              <Link href={legalPath(s)} className="link-brass inline-flex min-h-11 items-center">
                {LEGAL_DOCS[s].title}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/arrepentimiento" className="link-brass inline-flex min-h-11 items-center">
              Botón de arrepentimiento
            </Link>
          </li>
        </ul>
      </nav>
    </article>
  );
}

export default function LegalPage({ params }: { params: Params }) {
  return (
    <Suspense fallback={<p className="p-16 text-center text-[var(--ink-muted)]">Cargando…</p>}>
      <LegalDocument params={params} />
    </Suspense>
  );
}
