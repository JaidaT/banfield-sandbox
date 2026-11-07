import { contactName } from './output'
import type { OutputAnswer, QuestionnaireOutput } from './output'

// Phones often type curly quotes, long dashes and a one-character "...".
// These become plain characters. Accented letters (Rene with an accent) are
// kept, because changing someone's name would be worse.
function plain(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/ /g, ' ')
}

function answerLines(answer: OutputAnswer): string[] {
  if (answer.cards) {
    return answer.cards.map((card, i) => `  Card ${i + 1}: ${card.map((l) => `${l.label}: ${l.value}`).join(' / ')}`)
  }
  return [`  ${answer.value ?? '(skipped)'}`]
}

// Plain-text version of the questionnaire output, for "Copy as text".
// Hidden questions are left out; skipped ones say "(skipped)".
export function outputToText(output: QuestionnaireOutput): string {
  const lines: string[] = [
    `GET TO KNOW YOU: ${contactName(output) ?? 'No name given'}`,
    `Steps skipped: ${output.skippedSteps.length === 0 ? 'none' : output.skippedSteps.join(', ')}`,
  ]

  for (const step of output.steps) {
    lines.push('', step.title.toUpperCase())
    for (const answer of step.answers) {
      if (answer.status === 'hidden') continue
      lines.push(answer.prompt, ...answerLines(answer))
    }
  }
  return plain(lines.join('\n'))
}
