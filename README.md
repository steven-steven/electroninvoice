Electron app that powers the DP Invoice APP. See the [Backend](https://github.com/steven-steven/GoInvoice) built in Golang.

This app is created with:
- [Electron React Boilerplate](https://electron-react-boilerplate.js.org/docs/installation)
- **Firebase Realtime DB** to subscribe to realtime events
- **Tailwind** as style library
- **ejs-electron** as a template engine for the invoice
- [react-table](https://github.com/tannerlinsley/react-table) to provide hooks fro creating custom tables
- [react-hook-form](https://react-hook-form.com/) to provide hooks for simple form creation and validations

## Starting Development
1. import `./app/config.json` file for secrets (firebase configurations and production server)
2. Start the app in the `dev` environment.

    ```bash
    yarn dev
    ```

## Packaging for Production

To package apps for the local platform:

```bash
yarn package
```

## Demo
Opening the App and edit existing invoices
![Open and edit Demo](https://github.com/steven-steven/Blog/blob/master/static/blogAssets/creating-an-invoice-app-with-electron-and-go/openAndEditDemo.gif)

Download pdf
![Download Demo](https://github.com/steven-steven/Blog/blob/master/static/blogAssets/creating-an-invoice-app-with-electron-and-go/downloadDemo.gif)

Create New Invoice
![New Item Demo](https://github.com/steven-steven/Blog/blob/master/static/blogAssets/creating-an-invoice-app-with-electron-and-go/newInvoiceDemo.gif)

Create New Item as it appears when creating new invoice
![New Item Demo](https://github.com/steven-steven/Blog/blob/master/static/blogAssets/creating-an-invoice-app-with-electron-and-go/createNewItemDemo.gif)

Error Handling when Offline and works again once the internet is available
![Offline Demo](https://github.com/steven-steven/Blog/blob/master/static/blogAssets/creating-an-invoice-app-with-electron-and-go/offlineDemo.gif)
