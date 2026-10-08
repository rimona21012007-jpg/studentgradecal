import React, { useState } from 'react'
import { Plus, ChevronDown, ChevronUp, Trash2, Copy, Edit2, AlertCircle, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useStore } from '@/store'
import { calcCourseGrade, getGradingSystem } from '@/lib/grading'
import { formatNumber, gradeColor } from '@/lib/utils'
import type { Profile, Semester, Course } from '@/types'
import { AssessmentRow } from './AssessmentRow'
import { AddCourseDialog } from './AddCourseDialog'

interface Props {
  profile: Profile
  semester: Semester | null
}

export function CoursesTable({ profile, semester }: Props) {
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set())
  const [addCourseOpen, setAddCourseOpen] = useState(false)
  const deleteCourse = useStore((s) => s.deleteCourse)
  const duplicateCourse = useStore((s) => s.duplicateCourse)
  const customSystems = useStore((s) => s.customGradingSystems)

  const system = getGradingSystem(profile.gradingSystemId, customSystems)

  function toggleExpand(courseId: string) {
    setExpandedCourses((prev) => {
      const next = new Set(prev)
      if (next.has(courseId)) next.delete(courseId)
      else next.add(courseId)
      return next
    })
  }

  if (!semester) {
    return (
      <div className="empty-state">
        <div style={{ opacity: 0.2 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <p style={{ fontWeight: 600 }}>Select a semester</p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>
          Choose a semester from the sidebar or create a new one
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Section header */}
      <div className="section-header">
        <div>
          <span className="section-title">{semester.name}</span>
          <span style={{ marginLeft: 8, fontSize: 'var(--text-xs)', color: 'var(--text-3)' }}>
            {semester.term} {semester.year} · {semester.courses.length} courses
          </span>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setAddCourseOpen(true)}
          style={{ gap: 4 }}
        >
          <Plus size={13} /> Add Course
        </button>
      </div>

      {/* Table */}
      {semester.courses.length === 0 ? (
        <div className="empty-state">
          <p style={{ fontWeight: 600 }}>No courses yet</p>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>
            Add your first course to start tracking grades
          </p>
          <button className="btn btn-primary btn-sm" onClick={() => setAddCourseOpen(true)} style={{ gap: 4 }}>
            <Plus size={13} /> Add Course
          </button>
        </div>
      ) : (
        <div style={{ overflow: 'auto', flex: 1 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 28 }}></th>
                <th>Course</th>
                <th>Code</th>
                <th style={{ textAlign: 'right' }}>Credits</th>
                <th style={{ textAlign: 'right' }}>Score</th>
                <th style={{ textAlign: 'center' }}>Grade</th>
                <th style={{ textAlign: 'right' }}>Points</th>
                <th style={{ textAlign: 'right' }}>Weight</th>
                <th style={{ width: 80 }}></th>
              </tr>
            </thead>
            <tbody>
              {semester.courses.map((course) => {
                const grade = calcCourseGrade(course, system)
                const expanded = expandedCourses.has(course.id)
                const totalWeight = course.assessments.reduce((s, a) => s + a.weight, 0)
                const weightOk = Math.abs(totalWeight - 100) < 0.01

                return (
                  <React.Fragment key={course.id}>
                    {/* Course row */}
                    <tr
                      style={{
                        background: expanded ? 'var(--row-selected)' : undefined,
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleExpand(course.id)}
                    >
                      <td style={{ paddingLeft: 8 }}>
                        {expanded ? <ChevronUp size={13} style={{ color: 'var(--text-3)' }} /> : <ChevronDown size={13} style={{ color: 'var(--text-3)' }} />}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 500 }}>{course.name}</span>
                          {!grade.isComplete && (
                            <span className="badge badge-warning">In Progress</span>
                          )}
                          {course.isZeroCredit && (
                            <span className="badge badge-neutral">No Credit</span>
                          )}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-3)', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                        {course.code}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                        {course.isZeroCredit ? '0' : course.credits}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }} onClick={(e) => e.stopPropagation()}>
                        {course.assessments.length === 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                            <input
                              className="input input-sm"
                              placeholder="Score/100"
                              style={{ width: 85, textAlign: 'right', fontSize: 'var(--text-xs)', height: 26 }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const val = parseFloat(e.currentTarget.value)
                                  if (!isNaN(val)) {
                                    useStore.getState().createAssessment(profile.id, semester.id, course.id, {
                                      name: 'Final Mark',
                                      weight: 100,
                                      score: val,
                                      maxScore: 100,
                                    })
                                  }
                                }
                              }}
                            />
                            <Tooltip.Root>
                              <Tooltip.Trigger asChild>
                                <div style={{ color: 'var(--text-3)' }}><ArrowRight size={14} /></div>
                              </Tooltip.Trigger>
                              <Tooltip.Portal>
                                <Tooltip.Content className="tooltip-content" sideOffset={5}>
                                  Press Enter to save
                                </Tooltip.Content>
                              </Tooltip.Portal>
                            </Tooltip.Root>
                          </div>
                        ) : (
                          grade.percentage !== null ? `${formatNumber(grade.percentage, 1)}%` : '—'
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <span className={`${gradeColor(grade.letter)}`} style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>
                            {grade.letter}
                          </span>
                          <AnimatePresence mode="wait">
                            {grade.percentage !== null && system.id === 'cgpa10' && (
                              <motion.span
                                key={grade.points > 0 ? 'pass' : 'fail'}
                                initial={{ opacity: 0, scale: 0.5, y: -5 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.5, y: 5 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                                className={`badge ${grade.points > 0 ? 'badge-success' : 'badge-danger'}`}
                                style={{ fontSize: '0.6rem', padding: '1px 5px', fontWeight: 700 }}
                              >
                                {grade.points > 0 ? 'PASS' : 'FAIL'}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-2)' }}>
                        {formatNumber(grade.gradePoints)}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Tooltip.Root>
                          <Tooltip.Trigger asChild>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
                              <div className="weight-bar" style={{ width: 40 }}>
                                <div
                                  className="weight-bar-fill"
                                  style={{
                                    width: `${Math.min(grade.completedWeight, 100)}%`,
                                    background: weightOk ? 'var(--success)' : grade.completedWeight > 100 ? 'var(--danger)' : 'var(--accent)',
                                  }}
                                />
                              </div>
                              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', width: 30 }}>
                                {grade.totalWeight}%
                              </span>
                              {!weightOk && grade.totalWeight > 0 && (
                                <AlertCircle size={12} style={{ color: 'var(--warning)' }} />
                              )}
                            </div>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content className="tooltip-content" sideOffset={5}>
                              Total weight: {grade.totalWeight}% (should be 100%)
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }} onClick={(e) => e.stopPropagation()}>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <button
                                className="btn btn-ghost btn-icon btn-sm"
                                onClick={() => duplicateCourse(profile.id, semester.id, course.id)}
                                aria-label="Duplicate course"
                              >
                                <Copy size={12} />
                              </button>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content className="tooltip-content" sideOffset={5}>Duplicate</Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                          <Tooltip.Root>
                            <Tooltip.Trigger asChild>
                              <button
                                className="btn btn-ghost btn-icon btn-sm"
                                onClick={() => deleteCourse(profile.id, semester.id, course.id)}
                                aria-label="Delete course"
                                style={{ color: 'var(--danger)' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content className="tooltip-content" sideOffset={5}>Delete</Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded assessments */}
                    {expanded && (
                      <tr>
                        <td colSpan={9} style={{ padding: 0, background: 'var(--bg-subtle)' }}>
                          <AssessmentSection
                            profile={profile}
                            semester={semester}
                            course={course}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <AddCourseDialog
        open={addCourseOpen}
        onClose={() => setAddCourseOpen(false)}
        profileId={profile.id}
        semesterId={semester.id}
      />
    </div>
  )
}

function AssessmentSection({ profile, semester, course }: { profile: Profile; semester: Semester; course: Course }) {
  const createAssessment = useStore((s) => s.createAssessment)
  const totalWeight = course.assessments.reduce((s, a) => s + a.weight, 0)
  const remaining = 100 - totalWeight

  return (
    <div style={{ padding: '8px 16px 16px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Assessments
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 'var(--text-xs)',
            color: remaining === 0 ? 'var(--success)' : remaining < 0 ? 'var(--danger)' : 'var(--warning)',
          }}>
            {remaining === 0
              ? '✓ 100% allocated'
              : remaining > 0
              ? `${remaining}% remaining`
              : `${Math.abs(remaining)}% over`}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            style={{ gap: 4 }}
            onClick={() => createAssessment(profile.id, semester.id, course.id, {
              name: 'New Assessment',
              weight: Math.max(0, remaining),
              score: null,
              maxScore: 100,
            })}
          >
            <Plus size={11} /> Add
          </button>
        </div>
      </div>

      {/* Weight indicator bar */}
      <div className="weight-bar" style={{ marginBottom: 12, height: 3 }}>
        <div
          className="weight-bar-fill"
          style={{
            width: `${Math.min(totalWeight, 100)}%`,
            background: totalWeight === 100 ? 'var(--success)' : totalWeight > 100 ? 'var(--danger)' : 'var(--accent)',
          }}
        />
      </div>

      {course.assessments.length === 0 ? (
        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-4)' }}>No assessments added</p>
      ) : (
        <table className="data-table" style={{ fontSize: 'var(--text-xs)' }}>
          <thead>
            <tr>
              <th>Assessment</th>
              <th style={{ textAlign: 'right' }}>Weight</th>
              <th style={{ textAlign: 'right' }}>Score</th>
              <th style={{ textAlign: 'right' }}>Max</th>
              <th style={{ textAlign: 'right' }}>Contribution</th>
              <th style={{ width: 40 }}></th>
            </tr>
          </thead>
          <tbody>
            {course.assessments.map((assessment) => (
              <AssessmentRow
                key={assessment.id}
                assessment={assessment}
                profileId={profile.id}
                semesterId={semester.id}
                courseId={course.id}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
