import { createSlice, PayloadAction } from '@reduxjs/toolkit';
// eslint-disable-next-line import/no-cycle
import axios from 'axios';
// eslint-disable-next-line import/no-cycle
import { AppThunk, RootState, AppDispatch } from '../../store';

export const status = {
  IDLE: 'idle',
  LOADING: 'loading',
};

const daftarBarangSlice = createSlice({
  name: 'invoice',
  initialState: {
    status: status.IDLE,
    isFetched: false,
  },
  reducers: {},
});

// export const {} = daftarBarangSlice.actions;

export default daftarBarangSlice.reducer;

export const getStatus = (state: RootState) => state.daftarBarang.status;
export const getIsFetched = (state: RootState) => state.daftarBarang.isFetched;
