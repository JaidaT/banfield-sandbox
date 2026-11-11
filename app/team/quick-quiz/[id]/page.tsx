import { Suspense } from "react";
import { notFound } from "next/navigation";
import TeamBriefView from "@/components/quick-quiz/TeamBriefView";
import { sampleBrief, sampleIds } from "@/lib/quick-quiz/demo";

type Params = PageProps<"/team/quick-quiz/[id]">["params"];

export function generateStaticParams() {
  return sampleIds();
}

// One sample's pre-call brief, as the team would open it from the list.
// Reading which sample (the address) happens inside Suspense, so a click from
// the list shows the page straight away (Next.js instant navigation guide).
export default function BriefPage({ params }: PageProps<"/team/quick-quiz/[id]">) {
  return (
    <Suspense fallback={<p className="px-4 py-8">Loading...</p>}>
      <BriefContent params={params} />
    </Suspense>
  );
}

export async function BriefContent({ params }: { params: Params }) {
  const { id } = await params;
  const brief = sampleBrief(id);
  if (!brief) notFound();
  return <TeamBriefView brief={brief} back={{ href: "/team/quick-quiz", label: "Back to Quick Quiz samples" }} />;
}
