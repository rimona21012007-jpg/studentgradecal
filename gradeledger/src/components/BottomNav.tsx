import React from 'react'
import { BookOpen, TrendingUp, BarChart2, Settings } from 'lucide-react'
import { useStore } from '@/store'

export function BottomNav() {
  const activeTab = useStore((s) => s.activeTab)
  const setActiveTab = useStore((s) => s.setActiveTab)

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {[
        { id: 'courses', label: 'Courses', icon: <BookOpen size={18} /> },
        { id: 'planner', label: 'Planner', icon: <TrendingUp size={18} /> },
        { id: 'insights', label: 'Insights', icon: <BarChart2 size={18} /> },
      ].map((item) => (
        <button
          key={item.id}
          onClick={() => setActiveTab(item.id as 'courses' | 'planner' | 'insights')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 3,
            padding: '6px 16px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: activeTab === item.id ? 'var(--accent)' : 'var(--text-3)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            transition: 'color var(--dur-fast)',
          }}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </nav>
  )
}
