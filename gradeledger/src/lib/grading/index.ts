// Pure grading calculation functions — no side effects, fully typed
import type {
  Assessment,
  Course,
  CourseGrade,
  CumulativeResult,
  GradePoint,
  GradingSystem,
  Semester,
  SemesterResult,
  AcademicStanding,
  ClassRankBand,
} from '@/types'

// ─── Built-in Grading Systems ────────────────────────────────────────────────

export const GRADING_SYSTEMS: GradingSystem[] = [
  {
    id: 'gpa40',
    type: '4.0gpa',
    name: '4.0 GPA Scale (US)',
    maxPoints: 4.0,
    scale: [
      { letter: 'A+', minPercent: 97, maxPercent: 100, points: 4.0 },
      { letter: 'A', minPercent: 93, maxPercent: 96.99, points: 4.0 },
      { letter: 'A-', minPercent: 90, maxPercent: 92.99, points: 3.7 },
      { letter: 'B+', minPercent: 87, maxPercent: 89.99, points: 3.3 },
      { letter: 'B', minPercent: 83, maxPercent: 86.99, points: 3.0 },
      { letter: 'B-', minPercent: 80, maxPercent: 82.99, points: 2.7 },
      { letter: 'C+', minPercent: 77, maxPercent: 79.99, points: 2.3 },
      { letter: 'C', minPercent: 73, maxPercent: 76.99, points: 2.0 },
      { letter: 'C-', minPercent: 70, maxPercent: 72.99, points: 1.7 },
      { letter: 'D+', minPercent: 67, maxPercent: 69.99, points: 1.3 },
      { letter: 'D', minPercent: 63, maxPercent: 66.99, points: 1.0 },
      { letter: 'D-', minPercent: 60, maxPercent: 62.99, points: 0.7 },
      { letter: 'F', minPercent: 0, maxPercent: 59.99, points: 0.0 },
    ],
  },
  {
    id: 'cgpa10',
    type: 'cgpa10',
    name: '10-Point CGPA (Indian Universities)',
    maxPoints: 10,
    scale: [
      { letter: 'O', minPercent: 90, maxPercent: 100, points: 10 },
      { letter: 'A+', minPercent: 80, maxPercent: 89.99, points: 9 },
      { letter: 'A', minPercent: 70, maxPercent: 79.99, points: 8 },
      { letter: 'B+', minPercent: 60, maxPercent: 69.99, points: 7 },
      { letter: 'B', minPercent: 50, maxPercent: 59.99, points: 6 },
      { letter: 'C', minPercent: 45, maxPercent: 49.99, points: 5 },
      { letter: 'P', minPercent: 40, maxPercent: 44.99, points: 4 },
      { letter: 'F', minPercent: 0, maxPercent: 39.99, points: 0 },
    ],
  },
  {
    id: 'percentage',
    type: 'percentage',
    name: 'Percentage & Letter Grade',
    maxPoints: 100,
    scale: [
      { letter: 'A+', minPercent: 90, maxPercent: 100, points: 90 },
      { letter: 'A', minPercent: 80, maxPercent: 89.99, points: 80 },
      { letter: 'B', minPercent: 70, maxPercent: 79.99, points: 70 },
      { letter: 'C', minPercent: 60, maxPercent: 69.99, points: 60 },
      { letter: 'D', minPercent: 50, maxPercent: 59.99, points: 50 },
      { letter: 'F', minPercent: 0, maxPercent: 49.99, points: 0 },
    ],
  },
]

// ─── Core Calculation Functions ───────────────────────────────────────────────

/**
 * Calculate the weighted percentage score for a course from its assessments.
 * Returns null if no assessments have scores yet.
 * Partial calculation uses only the scored assessments weighted proportionally.
 */
export function calcCoursePercentage(assessments: Assessment[]): {
  percentage: number | null
  completedWeight: number
  totalWeight: number
  isComplete: boolean
} {
  const totalWeight = assessments.reduce((s, a) => s + a.weight, 0)
  const scored = assessments.filter((a) => a.score !== null)
  const completedWeight = scored.reduce((s, a) => s + a.weight, 0)

  if (scored.length === 0) {
    return { percentage: null, completedWeight: 0, totalWeight, isComplete: false }
  }

  // Weighted average of scored assessments, scaled to completedWeight
  const weightedSum = scored.reduce((s, a) => {
    const pct = a.score! / a.maxScore
    return s + pct * a.weight
  }, 0)

  // If all assessments scored: percentage = weightedSum / totalWeight * 100
  // If partial: project score out of completedWeight to give current standing
  const percentage =
    completedWeight > 0 ? (weightedSum / Math.max(completedWeight, 0.001)) * 100 : null

  const isComplete = Math.abs(completedWeight - totalWeight) < 0.01 && totalWeight > 0

  return { percentage, completedWeight, totalWeight, isComplete }
}

