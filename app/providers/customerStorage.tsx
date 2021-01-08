import { ipcMain } from 'electron';
// eslint-disable-next-line import/no-cycle
import { Customer, Customers } from '../features/customer/customerSlice';

const ElectronStore = require('electron-store');

export interface FlaggedCustomer extends Customer {
  saved: boolean;
  markedToDelete: boolean;
}

export interface UnsavedChanges {
  toDelete: string[];
  toAdd: Customer[];
}

const schema = {
  customers: {
    type: 'object',
    additionalProperties: {
      // customer request
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
      // external/temp data
      id: { type: 'string' },
      createdAt: { type: 'string' },
      // flags
      saved: { type: 'boolean' },
      markedToDelete: { type: 'boolean' },
    },
  },
  isSynced: {
    type: 'boolean',
    default: false,
  },
};
const store = new ElectronStore({ name: 'customer', schema });

ipcMain.handle(
  'customers_getAll',
  async (): Promise<Customers> => {
    // console.log('get all local customer');
    const customers = {} as Customers;
    const flaggedCustomers: { [k: string]: FlaggedCustomer } = store.get(
      'customers',
      {}
    );
    Object.keys(flaggedCustomers).forEach((key) => {
      const {
        saved,
        markedToDelete,
        ...customer
      }: FlaggedCustomer = flaggedCustomers[key];
      customers[key] = customer;
    });
    return customers;
  }
);

ipcMain.handle(
  'customers_getUnsavedChanges',
  async (): Promise<UnsavedChanges> => {
    // console.log('get all unsaved changes');
    // returns [customers_to_delete, customers_to_add]
    // Rule: There shouldn't be an customer markedToDelete and unsaved
    const allCustomer: FlaggedCustomer[] = Object.values(
      store.get('customers', {})
    );

    return allCustomer.reduce<UnsavedChanges>(
      (
        acc: UnsavedChanges,
        { saved, markedToDelete, ...customer }: FlaggedCustomer
      ) => {
        if (!saved) acc.toAdd.push(customer);
        if (markedToDelete) acc.toDelete.push(customer.id);
        return acc;
      },
      { toDelete: [], toAdd: [] } as UnsavedChanges
    );
  }
);

// once synced
ipcMain.on('customers_setSynced', () => {
  return store.set('isSynced', true);
});

// get is symced
ipcMain.handle(
  'customers_getIsSynced',
  async (): Promise<boolean> => {
    return store.get('isSynced');
  }
);

let removeListener = () => {};
ipcMain.on('customer_syncStateListener', (event) => {
  event.reply('customer_syncStateListener', store.get('isSynced'));
  removeListener = store.onDidChange('isSynced', (newChange: boolean) => {
    event.reply('customer_syncStateListener', newChange);
    // console.log("changed");
  });
});

ipcMain.on('customer_removeSyncStateListener', (_event) => {
  // console.log('remove Listener');
  removeListener();
});

// add and put (dirty or clean)
ipcMain.on('customers_add', (_event, customer: Customer, synced: boolean) => {
  // console.log('add/put customer');
  if (!synced) store.set(`isSynced`, false);
  const flaggedCustomer: FlaggedCustomer = {
    ...customer,
    saved: synced,
    markedToDelete: false,
  };
  store.set(`customers.${customer.id}`, flaggedCustomer);
});

// refresh entire data (clean)
ipcMain.on('customers_refreshNew', (_event, customers: Customers) => {
  // console.log('refresh new data');
  store.set(`isSynced`, true);
  const flaggedCustomers = {} as { [k: string]: FlaggedCustomer };
  Object.keys(customers).forEach((key) => {
    flaggedCustomers[key] = {
      ...customers[key],
      saved: true,
      markedToDelete: false,
    };
  });
  store.set(`customers`, flaggedCustomers);
});

// delete (dirty or clean)
ipcMain.on('customers_delete', (_event, id: string, synced: boolean) => {
  // console.log('delete customer');
  // If saved just mark to delete it
  if (!synced && store.get(`customers.${id}`).saved) {
    store.set(`isSynced`, false);
    store.set(`customers.${id}.markedToDelete`, true);
    return;
  }
  store.delete(`customers.${id}`);
});
