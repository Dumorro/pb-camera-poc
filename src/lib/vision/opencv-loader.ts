let promise: Promise<void> | null = null

export function loadOpenCV(): Promise<void> {
  if (promise) return promise
  promise = new Promise((resolve, reject) => {
    ;(window as any).Module = { onRuntimeInitialized: resolve }
    const s = document.createElement('script')
    s.src = '/opencv/opencv.js'
    s.onerror = () => {
      promise = null
      reject(new Error('Failed to load OpenCV.js from /opencv/opencv.js'))
    }
    document.head.appendChild(s)
  })
  return promise
}

export const cv = (): any => (window as any).cv
