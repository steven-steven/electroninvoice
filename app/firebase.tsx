import { firebase } from '@firebase/app';
import '@firebase/auth';
import '@firebase/database';
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

export default firebase.database();
export const auth = firebase.auth();

const provider = new firebase.auth.GoogleAuthProvider();
export const signInWithGoogle = () => {
  console.log(auth);
  auth.signInWithPopup(provider);
};