/**
 * Map a percentage to a grade point on the given scale.
 * Returns the lowest grade if percentage is 0 or negative.
 */
export function percentageToGradePoint(
  percentage: number,
  scale: GradePoint[],
): { letter: string; points: number } {
  if (percentage < 0) percentage = 0
  if (percentage > 100) percentage = 100

  // Sort scale descending by minPercent
  const sorted = [...scale].sort((a, b) => b.minPercent - a.minPercent)

  for (const grade of sorted) {
    if (percentage >= grade.minPercent) {
      return { letter: grade.letter, points: grade.points }
    }
  }

  // Fallback: return the lowest grade
  const lowest = sorted[sorted.length - 1]
  return { letter: lowest?.letter ?? 'F', points: lowest?.points ?? 0 }
}

/**
 * Compute a CourseGrade for a single course.
 */
export function calcCourseGrade(course: Course, system: GradingSystem): CourseGrade {
  const { percentage, completedWeight, totalWeight, isComplete } = calcCoursePercentage(
    course.assessments,
  )

  if (percentage === null) {
    return {
      courseId: course.id,
      percentage: null,
      letter: '—',
      gradePoints: null,
      isComplete: false,
      totalWeight,
      completedWeight,
    }
  }

  const { letter, points } = percentageToGradePoint(percentage, system.scale)

  return {
    courseId: course.id,
    percentage: round2(percentage),
    letter,
    gradePoints: points,
    isComplete,
    totalWeight,
    completedWeight,
  }
}

/**
 * Calculate SGPA for a semester.
 * SGPA = sum(gradePoints * credits) / sum(credits)
 * Zero-credit courses are excluded from the GPA calculation.
 */
export function calcSGPA(
  semester: Semester,
  system: GradingSystem,
  courseGrades: CourseGrade[],
): number | null {
  const gradeMap = new Map(courseGrades.map((g) => [g.courseId, g]))

  let totalCreditPoints = 0
  let totalCredits = 0

  for (const course of semester.courses) {
    if (course.isZeroCredit) continue
    const grade = gradeMap.get(course.id)
    if (!grade || grade.gradePoints === null) continue

    totalCreditPoints += grade.gradePoints * course.credits
    totalCredits += course.credits
  }

  if (totalCredits === 0) return null
  return round2(totalCreditPoints / totalCredits)
}

/**
 * Calculate semester result including course grades and SGPA.
 */
export function calcSemesterResult(semester: Semester, system: GradingSystem): SemesterResult {
  const courseGrades = semester.courses.map((c) => calcCourseGrade(c, system))
  const sgpa = calcSGPA(semester, system, courseGrades)

  const totalCredits = semester.courses.reduce(
    (s, c) => s + (c.isZeroCredit ? 0 : c.credits),
    0,
  )
  const earnedCredits = semester.courses.reduce((s, c) => {
    if (c.isZeroCredit) return s
    const grade = courseGrades.find((g) => g.courseId === c.id)
    if (!grade || grade.gradePoints === null || grade.gradePoints === 0) return s
    return s + c.credits
  }, 0)

  return { semesterId: semester.id, sgpa, totalCredits, earnedCredits, courseGrades }
}

/**
 * Calculate cumulative GPA/CGPA across all semesters.
 */
export function calcCumulativeResult(
  semesters: Semester[],
  system: GradingSystem,
): CumulativeResult {
  const semesterResults = semesters.map((s) => calcSemesterResult(s, system))

  let totalCreditPoints = 0
  let totalCredits = 0
  let earnedCredits = 0

  for (let i = 0; i < semesters.length; i++) {
    const sem = semesters[i]
    const result = semesterResults[i]
    for (const course of sem.courses) {
      if (course.isZeroCredit) continue
      const grade = result.courseGrades.find((g) => g.courseId === course.id)
      if (!grade || grade.gradePoints === null) continue
      totalCreditPoints += grade.gradePoints * course.credits
      totalCredits += course.credits
      if (grade.gradePoints > 0) earnedCredits += course.credits
    }
  }

  const cgpa = totalCredits > 0 ? round2(totalCreditPoints / totalCredits) : null

  return {
    cgpa,
    totalCredits,
    earnedCredits,
    semesterResults,
    academicStanding: getAcademicStanding(cgpa, system),
    classRankBand: getClassRankBand(cgpa, system),
  }
}

