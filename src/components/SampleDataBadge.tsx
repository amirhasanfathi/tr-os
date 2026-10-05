import { Badge } from './ui/Badge'

/** Subtle prototype-data label used next to mock listings. */
export function SampleDataBadge({ className }: { className?: string }) {
  return (
    <Badge tone="gray" className={className}>نمونه داده</Badge>
  )
}
