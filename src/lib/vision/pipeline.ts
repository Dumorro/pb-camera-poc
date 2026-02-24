import { loadOpenCV, cv } from './opencv-loader'

// Credit card dimensions in mm
const CARD_WIDTH_MM = 85.6
const CARD_HEIGHT_MM = 53.98
const CARD_RATIO = CARD_WIDTH_MM / CARD_HEIGHT_MM // ≈ 1.585
const CARD_RATIO_TOLERANCE = 0.12

export interface MeasurementResult {
  lengthCm: string
  widthCm: string         // diameter (kept for debug line)
  circumferenceCm: string // π × diameter
  marginOfErrorMm: number
  /** Debug: pixels-per-mm derived from card. ~8-12 for typical phone photos. */
  pxPerMm: number
}

export interface PipelineResult {
  measurements: MeasurementResult | null
  error: string | null
}

function releaseMats(...mats: any[]) {
  for (const m of mats) {
    try { m.delete() } catch { /* already freed */ }
  }
}

/**
 * Detect the credit card reference in the image.
 * Returns the rotated rect if found, null otherwise.
 */
function detectCard(src: any): { boundingRect: any; rotated: any } | null {
  const C = cv()
  let gray: any, blurred: any, edges: any, dilated: any
  let contours: any, hierarchy: any, kernel: any

  try {
    gray = new C.Mat()
    blurred = new C.Mat()
    edges = new C.Mat()
    dilated = new C.Mat()
    contours = new C.MatVector()
    hierarchy = new C.Mat()

    C.cvtColor(src, gray, C.COLOR_RGBA2GRAY)
    C.GaussianBlur(gray, blurred, new C.Size(5, 5), 0)
    C.Canny(blurred, edges, 40, 120)

    kernel = C.Mat.ones(3, 3, C.CV_8U)
    C.dilate(edges, dilated, kernel)

    // RETR_LIST (not RETR_EXTERNAL) so the card is found even when the A4 paper
    // is fully visible and its outer rectangle would otherwise be the only
    // EXTERNAL contour, hiding the card as an inner contour.
    C.findContours(dilated, contours, hierarchy, C.RETR_LIST, C.CHAIN_APPROX_SIMPLE)

    let bestRotated: any = null
    let bestRect: any = null

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i)
      const perimeter = C.arcLength(contour, true)
      const approx = new C.Mat()
      C.approxPolyDP(contour, approx, 0.02 * perimeter, true)

      if (approx.rows === 4) {
        const rotated = C.minAreaRect(approx)
        const w = rotated.size.width
        const h = rotated.size.height
        const longer = Math.max(w, h)
        const shorter = Math.min(w, h)

        if (longer >= 80 && shorter > 0) {
          const ratio = longer / shorter
          if (Math.abs(ratio - CARD_RATIO) <= CARD_RATIO_TOLERANCE) {
            // Pick largest matching contour
            if (bestRotated === null || longer > Math.max(bestRotated.size.width, bestRotated.size.height)) {
              bestRotated = rotated
              bestRect = C.boundingRect(approx)
            }
          }
        }
      }
      approx.delete()
    }

    if (bestRotated === null) return null
    return { boundingRect: bestRect, rotated: bestRotated }
  } finally {
    releaseMats(gray, blurred, edges, dilated, hierarchy, kernel)
    if (contours) contours.delete()
  }
}

function pixelsPerMm(rotated: any): number {
  const w = rotated.size.width
  const h = rotated.size.height
  const longerSide = Math.max(w, h)
  return longerSide / CARD_WIDTH_MM
}

function rectsOverlap(rect: any, cardRect: any, threshold = 0.3): boolean {
  // Simple AABB overlap check
  const rx = rect.x, ry = rect.y, rw = rect.width, rh = rect.height
  const cx = cardRect.x, cy = cardRect.y, cw = cardRect.width, ch = cardRect.height

  const ix = Math.max(rx, cx)
  const iy = Math.max(ry, cy)
  const iw = Math.min(rx + rw, cx + cw) - ix
  const ih = Math.min(ry + rh, cy + ch) - iy

  if (iw <= 0 || ih <= 0) return false
  const intersection = iw * ih
  const subjectArea = rw * rh
  return subjectArea > 0 && intersection / subjectArea > threshold
}

/**
 * Find the largest foreground object that doesn't overlap with the card.
 * Uses OTSU thresholding (light background → dark object) instead of skin segmentation,
 * so it works for any object color on a white/light background.
 */
