import { Badge } from './ui/Badge'
import type { JobSource } from '../types'

const sourceTone: Record<JobSource, 'blue' | 'green' | 'amber' | 'violet' | 'navy' | 'gray'> = {
  'LinkedIn': 'blue',
  'Kariyer.net': 'green',
  'Elemen': 'amber',
  'Partner': 'violet',
  'Community': 'gray',
  'TR Life': 'navy',
}

export function SourceBadge({ source }: { source: JobSource }) {
  return <Badge tone={sourceTone[source]}>{source}</Badge>
}
