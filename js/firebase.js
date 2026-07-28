import {initializeApp} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {getFirestore} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// TÄYTETÄÄN kun uusi Firebase-projekti on luotu konsolissa (ks. FIREBASE_SETUP.md).
// Kunnes apiKey on vaihdettu, CONFIG_READY on false ja sovellus näyttää asetusbannerin
// kirjautumisruudun sijaan (sama malli kuin vanhassa tilaukset-sovelluksessa).
export const FIREBASE_CONFIG = {
  apiKey: "KORVAA_UUDELLA_API_KEYLLA",
  authDomain: "KORVAA.firebaseapp.com",
  projectId: "KORVAA",
  storageBucket: "KORVAA.firebasestorage.app",
  messagingSenderId: "KORVAA",
  appId: "KORVAA"
};

export const ALLOWED_EMAIL = "jacke.seilaa@gmail.com";

export const CONFIG_READY = !FIREBASE_CONFIG.apiKey.includes("KORVAA");

export let app = null, auth = null, db = null;
if (CONFIG_READY) {
  app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  db = getFirestore(app);
}
