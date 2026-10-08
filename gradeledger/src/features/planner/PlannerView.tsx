import React, { useState, useMemo } from 'react'
import { Target, Lightbulb, ArrowRight, CheckCircle, XCircle } from 'lucide-react'
import { useStore } from '@/store'
import {
  calcCumulativeResult,
  calcWhatIfCgpa,
  calcTargetScore,
  getGradingSystem,
  round2,
} from '@/lib/grading'
import { formatNumber } from '@/lib/utils'
import type { Profile, Course, Semester } from '@/types'

interface Props {
  profile: Profile
}

export function PlannerView({ profile }: Props) {
  const customSystems = useStore((s) => s.customGradingSystems)
  const system = getGradingSystem(profile.gradingSystemId, customSystems)
  const cumulativeResult = calcCumulativeResult(profile.semesters, system)

  const [targetCgpa, setTargetCgpa] = useState<number>(
    Math.min(system.maxPoints, round2((cumulativeResult.cgpa ?? 0) + 0.5))
  )

  // What-if overrides: courseId -> percentage score
  const [whatIf, setWhatIf] = useState<Map<string, number>>(new Map())

  // Find all pending assessments (score === null)
  const pendingCourses = useMemo(() => {
    return profile.semesters.flatMap((sem) =>
      sem.courses
        .filter((c) => !c.isZeroCredit && c.assessments.some((a) => a.score === null))
        .map((c) => ({ course: c, semester: sem }))
    )
  }, [profile.semesters])

  const remainingCredits = pendingCourses.reduce((s, { course }) => s + course.credits, 0)

  const whatIfCgpa = useMemo(() => {
    if (whatIf.size === 0) return cumulativeResult.cgpa
    return calcWhatIfCgpa(profile.semesters, system, whatIf)
  }, [profile.semesters, system, whatIf, cumulativeResult.cgpa])

  const targetResult = useMemo(() => {
    return calcTargetScore(profile.semesters, system, targetCgpa, remainingCredits)
  }, [profile.semesters, system, targetCgpa, remainingCredits])

  return (
    <div style={{ padding: 24, maxWidth: 800, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Current state */}
      <div className="panel" style={{ display: 'flex', gap: 32 }}>
        <div>
          <p className="stat-label">Current CGPA</p>
          <p className="stat-value" style={{ marginTop: 4 }}>{formatNumber(cumulativeResult.cgpa)}</p>
        </div>
        <div>
          <p className="stat-label">Total Credits</p>
          <p className="stat-value" style={{ marginTop: 4 }}>{cumulativeResult.totalCredits}</p>
        </div>
        <div>
          <p className="stat-label">Pending Credits</p>
          <p className="stat-value" style={{ marginTop: 4 }}>{remainingCredits}</p>
        </div>
      </div>

      {/* Target Planner */}
      <div className="card">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={14} style={{ color: 'var(--accent)' }} />
            <span className="section-title">Target GPA Planner</span>
          </div>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <label className="form-label" style={{ whiteSpace: 'nowrap' }}>
              I want a CGPA of:
            </label>
            <input
              type="number"
              className="input input-number"
              value={targetCgpa}
              min={0}
              max={system.maxPoints}
              step={0.1}
              onChange={(e) => setTargetCgpa(parseFloat(e.target.value) || 0)}
              style={{ width: 80 }}
            />
            <span style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>
              / {system.maxPoints}
            </span>
          </div>

          {remainingCredits === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>
              <Lightbulb size={14} />
              No pending courses found. Add courses with pending assessments to use this planner.
            </div>
          ) : (
            <div style={{
              background: targetResult.isFeasible ? 'var(--success-bg)' : 'var(--danger-bg)',
              border: `1px solid ${targetResult.isFeasible ? 'var(--success)' : 'var(--danger)'}`,
              borderRadius: 'var(--radius-md)',
              padding: 16,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
            }}>
              {targetResult.isFeasible ? (
                <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 1 }} />
              ) : (
                <XCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 1 }} />
              )}
              <div>
                <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: targetResult.isFeasible ? 'var(--success)' : 'var(--danger)' }}>
                  {targetResult.isFeasible ? 'Achievable' : 'Not Achievable'}
                </p>
                <p style={{ fontSize: 'var(--text-sm)', marginTop: 4, color: 'var(--text-2)' }}>
                  {targetResult.message}
                </p>
                {targetResult.isFeasible && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div>
                      <p className="stat-label">Required Grade Points</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-xl)' }}>
                        {formatNumber(targetResult.requiredGradePoints)}
                      </p>
                    </div>
                    <div>
                      <p className="stat-label">Required %</p>
                      <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 'var(--text-xl)' }}>
                        {formatNumber(round2((targetResult.requiredGradePoints / system.maxPoints) * 100), 1)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* What-If Simulator */}
      <div className="card">
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lightbulb size={14} style={{ color: 'var(--accent)' }} />
            <span className="section-title">What-If Simulator</span>
          </div>
          {whatIf.size > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setWhatIf(new Map())}>
              Reset
            </button>
          )}
        </div>

        {pendingCourses.length === 0 ? (
          <div className="empty-state" style={{ padding: 32 }}>
            <p style={{ fontSize: 'var(--text-sm)' }}>No pending courses to simulate</p>
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div>
                <p className="stat-label">CGPA with overrides</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700 }}>
                    {formatNumber(whatIfCgpa)}
                  </span>
                  {whatIf.size > 0 && cumulativeResult.cgpa !== null && whatIfCgpa !== null && (
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      color: whatIfCgpa > cumulativeResult.cgpa ? 'var(--success)' : 'var(--danger)',
                      fontFamily: 'var(--font-mono)',
                    }}>
                      {whatIfCgpa > cumulativeResult.cgpa ? '+' : ''}
                      {formatNumber(whatIfCgpa - cumulativeResult.cgpa)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Semester</th>
                  <th style={{ textAlign: 'right' }}>Credits</th>
                  <th style={{ textAlign: 'right' }}>Hypothetical Score (%)</th>
                </tr>
              </thead>
              <tbody>
                {pendingCourses.map(({ course, semester }) => (
                  <tr key={course.id}>
                    <td style={{ fontWeight: 500 }}>{course.name}</td>
                    <td style={{ color: 'var(--text-3)', fontSize: 'var(--text-xs)' }}>{semester.name}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{course.credits}</td>
                    <td style={{ textAlign: 'right' }}>
                      <input
                        type="number"
                        className="score-input"
                        min={0}
                        max={100}
                        placeholder="—"
                        value={whatIf.get(course.id) ?? ''}
                        onChange={(e) => {
                          const n = parseFloat(e.target.value)
                          setWhatIf((prev) => {
                            const next = new Map(prev)
                            if (isNaN(n)) next.delete(course.id)
                            else next.set(course.id, n)
                            return next
                          })
                        }}
                        style={{ width: 80 }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
