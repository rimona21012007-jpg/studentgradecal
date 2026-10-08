import React, { useEffect, useRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import {
  Search,
  BookOpen,
  Plus,
  Undo2,
  Redo2,
  Sun,
  Moon,
  RotateCcw,
  TrendingUp,
  BarChart2,
  Download,
} from 'lucide-react'
import { useStore } from '@/store'

interface Command {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  shortcut?: string
}

export function CommandPalette() {
  const open = useStore((s) => s.commandPaletteOpen)
  const setOpen = useStore((s) => s.setCommandPaletteOpen)
  const setActiveTab = useStore((s) => s.setActiveTab)
  const updateSettings = useStore((s) => s.updateSettings)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const resetToDemo = useStore((s) => s.resetToDemo)
  const createSemester = useStore((s) => s.createSemester)
  const activeProfileId = useStore((s) => s.activeProfileId)

  const [query, setQuery] = React.useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  const commands: Command[] = [
    { id: 'nav-courses', label: 'Go to Courses', icon: <BookOpen size={14} />, action: () => setActiveTab('courses') },
    { id: 'nav-planner', label: 'Go to Planner', icon: <TrendingUp size={14} />, action: () => setActiveTab('planner') },
    { id: 'nav-insights', label: 'Go to Insights', icon: <BarChart2 size={14} />, action: () => setActiveTab('insights') },
    { id: 'theme-light', label: 'Set Light Theme', icon: <Sun size={14} />, action: () => updateSettings({ theme: 'light' }) },
    { id: 'theme-dark', label: 'Set Dark Theme', icon: <Moon size={14} />, action: () => updateSettings({ theme: 'dark' }) },
    { id: 'undo', label: 'Undo', icon: <Undo2 size={14} />, action: undo, shortcut: '⌘Z' },
    { id: 'redo', label: 'Redo', icon: <Redo2 size={14} />, action: redo, shortcut: '⌘Y' },
    { id: 'reset', label: 'Reset to Demo Data', icon: <RotateCcw size={14} />, action: resetToDemo },
  ]

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  )

  function run(cmd: Command) {
    cmd.action()
    setOpen(false)
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content
          aria-label="Command palette"
          style={{
            position: 'fixed',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(560px, calc(100vw - 32px))',
            background: 'var(--bg-overlay)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            zIndex: 100,
            boxShadow: '0 16px 48px hsl(0 0% 0% / 0.2)',
          }}
        >
          <Dialog.Title style={{ display: 'none' }}>Command Palette</Dialog.Title>
          
          {/* Search input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
            <Search size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              className="cmdk-input"
              placeholder="Search commands…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd style={{
              padding: '2px 6px',
              background: 'var(--bg-muted)',
              border: '1px solid var(--border)',
              borderRadius: 4,
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-3)',
              flexShrink: 0,
            }}>Esc</kbd>
          </div>

          {/* Results */}
          <div style={{ padding: 4, maxHeight: 320, overflow: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-4)', fontSize: 'var(--text-sm)' }}>
                No commands found
              </div>
            ) : (
              filtered.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => run(cmd)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    width: '100%',
                    padding: '8px 12px',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    color: 'var(--text-1)',
                    fontSize: 'var(--text-sm)',
                    textAlign: 'left',
                    transition: 'background-color var(--dur-fast)',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-muted)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ color: 'var(--text-3)' }}>{cmd.icon}</span>
                  <span style={{ flex: 1 }}>{cmd.label}</span>
                  {cmd.shortcut && (
                    <kbd style={{
                      padding: '1px 5px',
                      background: 'var(--bg-muted)',
                      border: '1px solid var(--border)',
                      borderRadius: 3,
                      fontSize: '10px',
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--text-3)',
                    }}>{cmd.shortcut}</kbd>
                  )}
                </button>
              ))
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
