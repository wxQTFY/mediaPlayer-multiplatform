import { BrowserWindow, app, ipcMain } from "electron";
import path from "node:path";
import os from "node:os";
import {
  registerQuasarRuntime,
  resolveElectronAssetsPath
} from "#q-app/electron/main";
import { downloadVideoFromUrl, probeVideoDownload } from "./video-download";
import { fileDialogController } from "./services/file-dialog-service";
import {
  registerLocalFileProtocol,
  registerLocalFileProtocolHandler
} from "./services/local-file-protocol";
import {
  registerMediaServerIpc,
  startMediaServer,
  stopMediaServer
} from "./services/media-server";
import {
  startTranscodeCacheCleanup,
  stopAllTranscodes,
  stopTranscodeCacheCleanup
} from "./services/transcode-manager";

// needed in case process is undefined under Linux
const platform = process.platform || os.platform();

registerLocalFileProtocol();

async function createWindow() {
  /**
   * Initial window options
   */
  const mainWindow = new BrowserWindow({
    icon: resolveElectronAssetsPath("icons/icon.png"), // Windows and Linux
    width: 1208,
    height: 768,
    minWidth: 1000,
    minHeight: 640,
    backgroundColor: "#aebbc6",
    useContentSize: true,
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      // https://v2.quasar.dev/quasar-cli-vite/developing-electron-apps/electron-preload-script
      preload: path.join(import.meta.dirname, "electron-preload.cjs")
    }
  });

  if (import.meta.env.QUASAR_DEV) {
    await mainWindow.loadURL(import.meta.env.QUASAR_APP_URL);
  } else {
    await mainWindow.loadFile("index.html");
  }

  if (import.meta.env.QUASAR_DEBUG) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools();
  } else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on("devtools-opened", () => {
      mainWindow?.webContents.closeDevTools();
    });
  }
}

void app.whenReady().then(() => {
  registerQuasarRuntime();
  registerLocalFileProtocolHandler();
  fileDialogController();
  registerMediaServerIpc();
  startTranscodeCacheCleanup();
  void startMediaServer();
  ipcMain.handle("window:minimize", () => BrowserWindow.getFocusedWindow()?.minimize());
  ipcMain.handle("window:toggle-maximize", () => {
    const focusedWindow = BrowserWindow.getFocusedWindow();
    if (!focusedWindow) return;
    if (focusedWindow.isMaximized()) {
      focusedWindow.unmaximize();
    } else {
      focusedWindow.maximize();
    }
  });
  ipcMain.handle("window:close", () => BrowserWindow.getFocusedWindow()?.close());
  ipcMain.handle("media:probe-download", (_event, url: string) => {
    return probeVideoDownload(url);
  });
  ipcMain.handle("media:download-url", (_event, url: string, suggestedName?: string) => {
    return downloadVideoFromUrl(url, suggestedName);
  });

  void createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  stopAllTranscodes();
  stopTranscodeCacheCleanup();
  stopMediaServer();
});
