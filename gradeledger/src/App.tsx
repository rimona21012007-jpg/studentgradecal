import React, { useEffect } from 'react'
import './index.css'
import { useStore } from './store'
import { AppLayout } from './components/AppLayout'

function App() {
  const theme = useStore((s) => s.settings.theme)

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      root.setAttribute('data-theme', mq.matches ? 'dark' : 'light')
      const handler = (e: MediaQueryListEvent) => {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light')
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    } else {
      root.setAttribute('data-theme', theme)
    }
  }, [theme])

  return <AppLayout />
}

export default App
