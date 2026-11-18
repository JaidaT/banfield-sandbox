import { Suspense } from "react";
import { notFound } from "next/navigation";
import TeamBriefView from "@/components/quick-quiz/TeamBriefView";
import { sampleBrief, sampleIds } from "@/lib/quick-quiz/demo";
import { loadDemoBrief } from "@/lib/quick-quiz/demoBrief";

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
  // Demo styling (2026-11-17): made-up meeting line, inspiration photos and
  // answer sections from data/quick-quiz/demo-brief.json.
  const demo = loadDemoBrief();
  return (
    <TeamBriefView
      brief={brief}
      back={{ href: "/team/quick-quiz", label: "All briefs" }}
      demo={{ meeting: demo.meetings[id], inspiration: demo.inspiration, sections: demo.sections }}
    />
  );
}
