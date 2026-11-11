import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Folder guard: the two quizzes are separate products that share one form
// engine (DECISIONS.md 2026-11-11). Each import path is matched whether it
// starts with "@/" or "../". Pages in app/ and tests may use any folder.
const blocked = (folder, message) => ({ regex: `(^|/)${folder}(/|$)`, message });

const NO_QUICK_QUIZ = "uses the Quick Quiz, which only the Quick Quiz's own folders and pages may do.";
const NO_LONG = "uses the long questionnaire, which only its own folders and pages may do.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["lib/form/**", "components/form/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          blocked("quick-quiz", `Shared form code in form/ must not use quick-quiz/: it ${NO_QUICK_QUIZ} Pass what the form needs in as a prop instead.`),
          blocked("long-questionnaire", `Shared form code in form/ must not use long-questionnaire/: it ${NO_LONG} Pass what the form needs in as a prop instead.`),
          blocked("data", "Shared form code in form/ must not read data files. Each quiz loads its own data and hands it to the form."),
        ],
      }],
    },
  },
  {
    files: ["lib/quick-quiz/**", "components/quick-quiz/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          blocked("long-questionnaire", `Quick Quiz code in quick-quiz/ must not use long-questionnaire/: it ${NO_LONG} Move anything both need into form/.`),
        ],
      }],
    },
  },
  {
    files: ["lib/long-questionnaire/**", "components/long-questionnaire/**"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          blocked("quick-quiz", `Long questionnaire code in long-questionnaire/ must not use quick-quiz/: it ${NO_QUICK_QUIZ} Move anything both need into form/.`),
        ],
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
