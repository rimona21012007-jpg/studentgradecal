import React, { useEffect } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { MainWorkspace } from './MainWorkspace'
import { BottomNav } from './BottomNav'
import { CommandPalette } from './CommandPalette'
import { useStore } from '@/store'

export function AppLayout() {
  const setCommandPaletteOpen = useStore((s) => s.setCommandPaletteOpen)
  const undo = useStore((s) => s.undo)
  const redo = useStore((s) => s.redo)
  
  // Stable primitive values for undo/redo
  const canUndo = useStore((s) => s.past.length > 0)
  const canRedo = useStore((s) => s.future.length > 0)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey

      if (mod && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
      if (mod && !e.shiftKey && e.key === 'z' && canUndo) {
        e.preventDefault()
        undo()
      }
      if ((mod && e.shiftKey && e.key === 'z') || (mod && e.key === 'y')) {
        if (canRedo) {
          e.preventDefault()
          redo()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setCommandPaletteOpen, undo, redo, canUndo, canRedo])

  return (
    <Tooltip.Provider>
      <div className="app-layout">
        <Topbar />
        <Sidebar />
        <main className="main-content" id="main-content">
          <MainWorkspace />
        </main>
        <BottomNav />
        <CommandPalette />
      </div>
    </Tooltip.Provider>
  )
}
