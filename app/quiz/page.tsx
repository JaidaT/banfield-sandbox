import type { Metadata } from "next";
import QuizForm from "@/components/quiz/QuizForm";
import { loadClientCopy, loadQuizData, loadQuizForm } from "@/lib/quiz/load";
import { quizQuestionnaire } from "@/lib/quiz/toQuestionnaire";

export const metadata: Metadata = {
  title: "Quick Quiz (prototype)",
  description: "Wireframe prototype of Banfield Design Co.'s Quick Quiz.",
  robots: { index: false, follow: false },
};

// Loads and checks every quiz data file on the server, then hands them to the
// interactive quiz. A mistake in a data file fails the build here.
export default function QuizPage() {
  const quizData = loadQuizData();
  return (
    <QuizForm
      questionnaire={quizQuestionnaire(quizData.questions, loadQuizForm())}
      quizData={quizData}
      clientCopy={loadClientCopy()}
    />
  );
}
