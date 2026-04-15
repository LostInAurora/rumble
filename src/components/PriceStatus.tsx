interface Props {
  stale: boolean
}

export function PriceStatus({ stale }: Props) {
  if (!stale) return null
  return (
    <span className="pulse-dot text-[10px] ml-1" style={{ color: 'var(--accent-yellow)' }} title="Price data is stale">
      ●
    </span>
  )
}
