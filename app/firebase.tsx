import firebase from 'firebase/app';
import 'firebase/database';
import config from './config.json';

const firebaseConfig = {
  apiKey: config.apiKey,
  authDomain: config.authDomain,
  databaseURL: config.databaseURL,
  projectId: config.projectId,
  storageBucket: config.storageBucket,
  messagingSenderId: config.messagingSenderId,
  appId: config.appId,
  measurementId: config.measurementId,
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();

export { firebase, database as default };
