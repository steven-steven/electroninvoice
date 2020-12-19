import { ipcMain } from 'electron';
// eslint-disable-next-line import/no-cycle
import { Item, Items } from '../features/daftarBarang/daftarBarangSlice';

const ElectronStore = require('electron-store');

export interface FlaggedItem extends Item {
  saved: boolean;
  markedToDelete: boolean;
}

export interface UnsavedChanges {
  toDelete: string[];
  toAdd: Item[];
}

const schema = {
  items: {
    type: 'object',
    additionalProperties: {
      // item request
      name: { type: 'string' },
      defaultDesc: { type: 'string' },
      rate: { type: 'number' },
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
const store = new ElectronStore({ name: 'daftarBarang', schema });

ipcMain.handle(
  'items_getAll',
  async (): Promise<Items> => {
    // console.log('get all local items');
    const items = {} as Items;
    const flaggedItems: { [k: string]: FlaggedItem } = store.get('items', {});
    Object.keys(flaggedItems).forEach((key) => {
      const { saved, markedToDelete, ...item }: FlaggedItem = flaggedItems[key];
      items[key] = item;
    });
    return items;
  }
);

ipcMain.handle(
  'items_getUnsavedChanges',
  async (): Promise<UnsavedChanges> => {
    // console.log('get all unsaved changes');
    // returns [items_to_delete, items_to_add]
    // Rule: There shouldn't be an item markedToDelete and unsaved
    const allItem: FlaggedItem[] = Object.values(store.get('items', {}));

    return allItem.reduce<UnsavedChanges>(
      (
        acc: UnsavedChanges,
        { saved, markedToDelete, ...item }: FlaggedItem
      ) => {
        if (!saved) acc.toAdd.push(item);
        if (markedToDelete) acc.toDelete.push(item.id);
        return acc;
      },
      { toDelete: [], toAdd: [] } as UnsavedChanges
    );
  }
);

// replace old id with new id once added

// once synced
ipcMain.on('items_setSynced', () => {
  return store.set('isSynced', true);
});

// get is symced
ipcMain.handle(
  'items_getIsSynced',
  async (): Promise<boolean> => {
    return store.get('isSynced');
  }
);

let removeListener = () => {};
ipcMain.on('items_syncStateListener', (event) => {
  removeListener = store.onDidChange('isSynced', (newChange: boolean) => {
    event.reply('items_syncStateListener', newChange);
    // console.log("changed");
  });
});

ipcMain.on('items_removeSyncStateListener', () => {
  // console.log('remove Listener');
  removeListener();
});

// add and put (dirty or clean)
ipcMain.on('items_add', (_event, item: Item, synced: boolean) => {
  // console.log('add/put item');
  if (!synced) store.set(`isSynced`, false);
  const flaggedItem: FlaggedItem = {
    ...item,
    saved: synced,
    markedToDelete: false,
  };
  store.set(`items.${item.id}`, flaggedItem);
});

// refresh entire data (clean)
ipcMain.on('items_refreshNew', (_event, items: Items) => {
  // console.log('refresh new data');
  store.set(`isSynced`, true);
  const flaggedItems = {} as { [k: string]: FlaggedItem };
  Object.keys(items).forEach((key) => {
    flaggedItems[key] = {
      ...items[key],
      saved: true,
      markedToDelete: false,
    };
  });
  store.set(`items`, flaggedItems);
});

// delete (dirty or clean)
ipcMain.on('items_delete', (_event, id: string, synced: boolean) => {
  // console.log('delete item');
  // If saved just mark to delete it
  if (!synced && store.get(`items.${id}`).saved) {
    store.set(`isSynced`, false);
    store.set(`items.${id}.markedToDelete`, true);
    return;
  }
  store.delete(`items.${id}`);
});
