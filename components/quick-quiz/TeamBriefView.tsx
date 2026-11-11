import Link from 'next/link'
import CopyBriefButton from '@/components/form/CopyBriefButton'
import { briefName, briefToText, formatDuration, shownOrNotGiven, siteText } from '@/lib/quick-quiz/briefToText'
import { shortLabel } from '@/lib/quick-quiz/buildTeamBrief'
import type { TeamBrief } from '@/lib/quick-quiz/types'
import { LEAD_STYLES } from './leadStyles'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-charcoal/15 pt-6">
      <h2 className="mb-3 font-heading text-lg font-bold text-navy">{title}</h2>
      {children}
    </section>
  )
}

// Team-facing only. Never link to this from client-facing pages.
// embedded: inside another page (the quiz screen), a section instead of the
// page's main area, since a page has only one.
// back: a link above the brief, e.g. to the team's list of samples.
export default function TeamBriefView({
  brief,
  embedded = false,
  back,
}: {
  brief: TeamBrief
  embedded?: boolean
  back?: { href: string; label: string }
}) {
  const Outer = embedded ? 'section' : 'main'
  const { contact, lead, behaviour } = brief

  return (
    <Outer className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      {back && (
        <Link href={back.href} className="self-start text-sm font-semibold text-navy underline">
          {back.label}
        </Link>
      )}
      <header className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-charcoal/60">
          Pre-call brief - team only
        </p>
        <h1 className="font-heading text-3xl font-bold text-navy">{briefName(contact)}</h1>
        <p className="text-base font-medium">{brief.headline}</p>
        {brief.closeCalls.length > 0 && (
          // The quiz could not really tell client types apart (findCloseCalls).
          <div role="note" aria-label="Close call" className="flex flex-col gap-1 rounded-md border-2 border-navy p-3 text-sm">
            {brief.closeCalls.map((sentence) => (
              <p key={sentence}>
                <strong>Close call:</strong>
                {sentence.replace(/^Close call:/, '')}
              </p>
            ))}
          </div>
        )}
        <div>
          <CopyBriefButton text={briefToText(brief)} />
        </div>
      </header>

      <Section title="Contact">
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          <dt className="text-charcoal/60">Email</dt>
          <dd>{shownOrNotGiven(contact.email)}</dd>
          <dt className="text-charcoal/60">Phone</dt>
          <dd>{shownOrNotGiven(contact.phone)}</dd>
          <dt className="text-charcoal/60">Site</dt>
          <dd>{siteText(contact.siteAddress)}</dd>
        </dl>
      </Section>

      {/* Oct 28 meeting: the lead label sits above the client type. */}
      <Section title="Lead">
        <p className="mb-3">
          <span
            data-testid="lead-temperature"
            className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${LEAD_STYLES[lead.temperature]}`}
          >
            {lead.temperature} lead
          </span>
        </p>
        <ul className="mb-3 flex flex-col gap-1 text-sm">
          {lead.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
          {lead.details.map((d) => (
            <div key={d.id} className="contents">
              <dt className="text-charcoal/60">{d.label}</dt>
              <dd>{d.answer ?? 'Not answered'}</dd>
            </div>
          ))}
        </dl>
        {lead.warningSigns.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2">
            {lead.warningSigns.map((f) => (
              <li key={f.id} className="rounded-lg border-l-4 border-accent bg-white/70 px-3 py-2 text-sm">
                {f.note}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Client type">
        {brief.blend.insufficient ? (
          <p className="text-sm">Not enough answers to identify a client type.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {brief.blend.scores.map((s) => (
              <li key={s.id} className="grid grid-cols-[10rem_1fr_3rem] items-center gap-3 text-sm">
                <span>{shortLabel(s.label)}</span>
                <span className="h-2 rounded-full bg-charcoal/10" aria-hidden>
                  <span className="block h-2 rounded-full bg-navy" style={{ width: `${s.percent}%` }} />
                </span>
                <span className="text-right tabular-nums">{s.percent}%</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {brief.highlights.length > 0 && (
        <Section title="How to work with them">
          <div className="flex flex-col gap-4">
            {brief.highlights.map((h) => (
              <article key={h.id} className="rounded-xl bg-white/70 p-4 shadow-sm">
                <h3 className="font-heading font-bold text-navy">
                  {shortLabel(h.label)} <span className="font-normal text-charcoal/60">({h.percent}%)</span>
                </h3>
                <p className="mb-3 text-sm italic text-charcoal/70">{h.tagline}</p>
                <dl className="flex flex-col gap-2 text-sm">
                  <div>
                    <dt className="font-semibold">Communication</dt>
                    <dd>{h.communication}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Pacing</dt>
                    <dd>{h.pacing}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Pitch</dt>
                    <dd>{h.pitch}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold">Watch for</dt>
                    <dd>
                      <ul className="list-disc pl-5">
                        {h.risks.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                  {h.tip && (
                    <div>
                      <dt className="font-semibold">Tip</dt>
                      <dd>{h.tip}</dd>
                    </div>
                  )}
                </dl>
              </article>
            ))}
          </div>
        </Section>
      )}

      <Section title="Behaviour">
        <ul className="flex flex-col gap-1 text-sm">
          <li>Time to complete: {formatDuration(behaviour.durationSeconds)}</li>
          <li>
            Skipped:{' '}
            {behaviour.skippedQuestions.length === 0 ? 'none' : behaviour.skippedQuestions.join(' / ')}
          </li>
          {behaviour.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </Section>

      <Section title="Answers">
        <details>
          <summary className="cursor-pointer text-sm font-semibold">Show all answers</summary>
          <dl className="mt-3 flex flex-col gap-3 text-sm">
            {brief.answers.map((a) => (
              <div key={a.questionId}>
                <dt className="text-charcoal/60">{a.prompt}</dt>
                <dd>{a.answer ?? <em>(skipped)</em>}</dd>
              </div>
            ))}
          </dl>
        </details>
      </Section>
    </Outer>
  )
}
