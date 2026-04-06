// lib/trainingCache.ts

interface CachedTraining {
  businessId: string
  data: any[]
  timestamp: number
  expiresIn: number // milliseconds
}

class TrainingCache {
  private cache: Map<string, CachedTraining> = new Map()
  private defaultTTL = 5 * 60 * 1000 // 5 minutes

  set(businessId: string, data: any[], ttl = this.defaultTTL) {
    console.log(`💾 [CACHE] Storing training for ${businessId}`)
    this.cache.set(businessId, {
      businessId,
      data,
      timestamp: Date.now(),
      expiresIn: ttl
    })
  }

  get(businessId: string): any[] | null {
    const cached = this.cache.get(businessId)
    
    if (!cached) {
      console.log(`❌ [CACHE] Miss for ${businessId}`)
      return null
    }

    const isExpired = Date.now() - cached.timestamp > cached.expiresIn
    
    if (isExpired) {
      console.log(`⏰ [CACHE] Expired for ${businessId}`)
      this.cache.delete(businessId)
      return null
    }

    console.log(`✅ [CACHE] Hit for ${businessId}`)
    return cached.data
  }

  invalidate(businessId: string) {
    console.log(`🗑️  [CACHE] Invalidating ${businessId}`)
    this.cache.delete(businessId)
  }

  clear() {
    console.log(`🗑️  [CACHE] Clearing all`)
    this.cache.clear()
  }

  getSize() {
    return this.cache.size
  }
}

export const trainingCache = new TrainingCache()