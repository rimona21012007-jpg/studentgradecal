import { describe, it, expect } from 'vitest'
import {
  calcCoursePercentage,
  percentageToGradePoint,
  calcCourseGrade,
  calcSGPA,
  calcCumulativeResult,
  calcWhatIfCgpa,
  calcTargetScore,
  round2,
  GRADING_SYSTEMS,
} from '@/lib/grading'
import type { Assessment, Course, Semester } from '@/types'

const gpa40 = GRADING_SYSTEMS.find((s) => s.id === 'gpa40')!
const cgpa10 = GRADING_SYSTEMS.find((s) => s.id === 'cgpa10')!

// ─── Helper factories ─────────────────────────────────────────────────────────

function makeAssessment(score: number | null, weight: number, maxScore = 100): Assessment {
  return { id: crypto.randomUUID(), name: 'Test', weight, score, maxScore }
}

function makeCourse(assessments: Assessment[], credits = 3): Course {
  return {
    id: crypto.randomUUID(),
    name: 'Test Course',
    code: 'TEST101',
    credits,
    assessments,
    gradingSystemId: 'gpa40',
    notes: '',
    isZeroCredit: false,
  }
}

function makeSemester(courses: Course[]): Semester {
  return {
    id: crypto.randomUUID(),
    name: 'Semester 1',
    year: 2024,
    term: 'Fall',
    courses,
    isCompleted: true,
  }
}

// ─── calcCoursePercentage ─────────────────────────────────────────────────────

describe('calcCoursePercentage', () => {
  it('returns null for no scored assessments', () => {
    const { percentage } = calcCoursePercentage([makeAssessment(null, 100)])
    expect(percentage).toBeNull()
  })

  it('calculates 100% for perfect score', () => {
    const { percentage } = calcCoursePercentage([makeAssessment(100, 100)])
    expect(percentage).toBe(100)
  })

  it('calculates 70% correctly', () => {
    const { percentage } = calcCoursePercentage([makeAssessment(70, 100)])
    expect(percentage).toBe(70)
  })

  it('calculates weighted average correctly', () => {
    // 80 * 0.4 + 60 * 0.6 = 32 + 36 = 68
    const { percentage } = calcCoursePercentage([
      makeAssessment(80, 40),
      makeAssessment(60, 60),
    ])
    expect(percentage).toBeCloseTo(68, 1)
  })

  it('handles partial scoring — uses available assessments only', () => {
    // 1 scored at 90 out of 50 weight, 1 pending
    const { percentage, isComplete } = calcCoursePercentage([
      makeAssessment(90, 50),
      makeAssessment(null, 50),
    ])
    // partial: 90 / 50 * 100 = 90 (current standing)
    expect(percentage).toBeCloseTo(90, 1)
    expect(isComplete).toBe(false)
  })

  it('marks complete when all assessments scored', () => {
    const { isComplete } = calcCoursePercentage([
      makeAssessment(80, 50),
      makeAssessment(90, 50),
    ])
    expect(isComplete).toBe(true)
  })

  it('handles non-100 maxScore', () => {
    // score=45 out of maxScore=50 = 90%
    const { percentage } = calcCoursePercentage([
      { id: '1', name: 'Exam', weight: 100, score: 45, maxScore: 50 },
    ])
    expect(percentage).toBeCloseTo(90, 1)
  })
})

// ─── percentageToGradePoint ───────────────────────────────────────────────────

describe('percentageToGradePoint (4.0 GPA)', () => {
  it('maps 95% to A (4.0)', () => {
    const { letter, points } = percentageToGradePoint(95, gpa40.scale)
    expect(letter).toBe('A')
    expect(points).toBe(4.0)
  })

  it('maps 91% to A- (3.7)', () => {
    const { letter, points } = percentageToGradePoint(91, gpa40.scale)
    expect(letter).toBe('A-')
    expect(points).toBe(3.7)
  })

  it('maps 55% to F (0.0)', () => {
    const { points } = percentageToGradePoint(55, gpa40.scale)
    expect(points).toBe(0)
  })

  it('maps 0% without throwing', () => {
    const { points } = percentageToGradePoint(0, gpa40.scale)
    expect(points).toBe(0)
  })

  it('maps 100% to A+ (4.0)', () => {
    const { letter } = percentageToGradePoint(100, gpa40.scale)
    expect(letter).toBe('A+')
  })
})

describe('percentageToGradePoint (10-point CGPA)', () => {
  it('maps 92% to O (10)', () => {
    const { letter, points } = percentageToGradePoint(92, cgpa10.scale)
    expect(letter).toBe('O')
    expect(points).toBe(10)
  })

  it('maps 85% to A+ (9)', () => {
    const { letter, points } = percentageToGradePoint(85, cgpa10.scale)
    expect(letter).toBe('A+')
    expect(points).toBe(9)
  })

  it('maps 40% to P (4) — pass', () => {
    const { letter, points } = percentageToGradePoint(40, cgpa10.scale)
    expect(letter).toBe('P')
    expect(points).toBe(4)
  })

  it('maps 35% to F (0) — fail', () => {
    const { letter, points } = percentageToGradePoint(35, cgpa10.scale)
    expect(letter).toBe('F')
    expect(points).toBe(0)
  })
})

// ─── calcCourseGrade ──────────────────────────────────────────────────────────

