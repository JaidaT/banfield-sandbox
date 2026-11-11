// @vitest-environment node
import { ESLint } from 'eslint'
import { describe, expect, test } from 'vitest'

// Checks the folder rule in eslint.config.mjs: the shared form uses neither
// quiz, and the two quizzes never use each other. Each test lints a tiny
// made-up file as if it lived at that path (nothing is written to disk).
const eslint = new ESLint()

async function guardMessages(filePath: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath })
  return result.messages.filter((m) => m.ruleId === 'no-restricted-imports').map((m) => m.message)
}

const uses = (path: string) => `import x from '${path}'\nexport default x\n`

describe('folder guard (npm run lint)', () => {
  test('the shared form may not use the Quick Quiz', async () => {
    const messages = await guardMessages('lib/form/example.ts', uses('@/lib/quick-quiz/load'))
    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatch(/form.*quick-quiz/i)
  })

  test('the shared form may not use the long questionnaire, by any path', async () => {
    expect(await guardMessages('components/form/Example.tsx', uses('@/components/long-questionnaire/DoneScreen'))).toHaveLength(1)
    expect(await guardMessages('lib/form/example.ts', uses('../long-questionnaire/load'))).toHaveLength(1)
  })

  test('the shared form may not read a data file', async () => {
    // Also a Quick Quiz path, so it may be reported twice; one must be about data files.
    const messages = await guardMessages('lib/form/example.ts', uses('@/data/quick-quiz/questions.json'))
    expect(messages.some((m) => /data files/.test(m))).toBe(true)
  })

  test('the Quick Quiz may not use the long questionnaire', async () => {
    const messages = await guardMessages('lib/quick-quiz/example.ts', uses('@/lib/long-questionnaire/load'))
    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatch(/quick-quiz.*long-questionnaire/i)
  })

  test('the long questionnaire may not use the Quick Quiz', async () => {
    const messages = await guardMessages('components/long-questionnaire/Example.tsx', uses('@/components/quick-quiz/QuizForm'))
    expect(messages).toHaveLength(1)
    expect(messages[0]).toMatch(/long-questionnaire.*quick-quiz/i)
  })

  test('both quizzes may use the shared form and their own data', async () => {
    expect(await guardMessages('lib/quick-quiz/example.ts', uses('@/lib/form/types'))).toEqual([])
    expect(await guardMessages('lib/quick-quiz/example.ts', uses('@/data/quick-quiz/questions.json'))).toEqual([])
    expect(await guardMessages('components/long-questionnaire/Example.tsx', uses('@/components/form/QuestionnaireForm'))).toEqual([])
  })

  test('pages may use both quizzes (the team pages list both)', async () => {
    const code = `${uses('@/lib/quick-quiz/load')}import y from '@/lib/long-questionnaire/load'\nexport { y }\n`
    expect(await guardMessages('app/team/page.tsx', code)).toEqual([])
  })
}, 60_000)
