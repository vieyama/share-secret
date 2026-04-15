export const STORAGE_KEY = 'secret_views'

export function incrementViewCountAndGet(id: number): number {
    const stored = localStorage.getItem(STORAGE_KEY)
    const views = stored ? JSON.parse(stored) : {}
    const newCount = (views[id] || 0) + 1
    views[id] = newCount
    localStorage.setItem(STORAGE_KEY, JSON.stringify(views))
    return newCount
}

export function getViewCount(id: number): number {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return 0
    try {
        const views = JSON.parse(stored)
        return views[id] || 0
    } catch {
        return 0
    }
}