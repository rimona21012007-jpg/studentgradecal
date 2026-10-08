import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { calcCourseGrade, getGradingSystem, calcCumulativeResult } from '@/lib/grading'
import { formatNumber, gradeColor } from '@/lib/utils'
import type { Profile } from '@/types'
import { useStore } from '@/store'
import { CheckCircle2, XCircle, Award } from 'lucide-react'

interface Props {
  profile: Profile
}

export function ProgressReportView({ profile }: Props) {
  const customSystems = useStore((s) => s.customGradingSystems)
  const system = getGradingSystem(profile.gradingSystemId, customSystems)
  const cumResult = calcCumulativeResult(profile.semesters, system)

  // Flatten all courses into a report list
  const reportCards = useMemo(() => {
    const list: any[] = []
    profile.semesters.forEach((sem) => {
      sem.courses.forEach((course) => {
        const grade = calcCourseGrade(course, system)
        if (grade.isComplete || grade.percentage !== null) {
          const isPass = grade.points > 0 || grade.percentage >= 40 // simple check for non-zero points or >= 40%
          list.push({
            id: course.id,
            semesterName: sem.name,
            courseName: course.name,
            code: course.code,
            percentage: grade.percentage ?? 0,
            letter: grade.letter,
            points: grade.points,
            isPass,
          })
        }
      })
    })
    return list
  }, [profile.semesters, system])

  const passedCount = reportCards.filter((r) => r.isPass).length
  const failedCount = reportCards.length - passedCount
  const passRate = reportCards.length > 0 ? (passedCount / reportCards.length) * 100 : 0

  if (reportCards.length === 0) {
    return (
      <div className="empty-state">
        <p style={{ fontWeight: 600 }}>No graded courses yet</p>
        <p style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>
          Enter marks in the Courses tab to see your progress report.
        </p>
      </div>
    )
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      
      {/* Top Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        style={{ 
          background: 'linear-gradient(135deg, var(--bg-overlay) 0%, rgba(30,30,30,0) 100%)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          padding: 24,
          marginBottom: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div>
          <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Award size={24} style={{ color: 'var(--accent)' }} /> 
            Academic Progress Report
          </h2>
          <p style={{ color: 'var(--text-3)' }}>Performance overview across all semesters</p>
        </div>
        
        <div style={{ display: 'flex', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-1)' }}>{formatNumber(passRate, 0)}%</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1 }}>Pass Rate</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--success)' }}>{passedCount}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1 }}>Passed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: failedCount > 0 ? 'var(--danger)' : 'var(--text-3)' }}>{failedCount}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1 }}>Failed</div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {reportCards.map((report) => (
          <motion.div 
            key={report.id} 
            variants={itemVariants}
            style={{ 
              background: 'var(--bg-overlay)', 
              border: '1px solid var(--border)', 
              borderRadius: 12, 
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Subject Info */}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                {report.semesterName} • {report.code}
              </div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
                {report.courseName}
              </div>
            </div>

            {/* Progress Bar (Marks out of 100) */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                <span>Marks Obtained</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{formatNumber(report.percentage, 1)} / 100</span>
              </div>
              <div style={{ height: 8, background: 'var(--bg-subtle)', borderRadius: 4, overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(report.percentage, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  style={{ 
                    height: '100%', 
                    background: report.isPass ? 'var(--success)' : 'var(--danger)',
                    borderRadius: 4 
                  }}
                />
              </div>
            </div>

            {/* Letter Grade */}
            <div style={{ width: 60, textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>Grade</div>
              <div className={gradeColor(report.letter)} style={{ fontSize: 'var(--text-xl)', fontWeight: 800 }}>
                {report.letter}
              </div>
            </div>

            {/* Pass/Fail Badge */}
            <div style={{ width: 100, display: 'flex', justifyContent: 'flex-end' }}>
              {report.isPass ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--success)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                  <CheckCircle2 size={18} />
                  PASS
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--danger)', fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                  <XCircle size={18} />
                  FAIL
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
