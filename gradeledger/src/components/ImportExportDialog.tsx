import React, { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Download, Upload, X } from 'lucide-react'
import { useStore } from '@/store'

interface Props {
  open: boolean
  onClose: () => void
}

export function ImportExportDialog({ open, onClose }: Props) {
  const exportJSON = useStore((s) => s.exportJSON)
  const importJSON = useStore((s) => s.importJSON)
  const [error, setError] = useState('')

  function handleExport() {
    const json = exportJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gradeledger-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        importJSON(ev.target?.result as string)
        setError('')
        onClose()
      } catch (err) {
        setError('Invalid file format. Please select a GradeLedger JSON backup.')
      }
    }
    reader.readAsText(file)
  }

  function exportCSV() {
    const store = useStore.getState()
    const rows = ['Profile,Semester,Course,Code,Credits,Grade,GPA Points']
    store.profiles.forEach((profile) => {
      profile.semesters.forEach((sem) => {
        sem.courses.forEach((course) => {
          rows.push(`"${profile.name}","${sem.name}","${course.name}","${course.code}",${course.credits},,`)
        })
      })
    })
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gradeledger-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content" aria-label="Export and Import">
          <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <Dialog.Title style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                Export / Import
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="btn btn-ghost btn-icon"><X size={14} /></button>
              </Dialog.Close>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="panel">
                <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 4 }}>Export</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginBottom: 12 }}>
                  Download a full backup of all your profiles, semesters, and grades.
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={handleExport} style={{ gap: 6 }}>
                    <Download size={12} /> JSON Backup
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={exportCSV} style={{ gap: 6 }}>
                    <Download size={12} /> CSV Export
                  </button>
                </div>
              </div>

              <div className="panel">
                <p style={{ fontWeight: 600, fontSize: 'var(--text-sm)', marginBottom: 4 }}>Import</p>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginBottom: 12 }}>
                  Restore from a GradeLedger JSON backup. This will replace all current data.
                </p>
                <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer', gap: 6 }}>
                  <Upload size={12} /> Choose File
                  <input type="file" accept=".json" onChange={handleImport} style={{ display: 'none' }} />
                </label>
                {error && <p className="form-error" style={{ marginTop: 8 }}>{error}</p>}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
