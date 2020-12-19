import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import axios from 'axios';
import { ipcRenderer } from 'electron';
import { v4 as uuidv4 } from 'uuid';
import MomentTz from 'moment-timezone';
// eslint-disable-next-line import/no-cycle
import { AppThunk, RootState, AppDispatch } from '../../store';
// eslint-disable-next-line import/no-cycle
import database from '../../firebase';
import config from '../../config.json';
// eslint-disable-next-line import/no-cycle
import { UnsavedChanges } from '../../providers/itemStorage';

export interface Item extends ItemRequest {
  id: string;
  createdAt: string;
}

export interface ItemRequest {
  name: string;
  defaultDesc: string;
  rate: number;
}

export interface Items {
  [k: string]: Item;
}

export const status = {
  IDLE: 'idle',
  LOADING: 'loading',
};

const daftarBarangSlice = createSlice({
  name: 'item',
  initialState: {
    items: {} as Items,
    status: status.IDLE,
    isFetched: false,
    isSynced: false,
  },
  reducers: {
    addItem: (state, item: PayloadAction<Item>) => {
      return {
        ...state,
        items: {
          ...state.items,
          [item.payload.id]: item.payload,
        },
        status: status.IDLE,
      };
    },
    loadAllItem: (state, items: PayloadAction<Items>) => {
      return {
        ...state,
        items: items.payload,
        isFetched: true,
        status: status.IDLE,
      };
    },
    deleteItem: (state, id: PayloadAction<string>) => {
      const { [id.payload]: value, ...docsToKeep } = state.items;
      return {
        ...state,
        items: docsToKeep,
        status: status.IDLE,
      };
    },
    setLoading: (state) => {
      return {
        ...state,
        status: status.LOADING,
      };
    },
    setIdle: (state) => {
      return {
        ...state,
        status: status.IDLE,
      };
    },
    setIsSynced: (state, isSynced: PayloadAction<boolean>) => {
      return {
        ...state,
        isSynced: isSynced.payload,
      };
    },
  },
});

export const {
  addItem,
  loadAllItem,
  deleteItem,
  setIdle,
  setLoading,
  setIsSynced,
} = daftarBarangSlice.actions;

export default daftarBarangSlice.reducer;

/* POST & PUT
 * provide id if it's a put
 * Mock backend fields like uuid, prices, etc. To support offline functionality.
 * These fields will be replaced when synced on db
 */
const prepareMockPostPayload = (
  itemRequest: ItemRequest,
  id?: string
): Item => {
  // check the date is correct ------------------------------------
  return {
    ...itemRequest,
    id: id || `${uuidv4()}`,
    createdAt: MomentTz().tz('Asia/Jakarta').format('DD/MM/YYYY'),
  };
};

export const initializeOfflineItems = (): AppThunk => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    if (!getState().connection.connected) {
      dispatch(setLoading());
      const itemsLocal: Items = await ipcRenderer.invoke('items_getAll');
      dispatch(loadAllItem(itemsLocal));
    }
    // try {
    //   const res = await axios.get(`${config.serverProxy}/allItem`);
    //   if (res.data && res.status === 200) {
    //     dispatch(loadAllItem(res.data.Items));
    //     ipcRenderer.send('items_refreshNew', res.data.Items);
    //   } else {
    //     throw new Error(`${res.status}: ${res}`);
    //   }
    // } catch (e) {
    //   ipcRenderer.send('showError', `Gagal nge-load barang: ${e}`);
    //   dispatch(setIdle());
    // }
  };
};

