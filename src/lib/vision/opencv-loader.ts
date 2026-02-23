let promise: Promise<void> | null = null

export function loadOpenCV(): Promise<void> {
  if (promise) return promise
  promise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      promise = null
      reject(new Error('OpenCV.js demorou demais para inicializar (timeout 25s)'))
    }, 25000)

    ;(window as any).Module = {
      onRuntimeInitialized: () => {
        clearTimeout(timeout)
        resolve()
      },
    }

    const s = document.createElement('script')
    s.src = '/opencv/opencv.js'
    s.onerror = () => {
      clearTimeout(timeout)
      promise = null
      reject(new Error('Failed to load OpenCV.js from /opencv/opencv.js'))
    }
    document.head.appendChild(s)
  })
  return promise
}

export const cv = (): any => (window as any).cv
