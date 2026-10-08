import React, { useState } from 'react'
import {
  User,
  GraduationCap,
  Plus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit2,
  Calendar,
} from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { useStore, selectActiveProfile } from '@/store'
import { calcSemesterResult } from '@/lib/grading'
import { getGradingSystem } from '@/lib/grading'
import type { Semester } from '@/types'
import { formatNumber } from '@/lib/utils'

export function Sidebar() {
  const profiles = useStore((s) => s.profiles)
  const activeProfileId = useStore((s) => s.activeProfileId)
  const activeSemesterId = useStore((s) => s.activeSemesterId)
  const activeProfile = useStore(selectActiveProfile)
  const setActiveProfile = useStore((s) => s.setActiveProfile)
  const setActiveSemester = useStore((s) => s.setActiveSemester)
  const createProfile = useStore((s) => s.createProfile)
  const deleteProfile = useStore((s) => s.deleteProfile)
  const createSemester = useStore((s) => s.createSemester)
  const deleteSemester = useStore((s) => s.deleteSemester)
  const customSystems = useStore((s) => s.customGradingSystems)

  const [addProfileOpen, setAddProfileOpen] = useState(false)
  const [addSemesterOpen, setAddSemesterOpen] = useState(false)
  const [profilesExpanded, setProfilesExpanded] = useState(true)

  function handleAddProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    createProfile(
      fd.get('name') as string,
      fd.get('institution') as string,
      fd.get('program') as string,
    )
    setAddProfileOpen(false)
  }

  function handleAddSemester(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!activeProfileId) return
    const fd = new FormData(e.currentTarget)
    createSemester(activeProfileId, {
      name: fd.get('name') as string,
      year: parseInt(fd.get('year') as string),
      term: fd.get('term') as Semester['term'],
      isCompleted: false,
    })
    setAddSemesterOpen(false)
  }

  return (
    <nav className="sidebar" aria-label="Navigation">
      <div style={{ padding: '12px 8px' }}>
        {/* Profiles */}
        <div style={{ marginBottom: 12 }}>
          <button
            onClick={() => setProfilesExpanded(!profilesExpanded)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              padding: '4px 6px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-3)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            <span>Profiles</span>
            {profilesExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </button>

          {profilesExpanded && (
            <div style={{ marginTop: 2 }}>
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className={`sidebar-nav-item ${p.id === activeProfileId ? 'active' : ''}`}
                  onClick={() => setActiveProfile(p.id)}
                  role="button"
                  tabIndex={0}
                  aria-selected={p.id === activeProfileId}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveProfile(p.id)}
                >
                  <User size={13} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </span>
                  {profiles.length > 1 && (
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={(e) => { e.stopPropagation(); deleteProfile(p.id) }}
                      aria-label={`Delete ${p.name}`}
                      style={{ opacity: 0.5 }}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}

              <button
                className="sidebar-nav-item"
                onClick={() => setAddProfileOpen(true)}
                style={{ width: '100%', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
              >
                <Plus size={13} />
                <span>Add Profile</span>
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="divider" />

        {/* Semesters */}
        {activeProfile && (
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '4px 6px',
              marginBottom: 4,
            }}>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                Semesters
              </span>
              <button
                className="btn btn-ghost btn-icon btn-sm"
                onClick={() => setAddSemesterOpen(true)}
                aria-label="Add semester"
              >
                <Plus size={13} />
              </button>
            </div>

            {activeProfile.semesters.length === 0 ? (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-4)', padding: '8px 6px' }}>
                No semesters yet
              </p>
            ) : (
              activeProfile.semesters.map((sem) => {
                const system = getGradingSystem(activeProfile.gradingSystemId, customSystems)
                const result = calcSemesterResult(sem, system)
                return (
                  <div
                    key={sem.id}
                    className={`sidebar-nav-item ${sem.id === activeSemesterId ? 'active' : ''}`}
                    onClick={() => setActiveSemester(sem.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setActiveSemester(sem.id)}
                  >
                    <Calendar size={13} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sem.name}
                        </span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-3)', flexShrink: 0, marginLeft: 4 }}>
                          {result.sgpa !== null ? formatNumber(result.sgpa) : '—'}
                        </span>
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-4)', marginTop: 1 }}>
                        {sem.term} {sem.year} · {sem.courses.length} courses
                      </div>
                    </div>
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={(e) => { e.stopPropagation(); deleteSemester(activeProfileId!, sem.id) }}
                      aria-label={`Delete ${sem.name}`}
                      style={{ opacity: 0.5 }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Add Profile Dialog */}
      <Dialog.Root open={addProfileOpen} onOpenChange={setAddProfileOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content" aria-label="Add Profile">
            <div style={{ padding: 24 }}>
              <Dialog.Title style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 20 }}>
                New Profile
              </Dialog.Title>
              <form onSubmit={handleAddProfile} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="input" name="name" required placeholder="e.g. Alex Johnson" />
                </div>
                <div className="form-group">
                  <label className="form-label">Institution</label>
                  <input className="input" name="institution" placeholder="e.g. MIT" />
                </div>
                <div className="form-group">
                  <label className="form-label">Program</label>
                  <input className="input" name="program" placeholder="e.g. B.S. Computer Science" />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                  <Dialog.Close asChild>
                    <button type="button" className="btn btn-secondary">Cancel</button>
                  </Dialog.Close>
                  <button type="submit" className="btn btn-primary">Create Profile</button>
                </div>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Add Semester Dialog */}
      <Dialog.Root open={addSemesterOpen} onOpenChange={setAddSemesterOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content" aria-label="Add Semester">
            <div style={{ padding: 24 }}>
              <Dialog.Title style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 20 }}>
                New Semester
              </Dialog.Title>
              <form onSubmit={handleAddSemester} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input className="input" name="name" required placeholder="e.g. Semester 4" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div className="form-group">
                    <label className="form-label">Year</label>
                    <input className="input" name="year" type="number" defaultValue={new Date().getFullYear()} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Term</label>
                    <select className="input" name="term" defaultValue="Fall">
                      <option>Fall</option>
                      <option>Spring</option>
                      <option>Summer</option>
                      <option>Winter</option>
                      <option>Odd</option>
                      <option>Even</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                  <Dialog.Close asChild>
                    <button type="button" className="btn btn-secondary">Cancel</button>
                  </Dialog.Close>
                  <button type="submit" className="btn btn-primary">Create Semester</button>
                </div>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </nav>
  )
}
