// @techstark/opencv-js uses a UMD/factory pattern.
// In the browser, window.cv is set to an inner factory function after the script loads.
// The correct init pattern is: call window.cv(moduleOverrides) where moduleOverrides
// becomes the Emscripten Module internally — all cv APIs are attached to it.
// Setting window.Module.onRuntimeInitialized has NO effect with this library.

let promise: Promise<void> | null = null
let _cvInstance: any = null

export function loadOpenCV(): Promise<void> {
  if (promise) return promise
  promise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      promise = null
      reject(new Error('OpenCV.js demorou demais para inicializar (timeout 25s)'))
    }, 25000)

    const s = document.createElement('script')
    s.src = '/opencv/opencv.js'

    s.onload = () => {
      try {
        // moduleOverrides IS the Emscripten Module — cv APIs are added to it in-place
        const moduleOverrides: any = {
          onRuntimeInitialized() {
            _cvInstance = moduleOverrides
            clearTimeout(timeout)
            resolve()
          },
        }
        ;(window as any).cv(moduleOverrides)
      } catch (err) {
        clearTimeout(timeout)
        promise = null
        reject(err)
      }
    }

    s.onerror = () => {
      clearTimeout(timeout)
      promise = null
      reject(new Error('script.onerror: /opencv/opencv.js não carregou (404, rede, ou CSP)'))
    }

    document.head.appendChild(s)
  })
  return promise
}

export const cv = (): any => _cvInstance
