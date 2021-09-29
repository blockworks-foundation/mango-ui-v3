// Native
import { format } from 'url'
import { join, normalize } from 'path'

// Packages
import { BrowserWindow, app, ipcMain, IpcMainEvent, protocol } from 'electron'
import isDev from 'electron-is-dev'
import prepareNext from 'electron-next'

// Prepare the renderer once the app is ready
app.on('ready', async () => {
  const urlRoot = normalize(`${__dirname}/../out`)
  protocol.interceptFileProtocol('file', (request, callback) => {
    let filename = request.url
    if (filename.startsWith('file://')) {
      filename = filename.substr(7)
    }

    if (filename.startsWith('/')) {
      filename = join(urlRoot, filename)
    }

    filename = filename.split('?')[0]
    filename = filename.split('#')[0]
    filename = normalize(filename)

    callback({ path: filename })
  })

  await prepareNext('.')

  const mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: false,
      preload: join(__dirname, 'preload.js'),
    },
  })

  const url = isDev
    ? 'http://localhost:8000/'
    : format({
        pathname: '/index.html',
        protocol: 'file:',
        slashes: true,
      })

  mainWindow.loadURL(url)
})

// Quit the app once all windows are closed
app.on('window-all-closed', app.quit)

// listen the channel `message` and resend the received message to the renderer process
ipcMain.on('message', (event: IpcMainEvent, message: any) => {
  console.log(message)
  setTimeout(() => event.sender.send('message', 'hi from electron'), 500)
})
