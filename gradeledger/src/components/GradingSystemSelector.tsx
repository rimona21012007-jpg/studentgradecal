import React from 'react'
import * as Select from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { useStore, selectAllGradingSystems } from '@/store'
import { GRADING_SYSTEMS } from '@/lib/grading'

interface Props {
  profileId: string
}

export function GradingSystemSelector({ profileId }: Props) {
  const profile = useStore((s) => s.profiles.find((p) => p.id === profileId))
  const customSystems = useStore((s) => s.customGradingSystems)
  const allSystems = [...GRADING_SYSTEMS, ...customSystems]
  const updateProfile = useStore((s) => s.updateProfile)

  if (!profile) return null

  return (
    <Select.Root
      value={profile.gradingSystemId}
      onValueChange={(val) => updateProfile(profile.id, { gradingSystemId: val })}
    >
      <Select.Trigger className="select-trigger" aria-label="Select grading system">
        <Select.Value />
        <Select.Icon><ChevronDown size={12} /></Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content className="select-content" position="popper" sideOffset={5}>
          <Select.Viewport>
            {allSystems.map((sys) => (
              <Select.Item key={sys.id} value={sys.id} className="select-item">
                <Select.ItemText>{sys.name}</Select.ItemText>
                <Select.ItemIndicator style={{ marginLeft: 'auto' }}>
                  <Check size={12} />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  )
}
