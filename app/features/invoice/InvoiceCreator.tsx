import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import styles from './InvoiceCreator.css';
import routes from '../../constants/routes.json';
import {
  initializeInvoices,
  addInvoiceCall,
  deleteInvoiceCall,
  updateInvoiceCall,
  selectInvoice,
} from './invoiceSlice';

export default function InvoiceCreator() {
  const dispatch = useDispatch();
  const invoices = useSelector(getInvoice);
  const selectedId = useSelector(getSelectedId);
  return (
    <div>

    </div>
  );
}
