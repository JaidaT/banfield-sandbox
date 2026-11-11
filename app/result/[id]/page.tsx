import { Suspense } from "react";
import { notFound } from "next/navigation";
import ClientResultView from "@/components/quick-quiz/ClientResultView";
import { sampleIds, sampleResult } from "@/lib/quick-quiz/demo";

type Params = PageProps<"/result/[id]">["params"];

export function generateStaticParams() {
  return sampleIds();
}

// What one sample client would see after the quiz. Reading which sample (the
// address) happens inside Suspense, so a click from the list shows the page
// straight away (Next.js instant navigation guide).
export default function ResultPage({ params }: PageProps<"/result/[id]">) {
  return (
    <Suspense fallback={<p className="px-4 py-8">Loading...</p>}>
      <ResultContent params={params} />
    </Suspense>
  );
}

export async function ResultContent({ params }: { params: Params }) {
  const { id } = await params;
  const result = sampleResult(id);
  if (!result) notFound();
  return <ClientResultView result={result} />;
}
