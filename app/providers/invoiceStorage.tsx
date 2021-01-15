import { ipcMain } from 'electron';
// eslint-disable-next-line import/no-cycle
import { Invoice, Invoices } from '../features/invoice/invoiceSlice';

const ElectronStore = require('electron-store');

export interface FlaggedInvoice extends Invoice {
  saved: boolean;
  markedToDelete: boolean;
}

export interface UnsavedChanges {
  toDelete: string[];
  toAdd: Invoice[];
}

const schema = {
  invoices: {
    type: 'object',
    additionalProperties: {
      // invoice request
      invoice_no: { type: 'string' },
      client: { type: 'string' },
      client_address: {
        type: 'object',
        properties: {
          address: { type: 'string' },
          city: { type: 'string' },
          state: { type: 'string' },
          country: { type: 'string' },
          postal_code: { type: 'string' },
        },
      },
      catatanInvoice: { type: 'string' },
      catatanKwitansi: { type: 'string' },
      keteranganKwitansi: { type: 'string' },
      date: { type: 'string' },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            rate: { type: 'number' },
            description: { type: 'string' },
            metricQuantity: { type: 'number' },
            quantity: { type: 'number' },
            amount: { type: 'number' },
          },
        },
      },
      tax: { type: 'number' },
      // external/temp data
      id: { type: 'string' },
      createdAt: { type: 'string' },
      total: { type: 'number' },
      subtotal: { type: 'number' },
      // flags
      saved: { type: 'boolean' },
      markedToDelete: { type: 'boolean' },
    },
  },
  isSynced: {
    type: 'boolean',
    default: false,
  },
  dateInvoiceNumberMap: {
    type: 'object',
    additionalProperties: {
      type: 'number',
      default: 0,
    },
  },
};
const store = new ElectronStore({ name: 'invoice', schema });

ipcMain.handle(
  'invoices_getAll',
  async (): Promise<Invoices> => {
    // console.log('get all local invoice');
    const invoices = {} as Invoices;
    const flaggedInvoices: { [k: string]: FlaggedInvoice } = store.get(
      'invoices',
      {}
    );
    Object.keys(flaggedInvoices).forEach((key) => {
      const {
        saved,
        markedToDelete,
        ...invoice
      }: FlaggedInvoice = flaggedInvoices[key];
      invoices[key] = invoice;
    });
    return invoices;
  }
);

ipcMain.handle(
  'invoices_getUnsavedChanges',
  async (): Promise<UnsavedChanges> => {
    // console.log('get all unsaved changes');
    // returns [invoices_to_delete, invoices_to_add]
    // Rule: There shouldn't be an invoice markedToDelete and unsaved
    const allInvoice: FlaggedInvoice[] = Object.values(
      store.get('invoices', {})
    );

    return allInvoice.reduce<UnsavedChanges>(
      (
        acc: UnsavedChanges,
        { saved, markedToDelete, ...invoice }: FlaggedInvoice
      ) => {
        if (!saved) acc.toAdd.push(invoice);
        if (markedToDelete) acc.toDelete.push(invoice.id);
        return acc;
      },
      { toDelete: [], toAdd: [] } as UnsavedChanges
    );
  }
);

// replace old id with new id once added

// once synced
ipcMain.on('invoices_setSynced', () => {
  return store.set('isSynced', true);
});

// get is symced
ipcMain.handle(
  'invoices_getIsSynced',
  async (): Promise<boolean> => {
    return store.get('isSynced');
  }
);

let removeListener = () => {};
ipcMain.on('invoice_syncStateListener', (event) => {
  event.reply('invoice_syncStateListener', store.get('isSynced'));
  removeListener = store.onDidChange('isSynced', (newChange: boolean) => {
    event.reply('invoice_syncStateListener', newChange);
    // console.log("changed");
  });
});

ipcMain.on('invoice_removeSyncStateListener', (_event) => {
  // console.log('remove Listener');
  removeListener();
});

// add and put (dirty or clean)
ipcMain.on('invoices_add', (_event, invoice: Invoice, synced: boolean) => {
  // console.log('add/put invoice');
  if (!synced) store.set(`isSynced`, false);
  const flaggedInvoice: FlaggedInvoice = {
    ...invoice,
    saved: synced,
    markedToDelete: false,
  };
  store.set(`invoices.${invoice.id}`, flaggedInvoice);
});

// refresh entire data (clean)
ipcMain.on('invoices_refreshNew', (_event, invoices: Invoices) => {
  // console.log('refresh new data');
  store.set(`isSynced`, true);
  const flaggedInvoices = {} as { [k: string]: FlaggedInvoice };
  Object.keys(invoices).forEach((key) => {
    flaggedInvoices[key] = {
      ...invoices[key],
      saved: true,
      markedToDelete: false,
    };
  });
  store.set(`invoices`, flaggedInvoices);
});

// delete (dirty or clean)
ipcMain.on('invoices_delete', (_event, id: string, synced: boolean) => {
  // console.log('delete invoice');
  // If saved just mark to delete it
  if (!synced && store.get(`invoices.${id}`).saved) {
    store.set(`isSynced`, false);
    store.set(`invoices.${id}.markedToDelete`, true);
    return;
  }
  store.delete(`invoices.${id}`);
});

// get next invoice No
ipcMain.handle('invoices_getNextInvoiceNo', (_event, dateKey: string) => {
  if (!store.has(`dateInvoiceNumberMap.${dateKey}`)) {
    store.set(`dateInvoiceNumberMap.${dateKey}`, 0);
  }
  return store.get(`dateInvoiceNumberMap.${dateKey}`);
});

// set next invoice No
ipcMain.on(
  'invoices_setNextInvoiceNo',
  (_event, dateKey: string, newInvoiceNo: number) =>
    store.set(`dateInvoiceNumberMap.${dateKey}`, newInvoiceNo)
);