export const addItemCall = (newItem: ItemRequest): AppThunk => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    dispatch(setLoading());
    if (!getState().connection.connected) {
      // ipcRenderer send persist data to local store
      // return if succeed
      const item: Item = prepareMockPostPayload(newItem);
      dispatch(addItem(item));
      ipcRenderer.send('items_add', item, false);
      return;
    }
    try {
      const res = await axios.post(`${config.serverProxy}/item`, newItem);
      if (res.data && res.status === 200) {
        dispatch(addItem(res.data.Item));
        ipcRenderer.send('items_add', res.data.Item, true);
      } else {
        throw new Error(`${res.status}: ${res}`);
      }
    } catch (e) {
      ipcRenderer.send('showError', `Gagal membuat barang baru: ${e}`);
      dispatch(setIdle());
    }
  };
};

export const deleteItemCall = (id: string): AppThunk => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const barangName = getState().daftarBarang.items[id].name;
    const isToDelete = await ipcRenderer.invoke(
      'confirmDelete',
      `Menghapus Barang: ${barangName}`
    );
    if (!isToDelete) {
      return;
    }
    dispatch(setLoading());
    if (!getState().connection.connected) {
      dispatch(deleteItem(id));
      ipcRenderer.send('items_delete', id, false);
      return;
    }
    try {
      const { data } = await axios.delete(`${config.serverProxy}/item/${id}`);
      if (data.Success) {
        dispatch(deleteItem(id));
        ipcRenderer.send('items_delete', id, true);
      }
    } catch (e) {
      ipcRenderer.send('showError', 'Gagal menghapus');
      dispatch(setIdle());
    }
  };
};

export const startListening = (): AppThunk => {
  return (dispatch: AppDispatch) => {
    database.ref('invoice/items').on('value', async () => {
      dispatch(setLoading());
      const { data } = await axios.get(`${config.serverProxy}/allItem`);
      if (data && data.Items) {
        dispatch(loadAllItem(data.Items));
        ipcRenderer.send('items_refreshNew', data.Items);
      }
    });
  };
};

export const stopListening = (): AppThunk => {
  return () => {
    database.ref('invoice/items').off();
  };
};

export const subscribeToSyncState = (): AppThunk => {
  return (dispatch: AppDispatch) => {
    ipcRenderer.on('items_syncStateListener', (_event, isSynced: boolean) => {
      dispatch(setIsSynced(isSynced));
    });
    ipcRenderer.send('items_syncStateListener');
  };
};

export const unsubscribeToSyncState = (): AppThunk => {
  return () => {
    ipcRenderer.send('items_removeSyncStateListener');
  };
};

/*
 *  Clean up dirty (added/updated/deleted) data in local electron-store
 */
export const syncDirtyData = (): AppThunk => {
  return async () => {
    // check if synced
    const isSynced = await ipcRenderer.invoke('items_getIsSynced');
    if (isSynced) return;

    // pull unsynced changes to delete/add
    const { toDelete, toAdd }: UnsavedChanges = await ipcRenderer.invoke(
      'items_getUnsavedChanges'
    );
    // try to delete all the marked items
    try {
      await Promise.all(
        toDelete.map(async (id) => {
          const { data } = await axios.delete(
            `${config.serverProxy}/item/${id}`
          );
          if (data.Success) {
            ipcRenderer.send('items_delete', id, true);
          }
        })
      );
    } catch (e) {
      ipcRenderer.send('showError', 'Syncing Error! (delete)');
    }
    // try to add all the marked items
    try {
      await Promise.all(
        toAdd.map(async (item: Item) => {
          const res = await axios.post(`${config.serverProxy}/item`, item);
          if (res.data && res.status === 200) {
            ipcRenderer.send('items_add', res.data.Item, true);
          }
        })
      );
    } catch (e) {
      ipcRenderer.send('showError', 'Syncing Error! (put)');
    }
    // set synced
    ipcRenderer.send('items_setSynced');
  };
};

export const getItem = (state: RootState) => state.daftarBarang.items;
export const getIsFetched = (state: RootState) => state.daftarBarang.isFetched;
export const getStatus = (state: RootState) => state.daftarBarang.status;
export const getIsSynced = (state: RootState) => state.daftarBarang.isSynced;
