export class RateLimiter {
  private timestamps: number[] = []
  private queue: Array<{ resolve: () => void }> = []
  private maxRequests: number
  private perMs: number

  constructor(maxRequests: number, perMs: number) {
    this.maxRequests = maxRequests
    this.perMs = perMs
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.waitForSlot()
    return fn()
  }

  private waitForSlot(): Promise<void> {
    this.cleanOldTimestamps()
    if (this.timestamps.length < this.maxRequests) {
      this.timestamps.push(Date.now())
      return Promise.resolve()
    }
    return new Promise(resolve => {
      this.queue.push({ resolve })
      const oldest = this.timestamps[0]
      const waitTime = oldest + this.perMs - Date.now() + 1
      setTimeout(() => this.processQueue(), waitTime)
    })
  }

  private processQueue() {
    this.cleanOldTimestamps()
    while (this.queue.length > 0 && this.timestamps.length < this.maxRequests) {
      const next = this.queue.shift()!
      this.timestamps.push(Date.now())
      next.resolve()
    }
  }

  private cleanOldTimestamps() {
    const cutoff = Date.now() - this.perMs
    this.timestamps = this.timestamps.filter(t => t > cutoff)
  }
}
