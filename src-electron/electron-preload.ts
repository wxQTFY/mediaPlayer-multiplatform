/**
 * This file is used specifically for security reasons.
 * Here you can securely expose privileged APIs into the renderer process
 * by leveraging Electron's contextBridge functionality and communicating
 * with the main process through Electron's inter-process communication (IPC).
 *
 * WARNING!
 * The preload script sandboxing offers limited access to a full Node.js environment.
 * Do NOT attempt to import packages from node_modules or use Node.js APIs directly in this file.
 * Instead, use IPC to communicate with the main process and access packages and Node.js
 * functionality there.
 *
 * Example on injecting window.myAPI.doAThing() into renderer thread:
 *
 *   import { contextBridge } from 'electron'
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 *
 * Preload script documentation:
 * https://www.electronjs.org/docs/latest/tutorial/tutorial-preload
 */

import { contextBridge, ipcRenderer, webUtils } from "electron";
import { quasarRuntime } from "#q-app/electron/preload";

/**
 * Can be used in the renderer process through `window.quasarRuntime`
 */
contextBridge.exposeInMainWorld("quasarRuntime", quasarRuntime);
contextBridge.exposeInMainWorld("electronWindow", {
  minimize: () => ipcRenderer.invoke("window:minimize"),
  toggleMaximize: () => ipcRenderer.invoke("window:toggle-maximize"),
  close: () => ipcRenderer.invoke("window:close")
});
contextBridge.exposeInMainWorld("electronMedia", {
  probeDownload: (url: string) => ipcRenderer.invoke("media:probe-download", url),
  downloadUrl: (url: string, suggestedName?: string) =>
    ipcRenderer.invoke("media:download-url", url, suggestedName)
});
contextBridge.exposeInMainWorld("api", {
  app: {
    versions: { ...process.versions }
  },
  window: {
    minimize: () => ipcRenderer.invoke("window:minimize"),
    maximize: () => ipcRenderer.invoke("window:toggle-maximize"),
    close: () => ipcRenderer.invoke("window:close")
  },
  media: {
    openFiles: (currentList?: unknown[]) => ipcRenderer.invoke("dialog:openFile", currentList ?? []),
    getPathForFile: (file: File) => webUtils.getPathForFile(file),
    importDroppedFiles: (filePaths: string[], currentList?: unknown[]) =>
      ipcRenderer.invoke("dialog:importDroppedFiles", filePaths, currentList ?? []),
    prepareFile: (id: string) => ipcRenderer.invoke("media:prepareFile", id),
    prepareStream: (id: string, duration: number) =>
      ipcRenderer.invoke("media:prepareStream", id, duration),
    removeTranscodeCaches: (ids: string[]) => ipcRenderer.invoke("media:removeTranscodeCaches", ids),
    probeDownload: (url: string) => ipcRenderer.invoke("media:probe-download", url),
    downloadUrl: (url: string, suggestedName?: string) =>
      ipcRenderer.invoke("media:download-url", url, suggestedName)
  }
});
