import { Archive, Calendar, List, Star, Tag as TagIcon } from 'lucide-react'
import type { FilterType } from '../types/todo'

export const FILTERS: {
  key: FilterType
  label: string
  Icon: React.ComponentType<{ size?: number; className?: string }>
}[] = [
  { key: 'today', label: '날짜', Icon: Calendar },
  { key: 'all', label: '전체', Icon: List },
  { key: 'important', label: '중요', Icon: Star },
  { key: 'completed', label: '완료', Icon: Archive },
  { key: 'tag', label: '태그', Icon: TagIcon },
]
