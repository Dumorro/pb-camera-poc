/**
 * Canvas-only quality heuristics (no OpenCV) for the live validation loop.
 * Each call takes ~1-5ms on a sampled pixel grid.
 */

const SAMPLE_STEP = 4 // sample every 4th pixel for performance

/**
 * Returns true if the image has sufficient contrast (stddev of luminance > 30).
 */
export function checkContrast(imageData: ImageData): boolean {
  const { data, width, height } = imageData
  let sum = 0
  let count = 0
  for (let y = 0; y < height; y += SAMPLE_STEP) {
    for (let x = 0; x < width; x += SAMPLE_STEP) {
      const i = (y * width + x) * 4
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      sum += lum
      count++
    }
  }
  if (count === 0) return false

  const mean = sum / count
  let variance = 0
  for (let y = 0; y < height; y += SAMPLE_STEP) {
    for (let x = 0; x < width; x += SAMPLE_STEP) {
      const i = (y * width + x) * 4
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      variance += (lum - mean) ** 2
    }
  }
  const stddev = Math.sqrt(variance / count)
  return stddev > 30
}

/**
 * Heuristic: returns true if ≥5% of sampled pixels have luminance > 180
 * (bright region suggests the white credit card reference is present).
 */
export function heuristicCardPresent(imageData: ImageData): boolean {
  const { data, width, height } = imageData
  let brightCount = 0
  let count = 0

  for (let y = 0; y < height; y += SAMPLE_STEP) {
    for (let x = 0; x < width; x += SAMPLE_STEP) {
      const i = (y * width + x) * 4
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      if (lum > 180) brightCount++
      count++
    }
  }

  return count > 0 && brightCount / count >= 0.05
}
