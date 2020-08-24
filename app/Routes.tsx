/* eslint react/jsx-props-no-spreading: off */
import React from 'react';
import { Switch, Route } from 'react-router-dom';
import routes from './constants/routes.json';
import App from './containers/App';
import HomePage from './containers/HomePage';

// Lazily load routes and code split with webpack
const LazyInvoicePage = React.lazy(() =>
  import(/* webpackChunkName: "InvoicePage" */ './containers/InvoicePage')
);

const InvoicePage = (props: Record<string, any>) => (
  <React.Suspense fallback={<h1>Loading...</h1>}>
    <LazyInvoicePage {...props} />
  </React.Suspense>
);

// Lazily load routes and code split with webpack
const LazyAddInvoicePage = React.lazy(() =>
  import(/* webpackChunkName: "AddInvoice" */ './containers/AddInvoicePage')
);

const AddInvoicePage = (props: Record<string, any>) => (
  <React.Suspense fallback={<h1>Loading...</h1>}>
    <LazyAddInvoicePage {...props} />
  </React.Suspense>
);

// Lazily load routes and code split with webpack
const LazyDaftarBarangPage = React.lazy(() =>
  import(/* webpackChunkName: "AddInvoice" */ './containers/DaftarBarangPage')
);

const DaftarBarangPage = (props: Record<string, any>) => (
  <React.Suspense fallback={<h1>Loading...</h1>}>
    <LazyDaftarBarangPage {...props} />
  </React.Suspense>
);

export default function Routes() {
  return (
    <App>
      <Switch>
        <Route path={routes.ADDINVOICE} component={AddInvoicePage} />
        <Route path={routes.DAFTARBARANG} component={DaftarBarangPage} />
        <Route path={routes.INVOICE} component={InvoicePage} />
      </Switch>
    </App>
  );
}
