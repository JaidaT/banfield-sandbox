import { notFound } from "next/navigation";
import TeamBriefView from "@/components/quick-quiz/TeamBriefView";
import { sampleBrief, sampleIds } from "@/lib/quick-quiz/demo";

export function generateStaticParams() {
  return sampleIds();
}

// One sample's pre-call brief, as the team would open it from the list.
export default async function BriefPage({ params }: PageProps<"/team/quick-quiz/[id]">) {
  const { id } = await params;
  const brief = sampleBrief(id);
  if (!brief) notFound();
  return <TeamBriefView brief={brief} back={{ href: "/team/quick-quiz", label: "Back to Quick Quiz samples" }} />;
}
