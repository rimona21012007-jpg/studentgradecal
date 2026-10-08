// Core domain types for GradeLedger

export type GradingSystemType = '4.0gpa' | 'cgpa10' | 'percentage' | 'custom'

export interface GradePoint {
  letter: string
  minPercent: number
  maxPercent: number
  points: number
}

export interface GradingSystem {
  id: string
  type: GradingSystemType
  name: string
  maxPoints: number
  scale: GradePoint[]
}

export interface Assessment {
  id: string
  name: string
  weight: number // 0-100
  score: number | null // 0-100, null means pending
  maxScore: number
}

export interface Course {
  id: string
  name: string
  code: string
  credits: number
  assessments: Assessment[]
  gradingSystemId: string
  notes: string
  isZeroCredit: boolean
}

export interface Semester {
  id: string
  name: string
  year: number
  term: 'Fall' | 'Spring' | 'Summer' | 'Winter' | 'Odd' | 'Even'
  courses: Course[]
  isCompleted: boolean
}

export interface Profile {
  id: string
  name: string
  institution: string
  program: string
  semesters: Semester[]
  gradingSystemId: string
  createdAt: number
  updatedAt: number
}

export interface CourseGrade {
  courseId: string
  percentage: number | null
  letter: string
  gradePoints: number | null
  isComplete: boolean
  totalWeight: number
  completedWeight: number
}

export interface SemesterResult {
  semesterId: string
  sgpa: number | null
  totalCredits: number
  earnedCredits: number
  courseGrades: CourseGrade[]
}

export interface CumulativeResult {
  cgpa: number | null
  totalCredits: number
  earnedCredits: number
  semesterResults: SemesterResult[]
  academicStanding: AcademicStanding
  classRankBand: ClassRankBand
}

export type AcademicStanding =
  | 'Distinction'
  | 'First Class'
  | 'Second Class'
  | 'Pass'
  | 'Fail'
  | 'Incomplete'

export type ClassRankBand = 'Top 5%' | 'Top 10%' | 'Top 25%' | 'Top 50%' | 'Bottom 50%' | 'N/A'

export interface WhatIfEntry {
  courseId: string
  semesterId: string
  hypotheticalScore: number
}

export interface TargetPlannerInput {
  targetCgpa: number
  remainingCourses: Array<{
    courseId: string
    semesterId: string
    credits: number
  }>
}

export interface TargetPlannerResult {
  requiredScore: number | null
  isFeasible: boolean
  message: string
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  defaultGradingSystemId: string
  showCommandPalette: boolean
  reducedMotion: boolean
}
