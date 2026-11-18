import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import CopyBriefButton from '@/components/form/CopyBriefButton'
import BriefTabs from '@/components/quick-quiz/BriefTabs'
import { briefName, briefToText, formatDuration, shownOrNotGiven, siteText } from '@/lib/quick-quiz/briefToText'
import { shortLabel } from '@/lib/quick-quiz/buildTeamBrief'
import type { DemoBrief } from '@/lib/quick-quiz/demoBrief'
import type { LeadTemperature, TeamBrief } from '@/lib/quick-quiz/types'

// Demo styling (2026-11-17, foyer-v1-demo-styling only): the brief follows the
// team's screenshots, with Analysis and Documentation tabs.

// Made-up demo data for one sample (data/quick-quiz/demo-brief.json).
export interface BriefDemo {
  meeting?: string
  inspiration: DemoBrief['inspiration']
  sections: DemoBrief['sections']
}

// Small capital labels ("OVERALL", "COMMUNICATION").
const SMALL_LABEL = 'text-xs font-semibold uppercase tracking-widest text-charcoal/70'
const CARD = 'rounded-2xl border-2 border-[var(--line)] bg-white p-4'

// The Overall pill (made-up colours: hot red-orange as in the screenshot).
const OVERALL_STYLES: Record<LeadTemperature, string> = {
  hot: 'bg-[#e4572e] text-white',
  warm: 'bg-accent text-charcoal',
  cold: 'bg-navy text-frost',
}

// Tile borders: green for good, yellow to check, red for a concern.
type TileStatus = 'neutral' | 'good' | 'check' | 'concern'
const TILE_BORDER: Record<TileStatus, string> = {
  neutral: 'border-[var(--line)]',
  good: 'border-[#3f9b5b]',
  check: 'border-accent',
  concern: 'border-[#d64545]',
}
const INVESTMENT_STATUS: Record<LeadTemperature, TileStatus> = { hot: 'good', warm: 'check', cold: 'concern' }

const capitalise = (word: string) => word.charAt(0).toUpperCase() + word.slice(1)

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold text-navy">{title}</h2>
      {children}
    </section>
  )
}

