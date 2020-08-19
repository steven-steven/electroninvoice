import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { ipcRenderer } from 'electron';
// import { Button } from '@material-ui/core';
import styles from './Invoice.css';
import routes from '../../constants/routes.json';
import {
  initializeInvoices,
  addInvoiceCall,
  deleteInvoiceCall,
  updateInvoiceCall,
  selectInvoice,
} from './invoiceSlice';

export default function Invoice() {
  const dispatch = useDispatch();
  // const invoices = useSelector(getInvoice);
  // const selectedId = useSelector(getSelectedId);

  const invoice = {
    client: 'PT A',
    client_address: {
      address: '690 King St',
      city: 'Cilegon',
      state: 'Banten',
      country: 'Indonesia',
      postal_code: 154321,
    },
    date: '24/03/2019',
    items: [
      {
        name: 'Paku',
        rate: 10000,
        quantity: 3,
        amount: 30000,
      },
    ],
    tax: 5000,
    total: 8000,
    id: 1,
  };

  const handleClick = () => {
    ipcRenderer.send('save-invoice', invoice);
  };

  return (
    <div>
      <div className="bg-gray-500 p-5 text-center">Tailwind</div>
      <form>
        Name:
        <input type="text" name="name" />
      </form>
      <button type="submit" onClick={() => handleClick()}>
        test
      </button>
    </div>
  );
}
