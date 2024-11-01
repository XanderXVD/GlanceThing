import {
  app,
  shell,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  Notification,
  protocol,
  net
} from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { join } from 'path'

// Import van helperfuncties en modules
import {
  getStorageValue,
  setSpotifyDc,
  setStorageValue
} from './lib/storage.js'
import { isDev, log } from './lib/utils.js'
import {
  startServer,
  stopServer,
  isServerStarted,
  updateApps
} from './lib/server.js'
import {
  findCarThing,
  installApp,
  checkInstalledApp,
  forwardSocketServer,
  getAdbExecutable
} from './lib/adb.js'
import {
  getShortcuts,
  addShortcut,
  removeShortcut,
  updateShortcut,
  uploadShortcutImage,
  getShortcutImagePath,
  removeShortcutImage
} from './lib/shortcuts.js'

// Import van pictogrammen
import icon from '../../resources/icon.png?asset'
import trayIcon from '../../resources/tray.png?asset'
import { getToken } from './lib/spotify.js'

// Declaratie van de hoofdvenstervariabele
let mainWindow: BrowserWindow | null = null

// Functie voor het creëren van het hoofdvenster
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false, // Venster standaard niet tonen
    autoHideMenuBar: true, // Menu-balk automatisch verbergen
    ...(process.platform === 'linux' ? { icon } : {}), // Pictogram voor Linux
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'), // Preload script voor veiligheid
      sandbox: false // Uitschakelen van sandbox
    },
    titleBarStyle: 'hidden', // Verbergen van de titelbalk
    resizable: false, // Venster niet resizable maken
    maximizable: false, // Venster niet maximizable maken
    minimizable: true // Venster minimalizable maken
  })

  // Event handler voor wanneer het venster klaar is om te tonen
  mainWindow.on('ready-to-show', async () => {
    mainWindow!.show() // Toont het venster
    mainWindow!.center() // Centreert het venster
  })

  // Event handler voor wanneer het venster gesloten wordt
  mainWindow.on('closed', async () => {
    const firstClose = await getStorageValue('firstClose')

    // Als dit de eerste sluiting is, sla deze op en toon een notificatie
    if (firstClose !== false) {
      await setStorageValue('firstClose', false)

      new Notification({
        title: 'Still Running!',
        body: 'GlanceThing has been minimized to the system tray, and is still running in the background!'
      }).show() // Toon notificatie
    }

    mainWindow = null // Verwijder de referentie naar het venster
  })

  // Open externe URL's in de standaard browser
  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url)
    return { action: 'deny' } // Voorkomt dat het venster nieuwe tabbladen opent
  })

  // Laad de juiste URL of HTML-bestand op basis van de omgeving
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Start de applicatie en initialiseer belangrijke componenten
app.on('ready', async () => {
  if (
    process.env.NODE_ENV === 'development' &&
    (await getStorageValue('devMode')) === null
  ) {
    await setStorageValue('devMode', true)
  }

  log('Welcome!', 'GlanceThing') // Log welkom bericht
  if (await isDev()) log('Running in development mode', 'GlanceThing') // Log als in dev-modus
  electronApp.setAppUserModelId('com.bludood.glancething') // Zet gebruikersmodel-id voor Windows

  const adbPath = await getAdbExecutable().catch(err => ({ err })) // Verkrijg ADB pad

  // Log informatie over ADB pad
  if (typeof adbPath === 'object' && adbPath.err) {
    log(`Failed to get ADB executable: ${adbPath.err.message}`, 'adb')
  } else {
    if (adbPath === 'adb') log('Using system adb', 'adb')
    else log(`Using downloaded ADB from path: ${adbPath}`, 'adb')
  }

  // Start de server als de setup is voltooid
  if ((await getStorageValue('setupComplete')) === true)
    await startServer()

  await setupIpcHandlers() // Instellen van IPC-handlers
  await setupTray() // Instellen van het systeemtray

  // Behandel het ophalen van snelkoppelingen
  protocol.handle('shortcut', req => {
    const name = req.url.split('/').pop()
    if (!name) return new Response(null, { status: 404 }) // Niet gevonden
    const path = getShortcutImagePath(name.split('?')[0])
    if (!path) return new Response(null, { status: 404 }) // Niet gevonden
    return net.fetch(`file://${path}`) // Teruggeven van het afbeelding bestand
  })

  // Creëer venster tenzij het geminimaliseerd moet worden bij opstarten
  if ((await getStorageValue('launchMinimized')) !== true) createWindow()
})

