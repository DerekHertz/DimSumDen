export type Progress = { done: number; total: number; remaining: number; next: string | null }

declare module 'claude-code' {
  interface PluginState {
    'north-star': { progress: Progress | null }
  }
}
