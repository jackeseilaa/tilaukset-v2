import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {getFirestore} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD1sZvqGgg7t1zPDtJwqRprSU3amKE8PiQ",
  authDomain: "jsailing-tilaukset-v2.firebaseapp.com",
  projectId: "jsailing-tilaukset-v2",
  storageBucket: "jsailing-tilaukset-v2.firebasestorage.app",
  messagingSenderId: "338087731935",
  appId: "1:338087731935:web:fc811c9fd9834e13f43f6a"
};

export const ALLOWED_EMAIL = "jacke.seilaa@gmail.com";

export const CONFIG_READY = !FIREBASE_CONFIG.apiKey.includes("KORVAA");

export let app = null, auth = null, db = null;
if (CONFIG_READY) {
  app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  db = getFirestore(app);
}
