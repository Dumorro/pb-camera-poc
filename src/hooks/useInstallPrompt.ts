import { useState, useEffect, useRef } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const deferredEvent = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      deferredEvent.current = e as BeforeInstallPromptEvent
      setCanInstall(true)
    }

    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      deferredEvent.current = null
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const saveSettings = async (name: string, shortName: string, iconFile: File | null): Promise<void> => {
    const cache = await caches.open('pwa-meta')
    const override = { name, shortName, hasCustomIcon: iconFile !== null }
    await cache.put(
      '/pwa-manifest-override',
      new Response(JSON.stringify(override), { headers: { 'Content-Type': 'application/json' } }),
    )
    if (iconFile) {
      await cache.put(
        '/icons/custom-icon.png',
        new Response(iconFile, { headers: { 'Content-Type': iconFile.type } }),
      )
    }
  }

  const promptInstall = async (): Promise<void> => {
    if (!deferredEvent.current) return
    await deferredEvent.current.prompt()
    deferredEvent.current = null
    setCanInstall(false)
  }

  return { canInstall, isIOS, isInstalled, saveSettings, promptInstall }
}
