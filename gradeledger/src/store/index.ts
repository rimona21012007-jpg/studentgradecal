import { create } from 'zustand'
import { persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { nanoid } from 'nanoid'
import type {
  Profile,
  Semester,
  Course,
  Assessment,
  AppSettings,
  GradingSystem,
} from '@/types'
import { DEMO_PROFILE } from '@/lib/demo-data'
import { GRADING_SYSTEMS } from '@/lib/grading'

// nanoid might not be available, use crypto
const uid = () => crypto.randomUUID()

interface HistoryEntry {
  profiles: Profile[]
  customGradingSystems: GradingSystem[]
}

interface AppState {
  // Data
  profiles: Profile[]
  activeProfileId: string | null
  activeSemesterId: string | null
  customGradingSystems: GradingSystem[]

  // UI
  settings: AppSettings
  commandPaletteOpen: boolean
  rightDrawerOpen: boolean
  activeTab: 'courses' | 'planner' | 'insights'

  // History for undo/redo
  past: HistoryEntry[]
  future: HistoryEntry[]

  // Profile actions
  createProfile: (name: string, institution: string, program: string) => void
  updateProfile: (id: string, data: Partial<Omit<Profile, 'id' | 'semesters'>>) => void
  deleteProfile: (id: string) => void
  setActiveProfile: (id: string) => void

  // Semester actions
  createSemester: (profileId: string, data: Omit<Semester, 'id' | 'courses'>) => void
  updateSemester: (profileId: string, semId: string, data: Partial<Omit<Semester, 'id' | 'courses'>>) => void
  deleteSemester: (profileId: string, semId: string) => void
  setActiveSemester: (id: string | null) => void

  // Course actions
  createCourse: (profileId: string, semId: string, data: Omit<Course, 'id' | 'assessments'>) => void
  updateCourse: (profileId: string, semId: string, courseId: string, data: Partial<Omit<Course, 'id' | 'assessments'>>) => void
  deleteCourse: (profileId: string, semId: string, courseId: string) => void
  duplicateCourse: (profileId: string, semId: string, courseId: string) => void

  // Assessment actions
  createAssessment: (profileId: string, semId: string, courseId: string, data: Omit<Assessment, 'id'>) => void
  updateAssessment: (profileId: string, semId: string, courseId: string, assessmentId: string, data: Partial<Omit<Assessment, 'id'>>) => void
  deleteAssessment: (profileId: string, semId: string, courseId: string, assessmentId: string) => void

  // Settings
  updateSettings: (data: Partial<AppSettings>) => void
  setCommandPaletteOpen: (open: boolean) => void
  setRightDrawerOpen: (open: boolean) => void
  setActiveTab: (tab: 'courses' | 'planner' | 'insights') => void

  // Grading systems
  addCustomGradingSystem: (system: Omit<GradingSystem, 'id'>) => void
  updateCustomGradingSystem: (id: string, data: Partial<Omit<GradingSystem, 'id'>>) => void
  deleteCustomGradingSystem: (id: string) => void

  // Undo/Redo
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  saveHistory: () => void

  // Import/Export
  exportJSON: () => string
  importJSON: (json: string) => void
  resetToDemo: () => void
  clearAll: () => void
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  defaultGradingSystemId: 'gpa40',
  showCommandPalette: true,
  reducedMotion: false,
}

export const useStore = create<AppState>()(
  persist(
    subscribeWithSelector(
      immer((set, get) => ({
        profiles: [DEMO_PROFILE],
        activeProfileId: DEMO_PROFILE.id,
        activeSemesterId: DEMO_PROFILE.semesters[DEMO_PROFILE.semesters.length - 1].id,
        customGradingSystems: [],
        settings: DEFAULT_SETTINGS,
        commandPaletteOpen: false,
        rightDrawerOpen: false,
        activeTab: 'courses',
        past: [],
        future: [],

        // ── Profile actions ──────────────────────────────────────────────

        createProfile: (name, institution, program) => {
          get().saveHistory()
          const id = uid()
          set((s) => {
            s.profiles.push({
              id,
              name,
              institution,
              program,
              gradingSystemId: s.settings.defaultGradingSystemId,
              semesters: [],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            })
            s.activeProfileId = id
            s.activeSemesterId = null
          })
        },

        updateProfile: (id, data) => {
          get().saveHistory()
          set((s) => {
            const p = s.profiles.find((p) => p.id === id)
            if (p) Object.assign(p, data, { updatedAt: Date.now() })
          })
        },

        deleteProfile: (id) => {
          get().saveHistory()
          set((s) => {
            s.profiles = s.profiles.filter((p) => p.id !== id)
            if (s.activeProfileId === id) {
              s.activeProfileId = s.profiles[0]?.id ?? null
              s.activeSemesterId = null
            }
          })
        },

        setActiveProfile: (id) => {
          set((s) => {
            s.activeProfileId = id
            const profile = s.profiles.find((p) => p.id === id)
            s.activeSemesterId = profile?.semesters[profile.semesters.length - 1]?.id ?? null
          })
        },

        // ── Semester actions ─────────────────────────────────────────────

        createSemester: (profileId, data) => {
          get().saveHistory()
          const id = uid()
          set((s) => {
            const p = s.profiles.find((p) => p.id === profileId)
            if (p) {
              p.semesters.push({ ...data, id, courses: [] })
              s.activeSemesterId = id
              p.updatedAt = Date.now()
            }
          })
        },

        updateSemester: (profileId, semId, data) => {
          get().saveHistory()
          set((s) => {
            const p = s.profiles.find((p) => p.id === profileId)
            const sem = p?.semesters.find((s) => s.id === semId)
            if (sem) Object.assign(sem, data)
          })
        },

        deleteSemester: (profileId, semId) => {
          get().saveHistory()
          set((s) => {
            const p = s.profiles.find((p) => p.id === profileId)
            if (p) {
              p.semesters = p.semesters.filter((s) => s.id !== semId)
              if (s.activeSemesterId === semId) {
                s.activeSemesterId = p.semesters[p.semesters.length - 1]?.id ?? null
              }
            }
          })
        },

        setActiveSemester: (id) => {
          set((s) => { s.activeSemesterId = id })
        },

        // ── Course actions ───────────────────────────────────────────────

        createCourse: (profileId, semId, data) => {
          get().saveHistory()
          set((s) => {
            const p = s.profiles.find((p) => p.id === profileId)
            const sem = p?.semesters.find((s) => s.id === semId)
            if (sem) {
              sem.courses.push({ ...data, id: uid(), assessments: [] })
              if (p) p.updatedAt = Date.now()
            }
          })
        },

        updateCourse: (profileId, semId, courseId, data) => {
          get().saveHistory()
          set((s) => {
            const p = s.profiles.find((p) => p.id === profileId)
            const sem = p?.semesters.find((s) => s.id === semId)
            const course = sem?.courses.find((c) => c.id === courseId)
            if (course) Object.assign(course, data)
          })
        },

        deleteCourse: (profileId, semId, courseId) => {
          get().saveHistory()
          set((s) => {
            const p = s.profiles.find((p) => p.id === profileId)
            const sem = p?.semesters.find((s) => s.id === semId)
            if (sem) sem.courses = sem.courses.filter((c) => c.id !== courseId)
          })
        },

        duplicateCourse: (profileId, semId, courseId) => {
          get().saveHistory()
          set((s) => {
            const p = s.profiles.find((p) => p.id === profileId)
            const sem = p?.semesters.find((s) => s.id === semId)
            const course = sem?.courses.find((c) => c.id === courseId)
            if (sem && course) {
              const newCourse = JSON.parse(JSON.stringify(course)) as Course
              newCourse.id = uid()
              newCourse.name = `${course.name} (Copy)`
              newCourse.assessments = newCourse.assessments.map((a) => ({ ...a, id: uid() }))
              sem.courses.push(newCourse)
            }
          })
        },

        // ── Assessment actions ───────────────────────────────────────────

        createAssessment: (profileId, semId, courseId, data) => {
          get().saveHistory()
          set((s) => {
            const p = s.profiles.find((p) => p.id === profileId)
            const sem = p?.semesters.find((s) => s.id === semId)
            const course = sem?.courses.find((c) => c.id === courseId)
            if (course) course.assessments.push({ ...data, id: uid() })
          })
        },

        updateAssessment: (profileId, semId, courseId, assessmentId, data) => {
          set((s) => {
            const p = s.profiles.find((p) => p.id === profileId)
            const sem = p?.semesters.find((s) => s.id === semId)
            const course = sem?.courses.find((c) => c.id === courseId)
            const assessment = course?.assessments.find((a) => a.id === assessmentId)
            if (assessment) Object.assign(assessment, data)
          })
        },

        deleteAssessment: (profileId, semId, courseId, assessmentId) => {
          get().saveHistory()
          set((s) => {
            const p = s.profiles.find((p) => p.id === profileId)
            const sem = p?.semesters.find((s) => s.id === semId)
            const course = sem?.courses.find((c) => c.id === courseId)
            if (course) course.assessments = course.assessments.filter((a) => a.id !== assessmentId)
          })
        },

        // ── Settings ─────────────────────────────────────────────────────

        updateSettings: (data) => {
          set((s) => { Object.assign(s.settings, data) })
        },

        setCommandPaletteOpen: (open) => {
          set((s) => { s.commandPaletteOpen = open })
        },

        setRightDrawerOpen: (open) => {
          set((s) => { s.rightDrawerOpen = open })
        },

        setActiveTab: (tab) => {
          set((s) => { s.activeTab = tab })
        },

        // ── Grading systems ──────────────────────────────────────────────

        addCustomGradingSystem: (system) => {
          set((s) => {
            s.customGradingSystems.push({ ...system, id: uid() })
          })
        },

        updateCustomGradingSystem: (id, data) => {
          set((s) => {
            const sys = s.customGradingSystems.find((s) => s.id === id)
            if (sys) Object.assign(sys, data)
          })
        },

        deleteCustomGradingSystem: (id) => {
          set((s) => {
            s.customGradingSystems = s.customGradingSystems.filter((s) => s.id !== id)
          })
        },

        // ── Undo/Redo ────────────────────────────────────────────────────

        saveHistory: () => {
          set((s) => {
            const entry: HistoryEntry = {
              profiles: JSON.parse(JSON.stringify(s.profiles)),
              customGradingSystems: JSON.parse(JSON.stringify(s.customGradingSystems)),
            }
            s.past = [...s.past.slice(-49), entry]
            s.future = []
          })
        },

        undo: () => {
          set((s) => {
            const prev = s.past[s.past.length - 1]
            if (!prev) return
            s.future = [
              { profiles: JSON.parse(JSON.stringify(s.profiles)), customGradingSystems: JSON.parse(JSON.stringify(s.customGradingSystems)) },
              ...s.future,
            ]
            s.past = s.past.slice(0, -1)
            s.profiles = prev.profiles
            s.customGradingSystems = prev.customGradingSystems
          })
        },

        redo: () => {
          set((s) => {
            const next = s.future[0]
            if (!next) return
            s.past = [
              ...s.past,
              { profiles: JSON.parse(JSON.stringify(s.profiles)), customGradingSystems: JSON.parse(JSON.stringify(s.customGradingSystems)) },
            ]
            s.future = s.future.slice(1)
            s.profiles = next.profiles
            s.customGradingSystems = next.customGradingSystems
          })
        },

        canUndo: () => get().past.length > 0,
        canRedo: () => get().future.length > 0,

        // ── Import/Export ────────────────────────────────────────────────

        exportJSON: () => {
          const { profiles, customGradingSystems, settings } = get()
          return JSON.stringify({ profiles, customGradingSystems, settings, version: 1 }, null, 2)
        },

        importJSON: (json) => {
          get().saveHistory()
          try {
            const data = JSON.parse(json) as { profiles: Profile[]; customGradingSystems: GradingSystem[]; settings: AppSettings }
            set((s) => {
              s.profiles = data.profiles ?? s.profiles
              s.customGradingSystems = data.customGradingSystems ?? s.customGradingSystems
              if (data.settings) Object.assign(s.settings, data.settings)
              s.activeProfileId = s.profiles[0]?.id ?? null
              s.activeSemesterId = null
            })
          } catch {
            throw new Error('Invalid JSON file')
          }
        },

        resetToDemo: () => {
          set((s) => {
            s.profiles = [{ ...DEMO_PROFILE, createdAt: Date.now(), updatedAt: Date.now() }]
            s.activeProfileId = DEMO_PROFILE.id
            s.activeSemesterId = DEMO_PROFILE.semesters[DEMO_PROFILE.semesters.length - 1].id
            s.past = []
            s.future = []
          })
        },

        clearAll: () => {
          set((s) => {
            s.profiles = []
            s.activeProfileId = null
            s.activeSemesterId = null
            s.past = []
            s.future = []
          })
        },
      })),
    ),
    {
      name: 'gradeledger-store',
      version: 1,
      partialize: (state) => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        activeSemesterId: state.activeSemesterId,
        customGradingSystems: state.customGradingSystems,
        settings: state.settings,
      }),
    },
  ),
)

// ── Selectors ────────────────────────────────────────────────────────────────

export const selectActiveProfile = (s: AppState) =>
  s.profiles.find((p) => p.id === s.activeProfileId)

export const selectActiveSemester = (s: AppState) => {
  const profile = selectActiveProfile(s)
  return profile?.semesters.find((sem) => sem.id === s.activeSemesterId)
}

export const selectAllGradingSystems = (s: AppState) => [
  ...GRADING_SYSTEMS,
  ...s.customGradingSystems,
]
