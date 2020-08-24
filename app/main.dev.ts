/* eslint global-require: off, no-console: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 */
import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import ejse from 'ejs-electron';
import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import angkaTerbilang from '@develoka/angka-terbilang-js';
import MenuBuilder from './menu';
import { Invoice } from './features/invoice/invoiceSlice';

// import InvoiceRenderer from './renderer';

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let pdfWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map((name) => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    webPreferences:
      (process.env.NODE_ENV === 'development' ||
        process.env.E2E_BUILD === 'true') &&
      process.env.ERB_SECURE !== 'true'
        ? {
            nodeIntegration: true,
          }
        : {
            preload: path.join(__dirname, 'dist/renderer.prod.js'),
          },
  });

  mainWindow.loadURL(`file://${__dirname}/app.html`);

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

if (process.env.E2E_BUILD === 'true') {
  // eslint-disable-next-line promise/catch-or-return
  app.whenReady().then(createWindow);
} else {
  app.on('ready', createWindow);
}

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

function pdfSettings() {
  const option = {
    landscape: false,
    marginsType: 1,
    pageSize: 'A4',
  };
  return option;
}

function formatPrice(price: number) {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function savePdf(win: BrowserWindow, pdfData: Buffer, invoiceId: string) {
  const options = {
    title: 'Save file',
    defaultPath: `${app.getPath('downloads')}/invoice_${invoiceId}`,
    buttonLabel: 'Save',

    filters: [
      { name: 'pdf', extensions: ['pdf'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  };

  return dialog.showSaveDialog(win, options).then((result) => {
    const savePath = result.filePath;

    // clicked cancel
    if (!savePath) {
      return null;
    }

    fs.writeFile(savePath, pdfData, (error) => {
      if (error) throw error;
      console.log('Write PDF successfully.');
      log.info('Write PDF success');
    });

    return savePath;
  });
}

ipcMain.on('save-invoice', (_event, invoice: Invoice) => {
  console.log(invoice);
  if (invoice.client_address) {
    const addressLine1 = invoice.client_address.address;
    const addressLine2 = [
      invoice.client_address.city,
      invoice.client_address.state,
      invoice.client_address.country,
    ]
      .filter(Boolean)
      .join(', ');

    ejse.data('addressLine1', addressLine1);
    ejse.data('addressLine2', addressLine2);
  }

  ejse.data('client', invoice.client);
  ejse.data(
    'items',
    invoice.items.map((item) => {
      return {
        ...item,
        amount: formatPrice(item.amount),
        rate: formatPrice(item.rate),
      };
    })
  );
  ejse.data('date', invoice.date);
  ejse.data('taxPercent', invoice.tax);
  ejse.data(
    'tax',
    formatPrice(Math.round((invoice.tax / 100) * invoice.subtotal))
  );
  ejse.data('total', formatPrice(invoice.total));
  ejse.data(
    'terbilang',
    angkaTerbilang(invoice.total.toString()).toUpperCase()
  );
  ejse.data('subtotal', formatPrice(invoice.subtotal));
  ejse.data('id', invoice.id);

  ejse.data('iconPath', `file://${__dirname}/icon.png`);

  pdfWindow = new BrowserWindow({
    show: false,
  });
  pdfWindow.loadURL(`file://${__dirname}/invoiceTemplate.ejs`);
  log.info('LOAD');
  log.info(`file://${__dirname}/invoiceTemplate.ejs`);

  pdfWindow.webContents.on('did-finish-load', () => {
    if (pdfWindow) {
      pdfWindow.webContents
        .printToPDF(pdfSettings())
        .then((data) => {
          if (mainWindow) return savePdf(mainWindow, data, invoice.id);
          return '';
        })
        .catch((error) => {
          console.log(error);
          log.info(error);
        });
    }
  });

  // if (mainWindow == null) return;
  // InvoiceRenderer.save(mainWindow, invoice);
});

ipcMain.handle(
  'confirmDelete',
  async (_event, msg: string): Promise<boolean> => {
    const options = {
      type: 'question',
      buttons: ['Cancel', 'Hapus'],
      defaultId: 2,
      title: 'Question',
      message: 'Yakin mau hapus?',
      detail: msg,
    };

    if (!mainWindow)
      return Promise.reject(new Error('Main Window is not open'));

    console.log('Open dialog');

    try {
      const { response } = await dialog.showMessageBox(mainWindow, options);
      if (response === 0) {
        // cancel pressed
        return false;
      }
      if (response === 1) {
        // Hapus is pressed
        return true;
      }
      return false;
    } catch (error) {
      log.info(error);
      return false;
    }
  }
);

ipcMain.on('showError', (_event, errorMsg: string) => {
  dialog.showErrorBox('Error', errorMsg);
});
