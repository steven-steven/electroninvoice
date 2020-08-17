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
    shipping: {
      name: 'John Doe',
      address: '1234 Main Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      postal_code: 94111,
    },
    items: [
      {
        item: 'TC 100',
        description: 'Toner Cartridge',
        quantity: 2,
        amount: 6000,
      },
      {
        item: 'USB_EXT',
        description: 'USB Cable Extender',
        quantity: 1,
        amount: 2000,
      },
    ],
    subtotal: 8000,
    paid: 0,
    invoice_nr: 1234,
  };

  const handleClick = () => {
    ipcRenderer.send('save-invoice', invoice);
  };

  return (
    <div>
      <div className="bg-gray-500 p-5 text-center">Tailwind</div>
      <form>
        <label>
          Name:
          <input type="text" name="name" />
        </label>
      </form>
      <button type="submit" onClick={() => handleClick()}>
        test
      </button>
    </div>
  );
}
