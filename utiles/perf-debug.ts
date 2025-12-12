/**
 * Performance debugging utilities
 * Use these to identify bottlenecks in the editor
 */

// Track render counts per component
const renderCounts = new Map<string, number>();
const renderTimes = new Map<string, number[]>();

/**
 * Track component render - call at the top of your component
 * @example
 * function MyComponent() {
 *   trackRender('MyComponent');
 *   // ...
 * }
 */
export function trackRender(componentName: string): void {
  const count = (renderCounts.get(componentName) || 0) + 1;
  renderCounts.set(componentName, count);

  if (count % 10 === 0) {
    console.log(`[PERF] ${componentName} rendered ${count} times`);
  }
}

/**
 * Measure execution time of a function
 * @example
 * const result = measure('heavyOperation', () => doHeavyWork());
 */
export function measure<T>(label: string, fn: () => T): T {
  const start = performance.now();
  const result = fn();
  const duration = performance.now() - start;

  // Track last 10 measurements
  const times = renderTimes.get(label) || [];
  times.push(duration);
  if (times.length > 10) times.shift();
  renderTimes.set(label, times);

  if (duration > 16) {
    // More than one frame (16ms at 60fps)
    console.warn(
      `[PERF] ${label} took ${duration.toFixed(2)}ms (> 16ms frame budget)`
    );
  }

  return result;
}

/**
 * Log current performance stats
 */
export function logPerfStats(): void {
  console.log("=== Performance Stats ===");

  console.log("\nRender counts:");
  renderCounts.forEach((count, name) => {
    console.log(`  ${name}: ${count}`);
  });

  console.log("\nAverage render times:");
  renderTimes.forEach((times, label) => {
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);
    console.log(`  ${label}: avg=${avg.toFixed(2)}ms, max=${max.toFixed(2)}ms`);
  });
}

/**
 * Reset all tracking
 */
export function resetPerfStats(): void {
  renderCounts.clear();
  renderTimes.clear();
}

/**
 * Log image info for debugging
 */
export function logImageInfo(
  label: string,
  uri: string,
  width: number,
  height: number
): void {
  const megapixels = (width * height) / 1000000;
  const isLarge = megapixels > 5; // > 5MP is considered large (matches app limit)

  if (isLarge) {
    console.warn(
      `[PERF] ${label}: Large image detected! ${width}x${height} (${megapixels.toFixed(1)}MP)`
    );
  } else {
    console.log(
      `[PERF] ${label}: ${width}x${height} (${megapixels.toFixed(1)}MP)`
    );
  }
}

/**
 * Create a render tracker hook
 */
export function createRenderTracker(componentName: string) {
  let lastRenderTime = 0;
  let renderCount = 0;

  return {
    onRender: () => {
      const now = performance.now();
      const delta = lastRenderTime ? now - lastRenderTime : 0;
      renderCount++;
      lastRenderTime = now;

      // Warn if rendering too frequently (more than 60fps)
      if (delta > 0 && delta < 16) {
        console.warn(
          `[PERF] ${componentName} rendering too fast! Delta: ${delta.toFixed(2)}ms`
        );
      }

      return { renderCount, delta };
    },
    getRenderCount: () => renderCount,
  };
}

// Global flag to enable/disable performance logging
let perfLoggingEnabled = __DEV__ ?? false;

export function enablePerfLogging(enabled: boolean): void {
  perfLoggingEnabled = enabled;
  console.log(`[PERF] Logging ${enabled ? "enabled" : "disabled"}`);
}

export function isPerfLoggingEnabled(): boolean {
  return perfLoggingEnabled;
}
