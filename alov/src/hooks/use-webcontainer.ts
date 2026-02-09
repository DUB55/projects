'use client'

import { useState, useEffect, useCallback } from 'react'
import { WebContainer } from '@webcontainer/api'

let webcontainerInstance: WebContainer | null = null

export function useWebContainer() {
  const [instance, setInstance] = useState<WebContainer | null>(webcontainerInstance)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)

  const init = useCallback(async () => {
    if (webcontainerInstance) return webcontainerInstance
    
    setLoading(true)
    try {
      webcontainerInstance = await WebContainer.boot()
      setInstance(webcontainerInstance)
      return webcontainerInstance
    } catch (err) {
      console.error('Failed to boot WebContainer:', err)
      setError(err instanceof Error ? err : new Error('Failed to boot WebContainer'))
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!webcontainerInstance) {
      init()
    } else {
      setInstance(webcontainerInstance)
    }
  }, [init])

  const mountFiles = useCallback(async (files: Record<string, string>) => {
    if (!instance) return
    
    const fileSystemTree: any = {}
    
    Object.entries(files).forEach(([path, content]) => {
      const parts = path.split('/')
      let current = fileSystemTree
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        if (i === parts.length - 1) {
          current[part] = { file: { contents: content } }
        } else {
          if (!current[part]) {
            current[part] = { directory: {} }
          }
          current = current[part].directory
        }
      }
    })
    
    await instance.mount(fileSystemTree)
  }, [instance])

  return { instance, error, loading, mountFiles }
}
