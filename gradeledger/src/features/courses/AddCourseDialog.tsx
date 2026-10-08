import React from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useStore } from '@/store'

interface Props {
  open: boolean
  onClose: () => void
  profileId: string
  semesterId: string
}

export function AddCourseDialog({ open, onClose, profileId, semesterId }: Props) {
  const createCourse = useStore((s) => s.createCourse)
  const allSystems = useStore((s) => [...s.customGradingSystems])
  const profile = useStore((s) => s.profiles.find((p) => p.id === profileId))

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    createCourse(profileId, semesterId, {
      name: fd.get('name') as string,
      code: fd.get('code') as string,
      credits: parseFloat(fd.get('credits') as string) || 3,
      gradingSystemId: profile?.gradingSystemId ?? 'gpa40',
      notes: '',
      isZeroCredit: fd.get('isZeroCredit') === 'on',
    })
    onClose()
  }

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content" aria-label="Add Course">
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Dialog.Title style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                Add Course
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="btn btn-ghost btn-icon"><X size={14} /></button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Course Name *</label>
                <input className="input" name="name" required placeholder="e.g. Data Structures" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="form-group">
                  <label className="form-label">Course Code</label>
                  <input className="input" name="code" placeholder="e.g. CS201" />
                </div>
                <div className="form-group">
                  <label className="form-label">Credits</label>
                  <input className="input input-number" name="credits" type="number" min="0" step="0.5" defaultValue={3} />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="isZeroCredit" name="isZeroCredit" />
                <label htmlFor="isZeroCredit" style={{ fontSize: 'var(--text-sm)', color: 'var(--text-2)', cursor: 'pointer' }}>
                  Zero-credit course (excluded from GPA)
                </label>
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <Dialog.Close asChild>
                  <button type="button" className="btn btn-secondary">Cancel</button>
                </Dialog.Close>
                <button type="submit" className="btn btn-primary">Add Course</button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
