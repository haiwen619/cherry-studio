import { contextBridge, ipcRenderer, webFrame, webUtils } from 'electron'

const electronAPI = {
  ipcRenderer: {
    send(channel: string, ...args: any[]) {
      ipcRenderer.send(channel, ...args)
    },
    sendTo(webContentsId: number, channel: string, ...args: any[]) {
      ipcRenderer.sendTo(webContentsId, channel, ...args)
    },
    sendSync(channel: string, ...args: any[]) {
      return ipcRenderer.sendSync(channel, ...args)
    },
    sendToHost(channel: string, ...args: any[]) {
      ipcRenderer.sendToHost(channel, ...args)
    },
    postMessage(channel: string, message: any, transfer?: MessagePort[]) {
      ipcRenderer.postMessage(channel, message, transfer)
    },
    invoke(channel: string, ...args: any[]) {
      return ipcRenderer.invoke(channel, ...args)
    },
    on(channel: string, listener: (...args: any[]) => void) {
      ipcRenderer.on(channel, listener)
      return () => {
        ipcRenderer.removeListener(channel, listener)
      }
    },
    once(channel: string, listener: (...args: any[]) => void) {
      ipcRenderer.once(channel, listener)
      return () => {
        ipcRenderer.removeListener(channel, listener)
      }
    },
    removeListener(channel: string, listener: (...args: any[]) => void) {
      ipcRenderer.removeListener(channel, listener)
      return this
    },
    removeAllListeners(channel: string) {
      ipcRenderer.removeAllListeners(channel)
    }
  },
  webFrame: {
    insertCSS(css: string) {
      return webFrame.insertCSS(css)
    },
    setZoomFactor(factor: number) {
      if (typeof factor === 'number' && factor > 0) webFrame.setZoomFactor(factor)
    },
    setZoomLevel(level: number) {
      if (typeof level === 'number') webFrame.setZoomLevel(level)
    }
  },
  webUtils: {
    getPathForFile(file: File) {
      return webUtils.getPathForFile(file)
    }
  },
  process: {
    get platform() {
      return process.platform
    },
    get versions() {
      return process.versions
    },
    get env() {
      return { ...process.env }
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
  } catch (error) {
    console.error('[Preload]Failed to expose APIs:', error as Error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
}
