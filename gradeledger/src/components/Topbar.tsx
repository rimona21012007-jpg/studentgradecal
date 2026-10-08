import React, { useState } from 'react'
import {
  BookOpen,
  Search,
  Sun,
  Moon,
  Monitor,
  Undo2,
  Redo2,
  Download,
  Upload,
  RotateCcw,
  Settings,
  ChevronDown,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Tooltip from '@radix-ui/react-tooltip'
import { useStore } from '@/store'
import { ImportExportDialog } from './ImportExportDialog'

export function Topbar() {
  const theme = useStore((s) => s.settings.theme)
  const updateSettings = useStore((s) => s.updateSettings)
  const setCommandPaletteOpen = useStore((s) => s.setCommandPaletteOpen)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  const canUndo = useStore((s) => s.canUndo())
  const canRedo = useStore((s) => s.canRedo())
  const resetToDemo = useStore((s) => s.resetToDemo)

  const [showImportExport, setShowImportExport] = useState(false)

  const themeIcon = theme === 'light' ? <Sun size={14} /> : theme === 'dark' ? <Moon size={14} /> : <Monitor size={14} />

  return (
    <>
      <header className="topbar" role="banner">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 'auto' }}>
          <BookOpen size={16} strokeWidth={2} style={{ color: 'var(--accent)' }} />
          <span style={{ fontWeight: 700, fontSize: 'var(--text-md)', letterSpacing: '-0.01em' }}>
            GradeLedger
          </span>
        </div>

        {/* Search trigger */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => setCommandPaletteOpen(true)}
          aria-label="Open command palette"
          style={{ gap: 6 }}
        >
          <Search size={12} />
          <span style={{ color: 'var(--text-3)' }}>Search…</span>
          <kbd style={{
            marginLeft: 4,
            padding: '1px 5px',
            background: 'var(--bg-muted)',
            border: '1px solid var(--border)',
            borderRadius: 3,
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-3)',
          }}>⌘K</kbd>
        </button>

        {/* Undo/Redo */}
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                className="btn btn-ghost btn-icon"
                onClick={undo}
                disabled={!canUndo}
                aria-label="Undo"
                style={{ opacity: canUndo ? 1 : 0.4 }}
              >
                <Undo2 size={14} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="tooltip-content" sideOffset={5}>
                Undo (⌘Z)
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>

          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <button
                className="btn btn-ghost btn-icon"
                onClick={redo}
                disabled={!canRedo}
                aria-label="Redo"
                style={{ opacity: canRedo ? 1 : 0.4 }}
              >
                <Redo2 size={14} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content className="tooltip-content" sideOffset={5}>
                Redo (⌘Y)
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>

        {/* Theme toggle */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="btn btn-ghost btn-icon" aria-label="Toggle theme">
              {themeIcon}
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="select-content" sideOffset={5} align="end">
              <DropdownMenu.Item
                className="select-item"
                onClick={() => updateSettings({ theme: 'light' })}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Sun size={12} /> Light
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="select-item"
                onClick={() => updateSettings({ theme: 'dark' })}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Moon size={12} /> Dark
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="select-item"
                onClick={() => updateSettings({ theme: 'system' })}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Monitor size={12} /> System
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>

        {/* More menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="btn btn-ghost btn-sm" aria-label="More options" style={{ gap: 4 }}>
              <Settings size={13} />
              <ChevronDown size={11} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="select-content" sideOffset={5} align="end" style={{ minWidth: 180 }}>
              <DropdownMenu.Item
                className="select-item"
                onClick={() => setShowImportExport(true)}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Download size={12} /> Export / Import
              </DropdownMenu.Item>
              <DropdownMenu.Separator style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <DropdownMenu.Item
                className="select-item"
                onClick={resetToDemo}
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <RotateCcw size={12} /> Reset to Demo
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </header>

      <ImportExportDialog open={showImportExport} onClose={() => setShowImportExport(false)} />
    </>
  )
}
