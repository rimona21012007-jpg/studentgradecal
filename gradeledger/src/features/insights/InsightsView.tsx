import React, { useMemo, Suspense, lazy } from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { calcCumulativeResult, calcSemesterResult, calcCourseGrade, getGradingSystem } from '@/lib/grading'
import { formatNumber, gradeColor } from '@/lib/utils'
import type { Profile } from '@/types'
import { useStore } from '@/store'

interface Props {
  profile: Profile
}

const CHART_COLORS = [
  'hsl(38, 92%, 50%)',   // accent
  'hsl(200, 70%, 45%)', // blue
  'hsl(145, 60%, 40%)', // green
  'hsl(0, 72%, 48%)',   // red
  'hsl(270, 60%, 55%)', // purple
]

export function InsightsView({ profile }: Props) {
  const customSystems = useStore((s) => s.customGradingSystems)
  const system = getGradingSystem(profile.gradingSystemId, customSystems)
  const cumResult = calcCumulativeResult(profile.semesters, system)

  // GPA trend data
  const gpaTrajectory = useMemo(() => {
    return profile.semesters.map((sem, i) => {
      const result = cumResult.semesterResults[i]
      return {
        name: sem.name,
        sgpa: result?.sgpa ?? null,
        cgpa: cumResult.semesterResults
          .slice(0, i + 1)
          .reduce((acc, r) => {
            // Running cumulative
            return r.sgpa !== null ? r.sgpa : acc
          }, null as number | null),
      }
    }).filter((d) => d.sgpa !== null)
  }, [profile.semesters, cumResult])

  // Grade distribution
  const gradeDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    profile.semesters.forEach((sem) => {
      sem.courses.forEach((course) => {
        const grade = calcCourseGrade(course, system)
        const letter = grade.letter.charAt(0)
        if (letter !== '—') counts[letter] = (counts[letter] ?? 0) + 1
      })
    })
    return Object.entries(counts)
      .sort(([a], [b]) => {
        const order = ['A', 'B', 'C', 'D', 'F']
        return order.indexOf(a) - order.indexOf(b)
      })
      .map(([letter, count]) => ({ letter, count }))
  }, [profile.semesters, system])

  // Top courses by grade
  const topCourses = useMemo(() => {
    const all: Array<{ name: string; code: string; gpa: number; credits: number }> = []
    profile.semesters.forEach((sem) => {
      sem.courses.forEach((course) => {
        const grade = calcCourseGrade(course, system)
        if (grade.gradePoints !== null) {
          all.push({ name: course.name, code: course.code, gpa: grade.gradePoints, credits: course.credits })
        }
      })
    })
    return all.sort((a, b) => b.gpa - a.gpa)
  }, [profile.semesters, system])

  if (profile.semesters.length === 0) {
    return (
      <div className="empty-state">
        <p style={{ fontWeight: 600 }}>No data yet</p>
        <p style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>
          Add semesters and courses to see insights
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { label: 'Cumulative GPA', value: formatNumber(cumResult.cgpa), mono: true },
          { label: 'Total Credits', value: cumResult.totalCredits.toString(), mono: true },
          { label: 'Courses Taken', value: profile.semesters.reduce((s, sem) => s + sem.courses.length, 0).toString(), mono: true },
          { label: 'Semesters', value: profile.semesters.length.toString(), mono: true },
        ].map((stat) => (
          <div key={stat.label} className="panel">
            <p className="stat-label">{stat.label}</p>
            <p className="stat-value" style={{ marginTop: 6, fontFamily: stat.mono ? 'var(--font-mono)' : undefined }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* GPA Trend Chart */}
      {gpaTrajectory.length > 1 && (
        <div className="card">
          <div className="section-header">
            <span className="section-title">GPA Trend</span>
          </div>
          <div style={{ padding: '16px 8px 8px' }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={gpaTrajectory} margin={{ top: 4, right: 20, bottom: 4, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: 'var(--text-3)', fontFamily: 'var(--font-ui)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, system.maxPoints]}
                  tick={{ fontSize: 11, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}
                  axisLine={false}
                  tickLine={false}
                  width={28}
                />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-overlay)',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    fontSize: 12,
                    fontFamily: 'var(--font-ui)',
                    color: 'var(--text-1)',
                  }}
                  formatter={(v: any) => [formatNumber(Number(v)), 'SGPA']}
                />
                <Line
                  type="monotone"
                  dataKey="sgpa"
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ fill: 'var(--accent)', r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Grade Distribution */}
      {gradeDistribution.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card">
            <div className="section-header">
              <span className="section-title">Grade Distribution</span>
            </div>
            <div style={{ padding: '16px 8px 8px' }}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={gradeDistribution} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="letter" tick={{ fontSize: 12, fill: 'var(--text-3)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--bg-overlay)',
                      border: '1px solid var(--border)',
                      borderRadius: 6,
                      fontSize: 12,
                      fontFamily: 'var(--font-ui)',
                      color: 'var(--text-1)',
                    }}
                  />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {gradeDistribution.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.letter === 'A' ? 'hsl(145, 60%, 40%)' :
                          entry.letter === 'B' ? 'hsl(200, 70%, 45%)' :
                          entry.letter === 'C' ? 'hsl(38, 90%, 50%)' :
                          entry.letter === 'D' ? 'hsl(25, 80%, 48%)' :
                          'hsl(0, 72%, 48%)'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top / Bottom courses */}
          <div className="card">
            <div className="section-header">
              <span className="section-title">Course Performance</span>
            </div>
            <div style={{ overflow: 'auto', maxHeight: 220 }}>
              <table className="data-table" style={{ fontSize: 'var(--text-xs)' }}>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th style={{ textAlign: 'right' }}>GPA Points</th>
                    <th style={{ textAlign: 'right' }}>Credits</th>
                  </tr>
                </thead>
                <tbody>
                  {topCourses.slice(0, 10).map((c) => (
                    <tr key={c.code + c.name}>
                      <td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{c.name}</div>
                          <div style={{ color: 'var(--text-4)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>{c.code}</div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        <span style={{
                          color: c.gpa >= system.maxPoints * 0.8 ? 'var(--success)' : c.gpa >= system.maxPoints * 0.6 ? 'var(--text-1)' : 'var(--danger)',
                        }}>
                          {formatNumber(c.gpa)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{c.credits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
