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
import { createObjectCsvWriter } from 'csv-writer';
import fs from 'fs';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import angkaTerbilang from '@develoka/angka-terbilang-js';
import MenuBuilder from './menu';
import { Invoice, Invoices } from './features/invoice/invoiceSlice';
import { Customer, Customers } from './features/customer/customerSlice';

require('./providers/invoiceStorage');
require('./providers/itemStorage');
require('./providers/customerStorage');

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
  const splitted = price.toString().split('.');
  if (splitted.length === 1) {
    return splitted[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }
  return `${splitted[0].replace(
    /\B(?=(\d{3})+(?!\d))/g,
    '.'
  )},${splitted[1].padEnd(3, '0')}`;
}

function savePdf(
  win: BrowserWindow,
  pdfData: Buffer,
  invoiceId: string,
  pdfType: string
) {
  const options = {
    title: 'Save file',
    defaultPath: `${app.getPath('downloads')}/${pdfType}_${invoiceId}`,
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

const prepareDocument = (invoice: Invoice, customer: Customer) => {
  if (customer.client_address) {
    const addressLine1 = [
      customer.client_address.address,
      customer.client_address.postal_code,
    ]
      .filter(Boolean)
      .join(', ');

    const addressLine2 = [
      customer.client_address.city,
      customer.client_address.state,
      customer.client_address.country,
    ]
      .filter(Boolean)
      .join(', ');

    ejse.data('addressLine1', addressLine1);
    ejse.data('addressLine2', addressLine2);
  } else {
    ejse.data('addressLine1', '');
    ejse.data('addressLine2', '');
  }
  ejse.data('catatanInvoice', invoice.catatanInvoice);
  ejse.data('catatanKwitansi', invoice.catatanKwitansi);

  if (invoice.keteranganKwitansi) {
    ejse.data('keteranganKwitansi', invoice.keteranganKwitansi);
  } else {
    ejse.data(
      'keteranganKwitansi',
      invoice.items.map((item) => item.name).join(',  ')
    );
  }

  ejse.data('client', customer.client);
  ejse.data(
    'items',
    invoice.items.map((item) => {
      const isUnitMetric = item.metricQuantity && item.metricQuantity > 0;
      return {
        ...item,
        amount: formatPrice(item.amount),
        rate: formatPrice(item.rate),
        quantity: isUnitMetric
          ? formatPrice(item.metricQuantity / 1000.0)
          : item.quantity,
        isMetric: isUnitMetric,
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
  ejse.data('id', invoice.invoice_no);

  ejse.data('iconPath', `file://${__dirname}/icon.png`);
};

ipcMain.on(
  'download-invoice',
  (_event, invoice: Invoice, customer: Customer, isKwitansi?: boolean) => {
    const pdfType = isKwitansi ? 'kwitansi' : 'invoice';
    prepareDocument(invoice, customer);

    pdfWindow = new BrowserWindow({
      show: false,
    });
    pdfWindow.loadURL(`file://${__dirname}/${pdfType}Template.ejs`);
    log.info('LOAD');
    log.info(`file://${__dirname}/${pdfType}Template.ejs`);

    pdfWindow.webContents.on('did-finish-load', () => {
      if (pdfWindow) {
        pdfWindow.webContents
          .printToPDF(pdfSettings())
          .then((data) => {
            if (mainWindow)
              return savePdf(mainWindow, data, invoice.invoice_no, pdfType);
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
  }
);

ipcMain.on(
  'view-invoice',
  (_event, invoice: Invoice, customer: Customer, isKwitansi?: boolean) => {
    const pdfType = isKwitansi ? 'kwitansi' : 'invoice';
    prepareDocument(invoice, customer);

    pdfWindow = new BrowserWindow({
      show: true,
    });
    pdfWindow.loadURL(`file://${__dirname}/${pdfType}Template.ejs`);
    log.info('LOAD');
    log.info(`file://${__dirname}/${pdfType}Template.ejs`);
  }
);

function saveCsv(win: BrowserWindow, onSave: (savePath: string) => void) {
  const options = {
    title: 'Save file',
    defaultPath: `${app.getPath('downloads')}/backup`,
    buttonLabel: 'Save',

    filters: [
      { name: 'CSV files', extensions: ['csv'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  };

  return dialog.showSaveDialog(win, options).then((result) => {
    const savePath = result.filePath;
    // clicked cancel
    if (!savePath) {
      return null;
    }
    onSave(savePath);
    return savePath;
  });
}

ipcMain.on(
  'download-csv',
  (_event, invoices: Invoices, customers: Customers) => {
    const header = [
      { id: 'id', title: 'Id' },
      { id: 'invoice_no', title: 'Invoice_no' },
      { id: 'client', title: 'Client' },
      { id: 'client_address', title: 'Client_address' },
      { id: 'catatanInvoice', title: 'CatatanInvoice' },
      { id: 'catatanKwitansi', title: 'CatatanKwitansi' },
      { id: 'keteranganKwitansi', title: 'keteranganKwitansi' },
      { id: 'date', title: 'Date' },
      { id: 'items', title: 'Items' },
      { id: 'tax', title: 'Tax' },
      { id: 'total', title: 'Total' },
      { id: 'subtotal', title: 'Subtotal' },
      { id: 'createdAt', title: 'CreatedAt' },
    ];
    const data = Object.values(invoices).reduce((acc: Array<any>, invoice) => {
      const customer = customers[invoice.customerId];
      const clientAddress = customer.client_address
        ? [
            customer.client_address.address,
            customer.client_address.postal_code,
            customer.client_address.city,
            customer.client_address.state,
            customer.client_address.country,
          ]
            .filter(Boolean)
            .join(', ')
        : '';
      const tax = Math.round((invoice.tax / 100) * invoice.subtotal);
      const items = invoice.items.reduce((accStr, item) => {
        return `${accStr}${item.name}-${item.rate}-${item.description}-${item.metricQuantity}-${item.quantity}-${item.amount},`;
      }, '');
      acc.push({ ...invoice, client_address: clientAddress, tax, items });
      return acc;
    }, []);
    if (mainWindow) {
      return saveCsv(mainWindow, (savePath) => {
        const csvWriter = createObjectCsvWriter({
          path: savePath,
          header,
        });
        csvWriter.writeRecords(data);
      });
    }
    return '';
  }
);

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
