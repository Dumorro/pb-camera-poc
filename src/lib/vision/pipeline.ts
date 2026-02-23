import { loadOpenCV, cv } from './opencv-loader'

// Credit card dimensions in mm
const CARD_WIDTH_MM = 85.6
const CARD_HEIGHT_MM = 53.98
const CARD_RATIO = CARD_WIDTH_MM / CARD_HEIGHT_MM // ≈ 1.585
const CARD_RATIO_TOLERANCE = 0.12

export interface MeasurementResult {
  lengthCm: string
  widthCm: string
  marginOfErrorMm: number
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

    C.findContours(dilated, contours, hierarchy, C.RETR_EXTERNAL, C.CHAIN_APPROX_SIMPLE)

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

/**
 * Create a skin tone mask using HSV segmentation.
 */
function createSkinMask(src: any): any {
  const C = cv()
  let bgr: any, hsv: any, mask1: any, mask2: any, combined: any, closed: any, opened: any
  let closeKernel: any, openKernel: any

  try {
    bgr = new C.Mat()
    hsv = new C.Mat()
    mask1 = new C.Mat()
    mask2 = new C.Mat()
    combined = new C.Mat()
    closed = new C.Mat()
    opened = new C.Mat()

    C.cvtColor(src, bgr, C.COLOR_RGBA2BGR)
    C.cvtColor(bgr, hsv, C.COLOR_BGR2HSV)

    // Range 1: lighter skin tones
    const lower1 = new C.Mat(hsv.rows, hsv.cols, hsv.type(), [0, 20, 60, 255])
    const upper1 = new C.Mat(hsv.rows, hsv.cols, hsv.type(), [20, 255, 255, 255])
    C.inRange(hsv, lower1, upper1, mask1)
    lower1.delete()
    upper1.delete()

    // Range 2: darker skin tones
    const lower2 = new C.Mat(hsv.rows, hsv.cols, hsv.type(), [0, 10, 40, 255])
    const upper2 = new C.Mat(hsv.rows, hsv.cols, hsv.type(), [25, 180, 255, 255])
    C.inRange(hsv, lower2, upper2, mask2)
    lower2.delete()
    upper2.delete()

    C.bitwise_or(mask1, mask2, combined)

    closeKernel = C.Mat.ones(15, 15, C.CV_8U)
    openKernel = C.Mat.ones(7, 7, C.CV_8U)
    C.morphologyEx(combined, closed, C.MORPH_CLOSE, closeKernel)
    C.morphologyEx(closed, opened, C.MORPH_OPEN, openKernel)

    return opened
  } finally {
    releaseMats(bgr, hsv, mask1, mask2, combined, closed, closeKernel, openKernel)
    // opened is returned — caller must delete
  }
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
 * Find the largest skin contour that doesn't overlap with the card region.
 */
function findSubject(mask: any, cardBoundingRect: any | null): any | null {
  const C = cv()
  let contours: any, hierarchy: any

  try {
    contours = new C.MatVector()
    hierarchy = new C.Mat()
    C.findContours(mask, contours, hierarchy, C.RETR_EXTERNAL, C.CHAIN_APPROX_SIMPLE)

    let bestRotated: any = null
    let bestArea = 0

    for (let i = 0; i < contours.size(); i++) {
      const contour = contours.get(i)
      const area = C.contourArea(contour)
      if (area < 500) continue

      if (cardBoundingRect) {
        const br = C.boundingRect(contour)
        if (rectsOverlap(br, cardBoundingRect)) continue
      }

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
    releaseMats(hierarchy)
    if (contours) contours.delete()
  }
}

function computeMeasurements(subject: any, pxPerMm: number): MeasurementResult {
  const lengthMm = subject.size.height / pxPerMm
  const widthMm = subject.size.width / pxPerMm
  const lengthCm = (lengthMm / 10).toFixed(1)
  const widthCm = (widthMm / 10).toFixed(1)
  const marginOfErrorMm = Math.round(lengthMm * 0.04)
  return { lengthCm, widthCm, marginOfErrorMm }
}

/**
 * Run the full CV pipeline on an ImageData.
 * Returns measurements or a descriptive error string.
 */
export async function runPipeline(imageData: ImageData): Promise<PipelineResult> {
  try {
    await loadOpenCV()
  } catch {
    return { measurements: null, error: 'OpenCV.js não pôde ser carregado. Coloque o arquivo em /opencv/opencv.js.' }
  }

  const C = cv()
  let src: any, skinMask: any

  try {
    src = C.matFromImageData(imageData)

    // 1. Detect card
    const cardResult = detectCard(src)
    if (!cardResult) {
      return { measurements: null, error: 'Cartão de referência não encontrado. Posicione o cartão na zona indicada.' }
    }

    const pxMm = pixelsPerMm(cardResult.rotated)

    // 2. Create skin mask
    skinMask = createSkinMask(src)

    // 3. Find subject
    const subject = findSubject(skinMask, cardResult.boundingRect)
    if (!subject) {
      return { measurements: null, error: 'Objeto não detectado. Certifique-se de boa iluminação e fundo claro.' }
    }

    // 4. Compute measurements
    const measurements = computeMeasurements(subject, pxMm)
    return { measurements, error: null }
  } catch (err: any) {
    return { measurements: null, error: `Erro no processamento: ${err?.message ?? err}` }
  } finally {
    releaseMats(src, skinMask)
  }
}