describe('calcCourseGrade', () => {
  it('returns null grade for pending course', () => {
    const course = makeCourse([makeAssessment(null, 100)])
    const grade = calcCourseGrade(course, gpa40)
    expect(grade.gradePoints).toBeNull()
    expect(grade.letter).toBe('—')
  })

  it('returns A for 95% score', () => {
    const course = makeCourse([makeAssessment(95, 100)])
    const grade = calcCourseGrade(course, gpa40)
    expect(grade.letter).toBe('A')
    expect(grade.gradePoints).toBe(4.0)
  })
})

// ─── calcSGPA ─────────────────────────────────────────────────────────────────

describe('calcSGPA', () => {
  it('calculates correct SGPA: Example 1 (hand-computed)', () => {
    // CS101: 3cr, A (4.0) | MATH101: 4cr, B+ (3.3) | ENG101: 2cr, A- (3.7)
    // SGPA = (3*4.0 + 4*3.3 + 2*3.7) / (3+4+2) = (12 + 13.2 + 7.4) / 9 = 32.6/9 ≈ 3.62
    const c1 = makeCourse([makeAssessment(95, 100)], 3)  // A (4.0)
    const c2 = makeCourse([makeAssessment(88, 100)], 4)  // B+ (3.3)
    const c3 = makeCourse([makeAssessment(91, 100)], 2)  // A- (3.7)
    const sem = makeSemester([c1, c2, c3])
    const grades = sem.courses.map((c) => calcCourseGrade(c, gpa40))
    const sgpa = calcSGPA(sem, gpa40, grades)
    expect(sgpa).toBeCloseTo(3.62, 1)
  })

  it('returns null for semester with no scored courses', () => {
    const course = makeCourse([makeAssessment(null, 100)])
    const sem = makeSemester([course])
    const grades = sem.courses.map((c) => calcCourseGrade(c, gpa40))
    expect(calcSGPA(sem, gpa40, grades)).toBeNull()
  })

  it('excludes zero-credit courses from SGPA', () => {
    const scoredCourse = makeCourse([makeAssessment(95, 100)], 3)
    const zeroCreditCourse: Course = {
      ...makeCourse([makeAssessment(30, 100)], 0),
      isZeroCredit: true,
    }
    const sem = makeSemester([scoredCourse, zeroCreditCourse])
    const grades = sem.courses.map((c) => calcCourseGrade(c, gpa40))
    const sgpa = calcSGPA(sem, gpa40, grades)
    // Only the 3-credit A course counts: 4.0
    expect(sgpa).toBe(4.0)
  })
})

// ─── calcCumulativeResult ─────────────────────────────────────────────────────

describe('calcCumulativeResult', () => {
  it('calculates CGPA across multiple semesters (hand-computed)', () => {
    // Sem1: 4cr course at A (4.0) -> 16 credit-points
    // Sem2: 3cr course at B (3.0) -> 9 credit-points
    // Total: 25 credit-points / 7 credits = 3.57
    const sem1 = makeSemester([makeCourse([makeAssessment(95, 100)], 4)])
    const sem2 = makeSemester([makeCourse([makeAssessment(85, 100)], 3)])
    const result = calcCumulativeResult([sem1, sem2], gpa40)
    expect(result.cgpa).toBeCloseTo(3.57, 1)
  })

  it('returns Distinction standing for high CGPA', () => {
    const sem = makeSemester([makeCourse([makeAssessment(98, 100)], 4)])
    const result = calcCumulativeResult([sem], gpa40)
    expect(result.academicStanding).toBe('Distinction')
  })

  it('returns null CGPA when nothing scored', () => {
    const sem = makeSemester([makeCourse([makeAssessment(null, 100)], 3)])
    const result = calcCumulativeResult([sem], gpa40)
    expect(result.cgpa).toBeNull()
  })
})

// ─── calcWhatIfCgpa ───────────────────────────────────────────────────────────

describe('calcWhatIfCgpa', () => {
  it('overrides a pending course score and recalculates CGPA', () => {
    const course = makeCourse([makeAssessment(null, 100)], 3)
    const sem = makeSemester([course])
    const overrides = new Map([[course.id, 95]])
    const cgpa = calcWhatIfCgpa([sem], gpa40, overrides)
    // Override 95% -> A (4.0)
    expect(cgpa).toBe(4.0)
  })
})

// ─── round2 ───────────────────────────────────────────────────────────────────

describe('round2', () => {
  it('rounds 3.566 to 3.57', () => expect(round2(3.566)).toBe(3.57))
  it('rounds 3.564 to 3.56', () => expect(round2(3.564)).toBe(3.56))
  it('handles 0', () => expect(round2(0)).toBe(0))
  it('handles integers', () => expect(round2(4)).toBe(4))
})

// ─── calcTargetScore ──────────────────────────────────────────────────────────

describe('calcTargetScore', () => {
  it('marks infeasible when target requires points above max', () => {
    // Already at 2.0 CGPA with 10 credits, need 4.0 with only 1 credit remaining
    // Required = (4.0 * 11 - 2.0 * 10) / 1 = (44 - 20) / 1 = 24 > 4.0
    const sem = makeSemester([makeCourse([makeAssessment(55, 100)], 10)]) // ~2.0 GPA
    const result = calcTargetScore([sem], gpa40, 4.0, 1)
    expect(result.isFeasible).toBe(false)
  })

  it('returns feasible when target is achievable', () => {
    const sem = makeSemester([makeCourse([makeAssessment(95, 100)], 3)]) // 4.0
    const result = calcTargetScore([sem], gpa40, 3.5, 3)
    expect(result.isFeasible).toBe(true)
  })
})
