import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import axios from 'axios';
import { ipcRenderer } from 'electron';
// eslint-disable-next-line import/no-cycle
import { AppThunk, RootState, AppDispatch } from '../../store';
// eslint-disable-next-line import/no-cycle
import database from '../../firebase';

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
    isFetched: false,
    status: status.IDLE,
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
  },
});

export const {
  addItem,
  loadAllItem,
  deleteItem,
  setIdle,
  setLoading,
} = daftarBarangSlice.actions;

export default daftarBarangSlice.reducer;

export const initializeItems = (): AppThunk => {
  return (dispatch: AppDispatch) => {
    dispatch(setLoading());
    return axios
      .get('https://go-invoice-api.herokuapp.com/allItem')
      .then(({ data }) => {
        return dispatch(loadAllItem(data.Invoices));
      })
      .catch((e) => {
        ipcRenderer.send('showError', `Gagal nge-load barang: ${e}`);
        dispatch(setIdle());
      });
  };
};

export const addItemCall = (newItem: ItemRequest): AppThunk => {
  return (dispatch: AppDispatch) => {
    dispatch(setLoading());
    return axios
      .post('https://go-invoice-api.herokuapp.com/item', newItem)
      .then(({ data }) => {
        return dispatch(addItem(data.Item));
      })
      .catch((e) => {
        ipcRenderer.send('showError', `Gagal membuat barang baru: ${e}`);
        dispatch(setIdle());
      });
  };
};

export const deleteItemCall = (id: string): AppThunk => {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    try {
      const barangName = getState().daftarBarang.items[id].name;
      const isToDelete = await ipcRenderer.invoke(
        'confirmDelete',
        `Menghapus Barang: ${barangName}`
      );
      if (!isToDelete) {
        return;
      }
      dispatch(setLoading());
      const { data } = await axios.delete(
        `https://go-invoice-api.herokuapp.com/item/${id}`
      );
      if (data.Success) {
        dispatch(deleteItem(id));
      }
    } catch (e) {
      ipcRenderer.send('showError', 'Gagal menghapus');
      dispatch(setIdle());
    }
  };
};

export const startListening = (): AppThunk => {
  return (dispatch: AppDispatch, getState: () => RootState) => {
    database.ref('invoice/items').on('value', (_itemSnapshot) => {
      // const invoice = invoiceSnapshot.val();
      dispatch(setLoading());
      return axios
        .get('https://go-invoice-api.herokuapp.com/allItem')
        .then(({ data }) => {
          return dispatch(loadAllItem(data.Items));
        });
    });
  };
};

export const getItem = (state: RootState) => state.daftarBarang.items;
export const getIsFetched = (state: RootState) => state.daftarBarang.isFetched;
export const getStatus = (state: RootState) => state.daftarBarang.status;