// Optimaliseer sneltoetsen voor nieuw venster
app.on('browser-window-created', (_, window) => {
  optimizer.watchWindowShortcuts(window)
})

// Voorkom dat de applicatie sluit als alle vensters zijn gesloten
app.on('window-all-closed', (e: Event) => {
  e.preventDefault()
})

// Heractiveer de applicatie als het op het dock is geklikt
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// Enum voor IPC-commando's
enum IPCHandler {
  FindCarThing = 'findCarThing',
  FindSetupCarThing = 'findSetupCarThing',
  InstallApp = 'installApp',
  StartServer = 'startServer',
  StopServer = 'stopServer',
  IsServerStarted = 'isServerStarted',
  ForwardSocketServer = 'forwardSocketServer',
  GetVersion = 'getVersion',
  GetStorageValue = 'getStorageValue',
  SetStorageValue = 'setStorageValue',
  TriggerCarThingStateUpdate = 'triggerCarThingStateUpdate',
  UploadShortcutImage = 'uploadShortcutImage',
  RemoveNewShortcutImage = 'removeNewShortcutImage',
  GetShortcuts = 'getShortcuts',
  AddShortcut = 'addShortcut',
  RemoveShortcut = 'removeShortcut',
  UpdateShortcut = 'updateShortcut',
  IsDevMode = 'isDevMode',
  SetSpotifyToken = 'setSpotifyToken'
}

