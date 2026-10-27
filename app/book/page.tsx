import { Suspense } from "react";

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

async function PrefilledDetails({ searchParams }: { searchParams: PageProps<"/book">["searchParams"] }) {
  const params = await searchParams;
  const name = first(params.name);
  const email = first(params.email);
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-xl bg-white/70 p-4 text-sm shadow-sm">
      <dt className="text-charcoal/60">Name</dt>
      <dd>{name || "(not provided)"}</dd>
      <dt className="text-charcoal/60">Email</dt>
      <dd>{email || "(not provided)"}</dd>
    </dl>
  );
}

// Placeholder until Banfield's real booking page is connected (DISCOVERY P5).
export default function BookPage({ searchParams }: PageProps<"/book">) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-charcoal/60">
        Prototype placeholder
      </p>
      <h1 className="font-heading text-3xl font-bold text-navy">Book your Meet + Inspire</h1>
      <p className="leading-7">
        In the real site, this opens Banfield&apos;s booking page with these details already filled
        in, so the client does not have to type them again:
      </p>
      <Suspense fallback={<p className="text-sm">Loading details...</p>}>
        <PrefilledDetails searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
