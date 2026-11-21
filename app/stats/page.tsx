import { connection } from 'next/server'
import type { Metadata } from 'next'
import { sql } from '@/lib/db'

export const metadata: Metadata = { title: 'Visitor stats — Aetherfield' }

export default async function StatsPage() {
  await connection()

  const [generations] = (await sql`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE kind = 'image')::int AS images,
      count(*) FILTER (WHERE kind = 'video')::int AS videos,
      count(DISTINCT visitor_id)::int AS creators,
      count(DISTINCT visitor_id) FILTER (WHERE created_at > now() - interval '24 hours')::int AS active_day,
      count(DISTINCT visitor_id) FILTER (WHERE created_at > now() - interval '7 days')::int AS active_week
    FROM generations
  `) as Record<string, number>[]

  const stats = [
    { label: 'Total generations', value: generations.total },
    { label: 'Active creators today', value: generations.active_day },
    { label: 'Active creators this week', value: generations.active_week },
    { label: 'Creators', value: generations.creators },
    { label: 'Images generated', value: generations.images },
    { label: 'Videos generated', value: generations.videos },
  ]

  return (
    <main className="mx-auto flex max-w-[1600px] flex-col gap-8 px-4 py-12 md:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">Visitor stats</h1>
        <p className="text-muted-foreground">
          Usage metrics are derived from generated media saved in your private library.
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
            <dt className="text-sm text-muted-foreground">{stat.label}</dt>
            <dd className="font-mono text-3xl font-semibold tabular-nums">
              {stat.value.toLocaleString()}
            </dd>
          </div>
        ))}
      </dl>
    </main>
  )
}