// Functie voor het instellen van IPC-handlers
async function setupIpcHandlers() {
  ipcMain.handle(IPCHandler.FindCarThing, async () => {
    const found = await findCarThing().catch(err => ({ err })) // Zoek naar CarThing
    if (typeof found !== 'string' && found?.err) return found.err.message // Foutmelding teruggeven
    return !!found // Geeft waar of niet waar terug
  })

  ipcMain.handle(IPCHandler.FindSetupCarThing, async () => {
    const found = await findCarThing() // Zoek naar CarThing
    if (!found) return 'not_found' // Niet geïnstalleerd

    const installed = await checkInstalledApp(found)
    if (!installed) return 'not_installed'

    return 'ready' // Klaar
  })

  ipcMain.handle(IPCHandler.InstallApp, async () => {
    const res = await installApp(null).catch(err => ({ err })) // Installeer de app
    if (res?.err) return res.err.message // Foutmelding teruggeven
    return true // Succesvol geïnstalleerd
  })

  ipcMain.handle(IPCHandler.StartServer, async () => {
    await startServer() // Start de server
  })

  ipcMain.handle(IPCHandler.StopServer, async () => {
    await stopServer() // Stop de server
  })

  ipcMain.handle(IPCHandler.IsServerStarted, async () => {
    return await isServerStarted() // Controleer of de server is gestart
  })

  ipcMain.handle(IPCHandler.ForwardSocketServer, async () => {
    await forwardSocketServer(null) // Forward de socketserver
  })

  ipcMain.handle(IPCHandler.GetVersion, () => {
    return app.getVersion() // Geef de versie van de app terug
  })

  ipcMain.handle(IPCHandler.GetStorageValue, async (_event, key) => {
    return await getStorageValue(key) // Verkrijg een waarde uit de opslag
  })

  ipcMain.handle(
    IPCHandler.SetStorageValue,
    async (_event, key, value) => {
      return await setStorageValue(key, value) // Zet een waarde in de opslag
    }
  )

  // Functie om de status van CarThing bij te werken
  async function carThingStateUpdate() {
    const found = await findCarThing().catch(err => {
      log(
        `Got an error while finding CarThing: ${err.message}`,
        'CarThingState'
      )
      return null
    })

    if (found) {
      const installed = await checkInstalledApp(found) // Controleer of de app is geïnstalleerd

      if (installed) {
        mainWindow?.webContents.send('carThingState', 'ready') // Meld dat het klaar is
        await forwardSocketServer(found) // Forward de socketserver
      } else {
        const willAutoInstall = await getStorageValue(
          'installAutomatically'
        ) // Controleer of automatisch installeren is ingeschakeld
        if (willAutoInstall) {
          mainWindow?.webContents.send('carThingState', 'installing') // Meld dat het installeren is
          await installApp(found) // Installeer de app
        } else {
          mainWindow?.webContents.send('carThingState', 'not_installed') // Meld dat het niet is geïnstalleerd
        }
      }
    } else {
      mainWindow?.webContents.send('carThingState', 'not_found') // Meld dat CarThing niet gevonden is
    }
  }

  // Interval functie om de status regelmatig bij te werken
  async function interval() {
    await carThingStateUpdate() // Voer statusupdate uit

    setTimeout(interval, 5000) // Wacht 5 seconden en voer opnieuw uit
  }

  interval() // Start de interval functie

  ipcMain.handle(IPCHandler.TriggerCarThingStateUpdate, async () => {
    await carThingStateUpdate() // Trigger handmatige statusupdate
  })

  ipcMain.handle(IPCHandler.UploadShortcutImage, async (_event, name) => {
    return await uploadShortcutImage(name) // Upload een snelkoppeling afbeelding
  })

  ipcMain.handle(IPCHandler.RemoveNewShortcutImage, async () => {
    return removeShortcutImage('new') // Verwijder nieuwe snelkoppeling afbeelding
  })

  ipcMain.handle(IPCHandler.GetShortcuts, async () => {
    return await getShortcuts() // Verkrijg een lijst met snelkoppelingen
  })

  ipcMain.handle(IPCHandler.AddShortcut, async (_event, shortcut) => {
    await addShortcut(shortcut) // Voeg een snelkoppeling toe
    await updateApps() // Werk apps bij
  })

  ipcMain.handle(IPCHandler.RemoveShortcut, async (_event, shortcut) => {
    await removeShortcut(shortcut) // Verwijder een snelkoppeling
    await updateApps() // Werk apps bij
  })

  ipcMain.handle(IPCHandler.UpdateShortcut, async (_event, shortcut) => {
    await updateShortcut(shortcut) // Werk een snelkoppeling bij
    await updateApps() // Werk apps bij
  })

  ipcMain.handle(IPCHandler.IsDevMode, async () => {
    return await isDev() // Controleer of de app in ontwikkelmodus draait
  })

  ipcMain.handle(IPCHandler.SetSpotifyToken, async (_event, token) => {
    const accessToken = await getToken(token).catch(() => null) // Verkrijg toegangstoken

    if (accessToken) {
      await setSpotifyDc(token) // Zet Spotify token
      return true // Succes
    } else {
      return false // Fout
    }
  })
}

// Functie voor het instellen van het systeemtray
async function setupTray() {
  const tray = new Tray(trayIcon) // Maak een tray icoon

  // Contextmenu voor de tray
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `GlanceThing v${app.getVersion()}`, // Toont versie
      enabled: false // Niet klikbaar
    },
    {
      type: 'separator' // Scheidingslijn in het menu
    },
    {
      label: 'Show', // Optie om het venster te tonen
      click: () => {
        if (mainWindow) {
          mainWindow.show() // Toont het venster als het bestaat
        } else {
          createWindow() // Anders, maak een nieuw venster
        }
      }
    },
    {
      label: 'Quit', // Optie om de app te sluiten
      click: () => {
        app.quit() // Sluit de app
      }
    }
  ])

  tray.setContextMenu(contextMenu) // Zet het contextmenu van de tray

  tray.setToolTip(`GlanceThing v${app.getVersion()}`) // Tooltip voor de tray

  // Event handler voor wanneer de tray geklikt wordt
  tray.on('click', () => {
    if (mainWindow) {
      mainWindow.show() // Toont het venster als het bestaat
    } else {
      createWindow() // Anders, maak een nieuw venster
    }
  })
}
