// Bold text in the quiz wording: **like this** (the welcome screen's
// "**5 minutes**", Jaida, 2026-11-23).

export interface TextPart {
  text: string
  bold: boolean
}

// True when every ** has a partner, so the bold parts are closed.
export function boldMarksPaired(text: string): boolean {
  return text.split('**').length % 2 === 1
}

// Splits a paragraph into plain and bold parts, leaving out empty ones.
export function boldParts(text: string): TextPart[] {
  return text
    .split('**')
    .map((part, index) => ({ text: part, bold: index % 2 === 1 }))
    .filter((part) => part.text !== '')
}

// The paragraph without the ** marks, for places that show plain text.
export function withoutBoldMarks(text: string): string {
  return text.split('**').join('')
}