function StatusIcon({ status }: { status: TileStatus }) {
  if (status === 'neutral') return null
  const colour = status === 'good' ? 'bg-[#3f9b5b]' : status === 'check' ? 'bg-accent' : 'bg-[#d64545]'
  return (
    <span aria-hidden="true" className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${colour}`}>
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke={status === 'check' ? '#414040' : 'white'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {status === 'good' ? <path d="M5 13l4 4L19 7" /> : <path d="M12 6v7M12 18h.01" />}
      </svg>
    </span>
  )
}

function Tile({ name, status, dataStatus, children }: { name: string; status: TileStatus; dataStatus?: string; children: ReactNode }) {
  return (
    <div role="group" aria-label={name} data-status={dataStatus} className={`flex flex-col gap-1 rounded-2xl border-2 bg-white p-3 ${TILE_BORDER[status]}`}>
      <div className="flex items-start justify-between gap-2">
        <p className={SMALL_LABEL}>{name}</p>
        <StatusIcon status={status} />
      </div>
      {children}
    </div>
  )
}

function Chevron({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`h-4 w-4 ${className}`} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

// Team-facing only. Never link to this from client-facing pages.
// embedded: inside another page, a section instead of the page's main area.
// back: a link above the brief, e.g. to the team's list of samples.
// demo: made-up meeting line, inspiration photos and answer sections.
export default function TeamBriefView({
  brief,
  embedded = false,
  back,
  demo,
}: {
  brief: TeamBrief
  embedded?: boolean
  back?: { href: string; label: string }
  demo?: BriefDemo
}) {
  const Outer = embedded ? 'section' : 'main'
  const { contact, lead, behaviour, highlights } = brief
  // "80% Decisive Delegator / 20% ..." (the client type part of the headline).
  const typeLine = brief.headline.split(' | ')[1] ?? ''
  const detail = (id: string) => lead.details.find((d) => d.id === id)?.answer

  const analysis = (
    <>
      <Section title="Project Fit">
        <div className="flex items-center justify-between">
          <p className={SMALL_LABEL}>Overall</p>
          <span data-testid="lead-temperature" className={`rounded-full px-3 py-1 text-sm font-semibold ${OVERALL_STYLES[lead.temperature]}`}>
            {capitalise(lead.temperature)}
          </span>
        </div>
        <ul className="flex flex-col gap-1 text-sm">
          {lead.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        <div className="grid grid-cols-2 gap-3">
          <Tile name="Project type" status="neutral">
            <p className="font-bold text-charcoal">{detail('project') ?? 'Not answered'}</p>
            {lead.projectBar && <p className="text-xs text-charcoal/70">{lead.projectBar}</p>}
          </Tile>
          <Tile name="Investment" status={INVESTMENT_STATUS[lead.startingTemperature]} dataStatus={lead.startingTemperature}>
            <p className="font-bold text-charcoal">{detail('investment') ?? 'Not answered'}</p>
            <p className="text-xs text-charcoal/70">{`${capitalise(lead.startingTemperature)} for this project type`}</p>
          </Tile>
          <div className="col-span-2">
            <Tile name="Warning signs" status={lead.warningSigns.length > 0 ? 'concern' : 'good'} dataStatus={lead.warningSigns.length > 0 ? 'raised' : 'none'}>
              {lead.warningSigns.length === 0 ? (
                <p className="font-bold text-charcoal">None</p>
              ) : (
                <>
                  <ul className="flex flex-col gap-1 text-sm">
                    {lead.warningSigns.map((sign) => (
                      <li key={sign.id}>{sign.note}</li>
                    ))}
                  </ul>
                  <p className="text-xs font-semibold text-[#b03a3a]">Lowers the label one step</p>
                </>
              )}
            </Tile>
          </div>
        </div>
      </Section>

      <Section title="Client Type">
        {brief.blend.insufficient ? (
          <p className="text-sm">Not enough answers to identify a client type.</p>
        ) : (
          <>
            {highlights.map((h, index) => (
              <div key={h.id} className={`${CARD} flex flex-col gap-1`}>
                <div className="flex items-start justify-between gap-2">
                  <p className={SMALL_LABEL}>{index === 0 ? 'Primary client type' : 'Secondary client type'}</p>
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-bold text-charcoal">{h.percent}%</span>
                </div>
                <p className="text-lg font-bold text-navy">{shortLabel(h.label)}</p>
                <p className="text-sm text-charcoal/80">{h.tagline}</p>
              </div>
            ))}
            <ul aria-label="Client type breakdown" className="flex flex-col gap-2">
              {brief.blend.scores.map((s) => (
                <li key={s.id} className="grid grid-cols-[minmax(0,9rem)_1fr_2.5rem] items-center gap-3 text-sm">
                  <span>{shortLabel(s.label)}</span>
                  <span className="h-2 rounded-full bg-[var(--track)]" aria-hidden="true">
                    <span className="block h-2 rounded-full bg-accent" style={{ width: `${s.percent}%` }} />
                  </span>
                  <span className="text-right tabular-nums">{s.percent}%</span>
                </li>
              ))}
            </ul>
          </>
        )}
        <p className="text-sm">{`Client was shown: ${brief.designDnaShown}`}</p>
        {brief.closeCalls.length > 0 && (
          // The quiz could not really tell client types apart (findCloseCalls).
          <div role="note" aria-label="Close call" className="flex flex-col gap-1 rounded-xl border-2 border-navy bg-white p-3 text-sm">
            {brief.closeCalls.map((sentence) => (
              <p key={sentence}>
                <strong>Close call:</strong>
                {sentence.replace(/^Close call:/, '')}
              </p>
            ))}
          </div>
        )}
      </Section>

      {highlights.length > 0 && (
        <Section title="How to work with them">
          {highlights.map((h) => (
            <div key={h.id} className="flex flex-col gap-3">
              <article className={`${CARD} flex flex-col gap-3`}>
                {highlights.length > 1 && <h3 className="font-bold text-navy">{shortLabel(h.label)}</h3>}
                <dl className="flex flex-col gap-3 text-sm">
                  <div>
                    <dt className={SMALL_LABEL}>Communication</dt>
                    <dd>{h.communication}</dd>
                  </div>
                  <div>
                    <dt className={SMALL_LABEL}>Pacing</dt>
                    <dd>{h.pacing}</dd>
                  </div>
                  <div>
                    <dt className={SMALL_LABEL}>Pitch</dt>
                    <dd>{h.pitch}</dd>
                  </div>
                  <div>
                    <dt className={SMALL_LABEL}>Watch for</dt>
                    <dd>
                      <ul className="list-disc pl-5">
                        {h.risks.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                </dl>
              </article>
              {h.tip && (
                <div className="rounded-2xl border-2 border-accent bg-white p-4 text-sm">
                  <p className={SMALL_LABEL}>Tip</p>
                  <p>{h.tip}</p>
                </div>
              )}
            </div>
          ))}
        </Section>
      )}

      <Section title="Behaviour">
        <dl className={`${CARD} flex flex-col divide-y divide-[var(--line)] p-0 text-sm`}>
          <div className="flex justify-between gap-4 px-4 py-2.5">
            <dt>Time to complete</dt>
            <dd className="font-bold">{formatDuration(behaviour.durationSeconds)}</dd>
          </div>
          <div className="flex justify-between gap-4 px-4 py-2.5">
            <dt>Skipped</dt>
            <dd className="text-right font-bold">{behaviour.skippedQuestions.length === 0 ? 'None' : behaviour.skippedQuestions.join(' / ')}</dd>
          </div>
          {behaviour.notes.map((n) => (
            <div key={n} className="flex justify-between gap-4 px-4 py-2.5">
              <dt>Note</dt>
              <dd className="text-right font-bold">{n}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </>
  )

  const answerFor = (questionId: string) => brief.answers.find((a) => a.questionId === questionId)?.answer ?? null
  const answerRow = (key: string, label: string, answer: string | null) => (
    <div key={key} className="flex justify-between gap-4 py-2">
      <dt className="text-charcoal/80">{label}</dt>
      <dd className={`text-right ${answer === null ? 'text-charcoal/60' : 'font-semibold'}`}>{answer ?? 'Skipped'}</dd>
    </div>
  )

  const documentation = (
    <>
      <Section title="Contact">
        <dl className={`${CARD} flex flex-col divide-y divide-[var(--line)] p-0 text-sm`}>
          {[
            ['Email', shownOrNotGiven(contact.email)],
            ['Phone', shownOrNotGiven(contact.phone)],
            ['Site', siteText(contact.siteAddress)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 px-4 py-2.5">
              <dt className="text-charcoal/80">{label}</dt>
              <dd className="text-right font-semibold">{value}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section title="All answers">
        {demo ? (
          <div className="flex flex-col gap-2">
            {demo.sections.map((section, index) => (
              <details key={section.title} open={index === 0} className="group rounded-2xl border-2 border-[var(--line)] bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold text-navy [&::-webkit-details-marker]:hidden">
                  {section.title}
                  <Chevron className="-rotate-90 transition-transform group-open:rotate-90" />
                </summary>
                <dl className="flex flex-col divide-y divide-[var(--line)] px-4 pb-2 text-sm">
                  {section.rows.map((row) => answerRow(row.question, row.label, answerFor(row.question)))}
                </dl>
              </details>
            ))}
          </div>
        ) : (
          <dl className={`${CARD} flex flex-col divide-y divide-[var(--line)] py-1 text-sm`}>
            {brief.answers.map((a) => answerRow(a.questionId, a.prompt, a.answer))}
          </dl>
        )}
      </Section>

      {demo && demo.inspiration.length > 0 && (
        <Section title="Inspiration">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {demo.inspiration.map((photo) => (
              <Image key={photo.src} src={photo.src} alt={photo.alt} width={240} height={240} unoptimized className="h-28 w-28 shrink-0 rounded-xl object-cover" />
            ))}
            {/* Shown as in the screenshot; it does nothing in the demo. */}
            <div aria-hidden="true" className="flex h-28 w-28 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--line)] bg-white text-3xl font-bold text-charcoal/70">
              +
            </div>
          </div>
        </Section>
      )}
    </>
  )

  return (
    <Outer className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-6 text-charcoal sm:px-6">
      {back && (
        <Link href={back.href} className="flex items-center gap-1 self-start text-sm font-semibold text-navy hover:underline">
          <Chevron />
          {back.label}
        </Link>
      )}
      <header className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-3xl font-bold text-navy">{briefName(contact)}</h1>
          <CopyBriefButton text={briefToText(brief)} icon />
        </div>
        {typeLine && <p className="text-sm font-medium">{typeLine}</p>}
        {demo?.meeting && (
          <p className="flex items-center gap-2 text-sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4 text-navy" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M16 3v4M8 3v4M3 10h18" />
            </svg>
            <span>{demo.meeting}</span>
          </p>
        )}
      </header>

      <BriefTabs
        tabs={[
          { label: 'Analysis', content: analysis },
          { label: 'Documentation', content: documentation },
        ]}
      />
    </Outer>
  )
}
