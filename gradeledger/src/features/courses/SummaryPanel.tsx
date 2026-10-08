import React from 'react'
import { TrendingUp, Award, BookOpen, GraduationCap } from 'lucide-react'
import { useStore } from '@/store'
import { calcCumulativeResult, calcSemesterResult, getGradingSystem } from '@/lib/grading'
import { formatNumber, standingColor } from '@/lib/utils'
import type { Profile } from '@/types'

interface Props {
  profile: Profile
}

export function SummaryPanel({ profile }: Props) {
  const customSystems = useStore((s) => s.customGradingSystems)
  const system = getGradingSystem(profile.gradingSystemId, customSystems)
  const result = calcCumulativeResult(profile.semesters, system)

  const completedSemesters = profile.semesters.filter((s) => s.isCompleted)

  return (
    <div style={{
      borderLeft: '1px solid var(--border)',
      background: 'var(--bg-subtle)',
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      overflow: 'auto',
    }}>
      {/* Cumulative GPA */}
      <div>
        <p className="stat-label" style={{ marginBottom: 6 }}>Cumulative GPA</p>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span className="stat-value" style={{ fontSize: 32 }}>
            {formatNumber(result.cgpa)}
          </span>
          <span style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>
            / {system.maxPoints}
          </span>
        </div>
        {result.cgpa !== null && (
          <div style={{ marginTop: 6 }}>
            <div className="weight-bar">
              <div
                className="weight-bar-fill"
                style={{ width: `${(result.cgpa / system.maxPoints) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Standing */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <StatRow label="Standing">
          <span className={`badge ${standingColor(result.academicStanding)}`}>
            {result.academicStanding}
          </span>
        </StatRow>
        <StatRow label="Class Rank">
          <span className="badge badge-neutral">{result.classRankBand}</span>
        </StatRow>
      </div>

      <div className="divider" />

      {/* Credits */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <StatRow label="Total Credits" value={result.totalCredits.toString()} mono />
        <StatRow label="Earned Credits" value={result.earnedCredits.toString()} mono />
        <StatRow label="Semesters" value={profile.semesters.length.toString()} mono />
      </div>

      <div className="divider" />

      {/* Per-semester breakdown */}
      <div>
        <p className="stat-label" style={{ marginBottom: 8 }}>Per-Semester GPA</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {result.semesterResults.map((sr, i) => {
            const sem = profile.semesters[i]
            if (!sem) return null
            return (
              <div key={sr.semesterId} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: 'var(--text-xs)',
              }}>
                <span style={{ color: 'var(--text-2)' }}>{sem.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                  {sr.sgpa !== null ? formatNumber(sr.sgpa) : '—'}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {profile.semesters.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-4)', fontSize: 'var(--text-xs)' }}>
          Add semesters to see your GPA
        </div>
      )}
    </div>
  )
}

function StatRow({
  label,
  value,
  children,
  mono,
}: {
  label: string
  value?: string
  children?: React.ReactNode
  mono?: boolean
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>{label}</span>
      {children ?? (
        <span style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          fontFamily: mono ? 'var(--font-mono)' : undefined,
        }}>
          {value}
        </span>
      )}
    </div>
  )
}
