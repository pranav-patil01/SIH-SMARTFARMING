/**
 * src/lib/perf.ts
 * Performance monitoring, FPS profiling, and adaptive quality tiering.
 */

export interface PerfMetrics {
  fps: number;
  frameTimeMs: number;
  qualityTier: 'low' | 'med' | 'high';
  dpr: number;
  drawCalls: number;
}

class PerformanceTracker {
  private frameCount = 0;
  private lastTime = performance.now();
  private currentFps = 60;
  private consecutiveLowFpsCount = 0;

  public update(now: number, onDowngrade?: () => void): number {
    this.frameCount++;
    const delta = now - this.lastTime;

    if (delta >= 1000) {
      this.currentFps = Math.round((this.frameCount * 1000) / delta);
      this.frameCount = 0;
      this.lastTime = now;

      // Auto-downgrade check (if FPS < 40 for 3 consecutive seconds)
      if (this.currentFps < 40) {
        this.consecutiveLowFpsCount++;
        if (this.consecutiveLowFpsCount >= 3) {
          this.consecutiveLowFpsCount = 0;
          onDowngrade?.();
        }
      } else {
        this.consecutiveLowFpsCount = 0;
      }
    }

    return this.currentFps;
  }

  public getFps(): number {
    return this.currentFps;
  }
}

export const perfTracker = new PerformanceTracker();
