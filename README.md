<p align="center">
  <img src="https://steven-steven.github.io/electroninvoice/readme_assets/dpLogo.jpg" width="50" />
 </p>

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

Add + Edit Invoice

<img src="https://steven-steven.github.io/electroninvoice/readme_assets/create.gif" width="300" />

Add new inventory Item

<img src="https://steven-steven.github.io/electroninvoice/readme_assets/newItem.gif" width="300" />

Download and edit existing invoice PDF

<img src="https://steven-steven.github.io/electroninvoice/readme_assets/editPdf.gif" width="300" />

Error Handling when Offline and works again once the internet is available

<img src="https://steven-steven.github.io/Blog/assets/images/blogAssets/creating-an-invoice-app-with-electron-and-go/offlineDemo.gif" width="300" />
