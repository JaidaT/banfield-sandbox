import { notFound } from "next/navigation";
import TeamBriefView from "@/components/quick-quiz/TeamBriefView";
import { sampleBrief, sampleIds } from "@/lib/quick-quiz/demo";

export function generateStaticParams() {
  return sampleIds();
}

export default async function BriefPage({ params }: PageProps<"/team/brief/[id]">) {
  const { id } = await params;
  const brief = sampleBrief(id);
  if (!brief) notFound();
  return <TeamBriefView brief={brief} />;
}
