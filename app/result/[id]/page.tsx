import { notFound } from "next/navigation";
import ClientResultView from "@/components/ClientResultView";
import { sampleIds, sampleResult } from "@/lib/quiz/demo";

export function generateStaticParams() {
  return sampleIds();
}

export default async function ResultPage({ params }: PageProps<"/result/[id]">) {
  const { id } = await params;
  const result = sampleResult(id);
  if (!result) notFound();
  return <ClientResultView result={result} />;
}
