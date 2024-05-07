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

<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZXV4MTEzZXhiMHNwZ202ZXR2cjB2ZG0xNjFvc3Bja3Z4ZTBidW83NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/K04NglqXzpvkl6j3Jm/giphy.gif" width="300" />

Add new inventory Item

<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcG9lbW5oOW9kMGRtY25lYzE1dnh2Zjc4Zmtocm9ibjZxeW8yMXNtNSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/hriFBffQzpROzZ9KpO/giphy.gif" width="300" />

Download and edit existing invoice PDF

<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExcmFwczQ2OTNtZGw4NWhoY2Q3eWhjbXcyYzFybDdiaTdqbTl4dHkzZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/yGBTmCNilFKn3b5MpK/giphy.gif" width="300" />

Error Handling when Offline and works again once the internet is available

<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbDdza2pwYjNxNmhzNzFyYXEwbmE4MnhzbjkxZDc2d2NrNHI3cmV0YSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QqURkSUDnOi01263yP/giphy.gif" width="300" />
