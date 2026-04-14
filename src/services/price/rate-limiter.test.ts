import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RateLimiter } from './rate-limiter'

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('allows requests within limit', async () => {
    const limiter = new RateLimiter(3, 1000)
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await limiter.execute(fn)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('queues requests exceeding limit', async () => {
    const limiter = new RateLimiter(2, 1000)
    const fn = vi.fn().mockResolvedValue('ok')
    const p1 = limiter.execute(fn)
    const p2 = limiter.execute(fn)
    const p3 = limiter.execute(fn)
    await p1
    await p2
    expect(fn).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(1001)
    await p3
    expect(fn).toHaveBeenCalledTimes(3)
  })
})
