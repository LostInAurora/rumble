interface Props {
  stale: boolean
}

export function PriceStatus({ stale }: Props) {
  if (!stale) return null
  return (
    <span className="text-[10px] text-[var(--accent-yellow)] ml-1" title="Price data is stale">
      ●
    </span>
  )
}