/**
 * Get academic standing based on CGPA and grading system.
 */
export function getAcademicStanding(
  cgpa: number | null,
  system: GradingSystem,
): AcademicStanding {
  if (cgpa === null) return 'Incomplete'

  const pct = (cgpa / system.maxPoints) * 100

  if (pct >= 75) return 'Distinction'
  if (pct >= 60) return 'First Class'
  if (pct >= 50) return 'Second Class'
  if (pct >= 40) return 'Pass'
  return 'Fail'
}

/**
 * Get class rank band based on CGPA.
 */
export function getClassRankBand(cgpa: number | null, system: GradingSystem): ClassRankBand {
  if (cgpa === null) return 'N/A'

  const pct = (cgpa / system.maxPoints) * 100

  if (pct >= 95) return 'Top 5%'
  if (pct >= 90) return 'Top 10%'
  if (pct >= 75) return 'Top 25%'
  if (pct >= 50) return 'Top 50%'
  return 'Bottom 50%'
}

/**
 * What-if simulator: apply hypothetical scores and recalculate CGPA.
 */
export function calcWhatIfCgpa(
  semesters: Semester[],
  system: GradingSystem,
  overrides: Map<string, number>, // courseId -> hypothetical percentage
): number | null {
  const modified = semesters.map((sem) => ({
    ...sem,
    courses: sem.courses.map((course) => {
      const override = overrides.get(course.id)
      if (override === undefined) return course

      // Create a synthetic single assessment with the override score
      const syntheticAssessment: Assessment = {
        id: '__whatif__',
        name: 'What-If Score',
        weight: 100,
        score: override,
        maxScore: 100,
      }

      return { ...course, assessments: [syntheticAssessment] }
    }),
  }))

  const result = calcCumulativeResult(modified, system)
  return result.cgpa
}

/**
 * Target planner: find required score to achieve target CGPA.
 * Uses linear interpolation to find the minimum score needed.
 */
export function calcTargetScore(
  currentSemesters: Semester[],
  system: GradingSystem,
  targetCgpa: number,
  remainingCreditTotal: number,
): { requiredGradePoints: number; isFeasible: boolean; message: string } {
  // Current state
  const current = calcCumulativeResult(currentSemesters, system)

  const currentPoints =
    (current.cgpa ?? 0) * current.totalCredits
  const totalFutureCredits = remainingCreditTotal
  const totalAfterCredits = current.totalCredits + totalFutureCredits

  if (totalAfterCredits === 0) {
    return {
      requiredGradePoints: 0,
      isFeasible: false,
      message: 'No credits to calculate.',
    }
  }

  // Required: (currentPoints + requiredPoints * remainingCredits) / totalAfterCredits = targetCgpa
  // => requiredPoints = (targetCgpa * totalAfterCredits - currentPoints) / remainingCredits
  const requiredPoints =
    (targetCgpa * totalAfterCredits - currentPoints) / Math.max(totalFutureCredits, 0.001)

  const isFeasible = requiredPoints >= 0 && requiredPoints <= system.maxPoints

  let message = ''
  if (requiredPoints < 0) {
    message = `You've already exceeded your target! Keep it up.`
  } else if (requiredPoints > system.maxPoints) {
    message = `Target is not achievable. Even with perfect scores, the maximum CGPA would be ${round2(
      (currentPoints + system.maxPoints * totalFutureCredits) / totalAfterCredits,
    )}.`
  } else {
    const pct = (requiredPoints / system.maxPoints) * 100
    message = `You need an average of ${round2(requiredPoints)} grade points (≈${round2(pct)}%) in all remaining courses.`
  }

  return {
    requiredGradePoints: round2(Math.max(0, requiredPoints)),
    isFeasible,
    message,
  }
}

/**
 * Convert GPA to approximate percentage (for display purposes).
 */
export function gpaToPercentage(gpa: number, maxPoints: number): number {
  return round2((gpa / maxPoints) * 100)
}

/**
 * Round to 2 decimal places.
 */
export function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Get GradingSystem by id from the built-in list or custom systems.
 */
export function getGradingSystem(
  id: string,
  customSystems: GradingSystem[] = [],
): GradingSystem {
  const all = [...GRADING_SYSTEMS, ...customSystems]
  return all.find((s) => s.id === id) ?? GRADING_SYSTEMS[0]
}
