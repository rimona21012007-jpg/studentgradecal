import React from 'react'
import * as Tabs from '@radix-ui/react-tabs'
import { useStore, selectActiveProfile, selectActiveSemester } from '@/store'
import { CoursesTable } from '@/features/courses/CoursesTable'
import { SummaryPanel } from '@/features/courses/SummaryPanel'
import { PlannerView } from '@/features/planner/PlannerView'
import { InsightsView } from '@/features/insights/InsightsView'
import { GradingSystemSelector } from './GradingSystemSelector'

export function MainWorkspace() {
  const activeProfile = useStore(selectActiveProfile)
  const activeSemester = useStore(selectActiveSemester)
  const activeTab = useStore((s) => s.activeTab)
  const setActiveTab = useStore((s) => s.setActiveTab)

  if (!activeProfile) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: 48, opacity: 0.2 }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        </div>
        <p style={{ fontSize: 'var(--text-md)', fontWeight: 600 }}>No profile selected</p>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-3)' }}>
          Add a profile from the sidebar to get started
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Workspace header */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 'var(--text-md)', fontWeight: 700 }}>{activeProfile.name}</h1>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginTop: 1 }}>
            {activeProfile.institution} · {activeProfile.program}
          </p>
        </div>

        <GradingSystemSelector profileId={activeProfile.id} />
      </div>

      {/* Tabs */}
      <Tabs.Root
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <div style={{
          padding: '8px 20px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-overlay)',
        }}>
          <Tabs.List className="tabs-list" aria-label="Main navigation" style={{ display: 'inline-flex', width: 'auto' }}>
            <Tabs.Trigger className="tab-trigger" value="courses">Courses</Tabs.Trigger>
            <Tabs.Trigger className="tab-trigger" value="planner">Planner</Tabs.Trigger>
            <Tabs.Trigger className="tab-trigger" value="insights">Insights</Tabs.Trigger>
          </Tabs.List>
        </div>

        <Tabs.Content value="courses" style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', height: '100%' }}>
            <CoursesTable profile={activeProfile} semester={activeSemester ?? null} />
            <SummaryPanel profile={activeProfile} />
          </div>
        </Tabs.Content>

        <Tabs.Content value="planner" style={{ flex: 1, overflow: 'auto' }}>
          <PlannerView profile={activeProfile} />
        </Tabs.Content>

        <Tabs.Content value="insights" style={{ flex: 1, overflow: 'auto' }}>
          <InsightsView profile={activeProfile} />
        </Tabs.Content>
      </Tabs.Root>
    </div>
  )
}
