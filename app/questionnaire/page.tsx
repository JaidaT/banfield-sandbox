import type { Metadata } from "next";
import QuestionnaireForm from "@/components/questionnaire/QuestionnaireForm";
import { loadQuestionnaire } from "@/lib/questionnaire/load";

export const metadata: Metadata = {
  title: "Let us get to know you (prototype)",
  description: "Wireframe prototype of Banfield Design Co.'s full client questionnaire.",
  robots: { index: false, follow: false },
};

// Loads and checks the questionnaire on the server, then hands it to the
// interactive form. A mistake in questionnaire.json fails the build here.
export default function QuestionnairePage() {
  return <QuestionnaireForm questionnaire={loadQuestionnaire()} />;
}