function findSubjectByContrast(src: any, cardBoundingRect: any | null, pxPerMm: number): any | null {
  const C = cv()
  let gray: any, blurred: any, binary: any, closed: any, contours: any, hierarchy: any, kernel: any

  try {
    gray = new C.Mat()
    blurred = new C.Mat()
    binary = new C.Mat()
    closed = new C.Mat()
    contours = new C.MatVector()
    hierarchy = new C.Mat()

    C.cvtColor(src, gray, C.COLOR_RGBA2GRAY)
    C.GaussianBlur(gray, blurred, new C.Size(7, 7), 0)

    // OTSU: automatically finds threshold separating light background from darker object
    C.threshold(blurred, binary, 0, 255, C.THRESH_BINARY_INV + C.THRESH_OTSU)

    // Morphological close to fill gaps within the object
    kernel = C.Mat.ones(11, 11, C.CV_8U)
    C.morphologyEx(binary, closed, C.MORPH_CLOSE, kernel)

    C.findContours(closed, contours, hierarchy, C.RETR_EXTERNAL, C.CHAIN_APPROX_SIMPLE)

    let bestRotated: any = null
    let bestArea = 0
    const imgArea = src.rows * src.cols

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i)
      const area = C.contourArea(contour)

      const cardAreaPx = CARD_WIDTH_MM * CARD_HEIGHT_MM * pxPerMm * pxPerMm * 0.15
      if (area < Math.max(2000, cardAreaPx)) continue
      // Reject very large background regions (table ring surrounding paper)
      if (area > imgArea * 0.40) continue

      const br = C.boundingRect(contour)

      // Reject strip-like contours that touch a frame edge AND span most of the
      // frame in the other dimension — these are table strips visible when the
      // A4 paper doesn't fill the full frame. A compact object near the edge
      // (e.g. a plug touching the paper border) is NOT a strip and is kept.
      const touchesLeft  = br.x <= 2
      const touchesRight = br.x + br.width  >= src.cols - 2
      const touchesTop   = br.y <= 2
      const touchesBottom = br.y + br.height >= src.rows - 2
      if ((touchesLeft || touchesRight) && br.height > src.rows * 0.60) continue
      if ((touchesTop  || touchesBottom) && br.width  > src.cols * 0.60) continue

      if (cardBoundingRect && rectsOverlap(br, cardBoundingRect, 0.3)) continue

      if (area > bestArea) {
        bestArea = area
        const rotated = C.minAreaRect(contour)
        // Normalize: height = longer side
        if (rotated.size.width > rotated.size.height) {
          const tmp = rotated.size.width
          rotated.size.width = rotated.size.height
          rotated.size.height = tmp
        }
        bestRotated = rotated
      }
    }

    return bestRotated
  } finally {
    releaseMats(gray, blurred, binary, closed, hierarchy, kernel)
    if (contours) contours.delete()
  }
}

function computeMeasurements(subject: any, pxPerMm: number): MeasurementResult {
  const lengthMm = subject.size.height / pxPerMm
  const widthMm = subject.size.width / pxPerMm
  const lengthCm = (lengthMm / 10).toFixed(1)
  const widthCm = (widthMm / 10).toFixed(1)
  const circumferenceCm = (Math.PI * widthMm / 10).toFixed(1)
  const marginOfErrorMm = Math.round(lengthMm * 0.04)
  return { lengthCm, widthCm, circumferenceCm, marginOfErrorMm, pxPerMm: Math.round(pxPerMm * 10) / 10 }
}

/**
 * Run the full CV pipeline on an ImageData.
 * Returns measurements or a descriptive error string.
 */
export async function runPipeline(imageData: ImageData): Promise<PipelineResult> {
  try {
    await loadOpenCV()
  } catch (err: any) {
    // Show actual error for diagnostics
    return { measurements: null, error: `OpenCV.js falhou: ${err?.message ?? String(err)}` }
  }

  const C = cv()
  let src: any

  try {
    src = C.matFromImageData(imageData)

    // 1. Detect card
    const cardResult = detectCard(src)
    if (!cardResult) {
      return { measurements: null, error: 'Cartão de referência não encontrado. Posicione o cartão na zona indicada.' }
    }

    const pxMm = pixelsPerMm(cardResult.rotated)

    // 2. Find subject by contrast (OTSU threshold — works for any color on light background)
    const subject = findSubjectByContrast(src, cardResult.boundingRect, pxMm)
    if (!subject) {
      return { measurements: null, error: 'Objeto não detectado. Use fundo claro e certifique-se de que o objeto está visível.' }
    }

    // 3. Compute measurements
    const measurements = computeMeasurements(subject, pxMm)
    return { measurements, error: null }
  } catch (err: any) {
    return { measurements: null, error: `Erro no processamento: ${err?.message ?? err}` }
  } finally {
    releaseMats(src)
  }
}
