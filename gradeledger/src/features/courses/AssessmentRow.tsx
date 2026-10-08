import React, { useState, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { useStore } from '@/store'
import type { Assessment } from '@/types'
import { formatNumber } from '@/lib/utils'

interface Props {
  assessment: Assessment
  profileId: string
  semesterId: string
  courseId: string
}

export function AssessmentRow({ assessment, profileId, semesterId, courseId }: Props) {
  const updateAssessment = useStore((s) => s.updateAssessment)
  const deleteAssessment = useStore((s) => s.deleteAssessment)

  const contribution =
    assessment.score !== null
      ? (assessment.score / assessment.maxScore) * assessment.weight
      : null

  function handleUpdate(field: keyof Assessment, value: string) {
    if (field === 'name') {
      updateAssessment(profileId, semesterId, courseId, assessment.id, { name: value })
    } else if (field === 'weight') {
      const n = parseFloat(value)
      if (!isNaN(n) && n >= 0 && n <= 100) {
        updateAssessment(profileId, semesterId, courseId, assessment.id, { weight: n })
      }
    } else if (field === 'score') {
      if (value === '' || value === '—') {
        updateAssessment(profileId, semesterId, courseId, assessment.id, { score: null })
      } else {
        const n = parseFloat(value)
        if (!isNaN(n) && n >= 0) {
          updateAssessment(profileId, semesterId, courseId, assessment.id, { score: n })
        }
      }
    } else if (field === 'maxScore') {
      const n = parseFloat(value)
      if (!isNaN(n) && n > 0) {
        updateAssessment(profileId, semesterId, courseId, assessment.id, { maxScore: n })
      }
    }
  }

  return (
    <tr>
      <td>
        <InlineText
          value={assessment.name}
          onChange={(v) => handleUpdate('name', v)}
          placeholder="Assessment name"
        />
      </td>
      <td style={{ textAlign: 'right' }}>
        <InlineNumber
          value={assessment.weight}
          onChange={(v) => handleUpdate('weight', v)}
          suffix="%"
        />
      </td>
      <td style={{ textAlign: 'right' }}>
        <InlineNumber
          value={assessment.score}
          onChange={(v) => handleUpdate('score', v)}
          placeholder="—"
          allowNull
        />
      </td>
      <td style={{ textAlign: 'right' }}>
        <InlineNumber
          value={assessment.maxScore}
          onChange={(v) => handleUpdate('maxScore', v)}
        />
      </td>
      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
        {contribution !== null ? formatNumber(contribution, 1) : '—'}
      </td>
      <td>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={() => deleteAssessment(profileId, semesterId, courseId, assessment.id)}
          aria-label="Delete assessment"
          style={{ color: 'var(--danger)', opacity: 0.6 }}
        >
          <Trash2 size={11} />
        </button>
      </td>
    </tr>
  )
}

// Inline editable text cell
function InlineText({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setLocal(value)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 10)
  }

  function commit() {
    setEditing(false)
    if (local.trim()) onChange(local.trim())
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="input input-sm"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setEditing(false)
        }}
        style={{ width: '100%' }}
      />
    )
  }

  return (
    <span
      className="cell-editable"
      onClick={startEdit}
      style={{ display: 'inline-block', padding: '2px 4px', cursor: 'text' }}
    >
      {value || <span style={{ color: 'var(--text-4)' }}>{placeholder}</span>}
    </span>
  )
}

// Inline editable number cell
function InlineNumber({
  value,
  onChange,
  suffix,
  placeholder,
  allowNull,
}: {
  value: number | null
  onChange: (v: string) => void
  suffix?: string
  placeholder?: string
  allowNull?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value?.toString() ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setLocal(value?.toString() ?? '')
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 10)
  }

  function commit() {
    setEditing(false)
    onChange(local)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="score-input"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') setEditing(false)
        }}
        type="number"
        style={{ width: 60 }}
      />
    )
  }

  return (
    <span
      className="cell-editable"
      onClick={startEdit}
      style={{
        display: 'inline-block',
        padding: '2px 4px',
        cursor: 'text',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--text-xs)',
      }}
    >
      {value !== null ? `${value}${suffix ?? ''}` : <span style={{ color: 'var(--text-4)' }}>{placeholder ?? '—'}</span>}
    </span>
  )
}
